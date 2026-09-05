// The Cloud Functions for Firebase SDK to create Cloud Functions and triggers.
const crypto = require("crypto");

const { logger } = require("firebase-functions");
const { defineSecret } = require("firebase-functions/params");
const { onSchedule } = require("firebase-functions/v2/scheduler");

// The Firebase Admin SDK to access Firestore.
const { initializeApp } = require("firebase-admin/app");
const {
  getFirestore,
  FieldValue,
  Timestamp,
} = require("firebase-admin/firestore");
const {
  SEASON,
  LEAGUE_ID,
  INVITABLE_ROLES,
  fetchAllMatchData,
  addMemberToGroup,
  removeMemberFromGroup,
  queueOldMembershipCleanup,
} = require("./helperFunctions");
const { runUpdateJob } = require("./updateJob");
const {
  TRACKED_LEAGUES,
  resolveLeagueTargets,
  syncLeagueTeams,
} = require("./leagueCatalogue");
const { standingsDocRef, syncStandings } = require("./standings");
const { DECIDED, IN_PLAY } = require("./bracket");
const { onCall, HttpsError, onRequest } = require("firebase-functions/https");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { computeMatchXp } = require("./gamification/computeMatchXp");
const { applyXpDelta } = require("./gamification/progressStore");
const { runGamificationReconcile } = require("./gamification/reconcileJob");

const nodemailer = require("nodemailer");

// --- SECRETS ---
// Set these once with:
//   firebase functions:secrets:set FOOTBALL_API_KEY
//   firebase functions:secrets:set GMAIL_APP_PASSWORD
const FOOTBALL_API_KEY = defineSecret("FOOTBALL_API_KEY");
const GMAIL_APP_PASSWORD = defineSecret("GMAIL_APP_PASSWORD");

const CONTACT_EMAIL = "kalum@11votes.com";

// Default ceiling so a traffic spike or retry storm can't scale out unbounded.
const MAX_INSTANCES = 10;

// UIDs allowed to run admin-only callables. Comma-separated, set in
// functions/.env. Default-deny: with nothing configured, nobody passes, so an
// unset value can never leave an admin function open.
const ADMIN_UIDS = String(process.env.ADMIN_UIDS || "")
  .split(",")
  .map((uid) => uid.trim())
  .filter(Boolean);

/**
 * Gate for callables that only the site operator should run.
 * @param {string|undefined} uid - The caller's auth uid.
 */
const assertAdmin = (uid) => {
  if (!uid) {
    throw new HttpsError("unauthenticated", "Auth required.");
  }

  if (!ADMIN_UIDS.includes(uid)) {
    throw new HttpsError("permission-denied", "Admins only.");
  }
};

initializeApp();

const db = getFirestore(); // Initialize once

// Built lazily so the scheduled functions, which never send mail, don't pay
// for it on every cold start.
let transporter = null;
const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: CONTACT_EMAIL,
        pass: GMAIL_APP_PASSWORD.value(),
      },
    });
  }
  return transporter;
};

/**
 * Escapes user-supplied text before it is interpolated into an HTML email.
 * @param {string} value - Raw user input.
 * @return {string} The HTML-safe equivalent.
 */
const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

exports.createUserDoc = onCall(
  { maxInstances: MAX_INSTANCES },
  async (request) => {
    // Identity comes from the verified auth context, never from the payload —
    // otherwise any caller could overwrite any user's document.
    const uid = request.auth?.uid;

    if (!uid) {
      throw new HttpsError(
        "unauthenticated",
        "The function must be called while authenticated.",
      );
    }

    const { displayName, photoURL, providerId } = request.data ?? {};
    const email = request.auth.token?.email || request.data?.email;

    if (!email) {
      throw new HttpsError("invalid-argument", "Missing email");
    }

    try {
      const userRef = db.collection("users").doc(uid);

      // merge:true — a plain set() here would wipe activeGroup, leagueTeams,
      // lastTransferDates and role on any repeat call.
      await userRef.set(
        {
          email: email,
          createdAt: Timestamp.now(),
          isActive: true,
          lastLogin: Timestamp.now(),
          role: "user",
          displayName: displayName || null, // Optional field
          photoURL: photoURL || null, // Optional field
          providerId: providerId || null, // Optional field
        },
        { merge: true },
      );

      return {
        success: true,
        message: `User document for ${uid} created successfully.`,
      };
    } catch (error) {
      logger.error("Error creating user document:", error);
      throw new HttpsError("internal", "Unable to create user document");
    }
  },
);

exports.updateFixtures = onSchedule(
  {
    schedule: "every day 00:00",
    timeoutSeconds: 540,
    memory: "512MiB",
    secrets: [FOOTBALL_API_KEY],
  },
  async (event) => {
    try {
      await runUpdateJob({ db, season: SEASON, leagueId: LEAGUE_ID, logger });
    } catch (error) {
      // Rethrow: swallowing here makes a total failure look like a successful run.
      logger.error("Critical error in daily update:", error.message, error);
      throw error;
    }
  },
);

// --- GAMIFICATION ---------------------------------------------------------
// The first Firestore trigger in this codebase. Deploy it on its own the first
// time (`firebase deploy --only functions:onUserMatchWrite`) — Eventarc IAM is
// provisioned on first deploy of a trigger and a bundled deploy can fail
// confusingly while that propagates.
exports.onUserMatchWrite = onDocumentWritten(
  {
    document:
      "users/{uid}/groups/{groupId}/seasons/{season}/matches/{matchId}",
    // A rating card is ~14 rapid writes per user; this is a small function but
    // kickoff is spiky, so keep a ceiling on it like every other function here.
    maxInstances: MAX_INSTANCES,
    memory: "256MiB",
    timeoutSeconds: 60,
  },
  async (event) => {
    const { uid, groupId, season } = event.params;

    try {
      const before = event.data?.before?.data() ?? null;
      const after = event.data?.after?.data() ?? null;

      // The delta between two runs of a pure function. Deleting the doc
      // (after === null) correctly withdraws the XP it had earned.
      const xpBefore = computeMatchXp(before).xp;
      const xpAfter = computeMatchXp(after).xp;
      const xpDelta = xpAfter - xpBefore;

      // Crossing 0 -> positive is the moment this match starts counting as
      // "participated", so the counter moves exactly once however many writes
      // the user makes afterwards.
      const nowParticipating = xpBefore === 0 && xpAfter > 0;

      if (xpDelta === 0 && !nowParticipating) return;

      await applyXpDelta({
        db,
        uid,
        groupId,
        season,
        xpDelta,
        nowParticipating,
      });
    } catch (error) {
      // Never rethrow. A retry would re-apply the increment and inflate the
      // total; the nightly reconcile recomputes absolute values from source and
      // will repair whatever this run missed.
      logger.error("[gamification] XP award failed", {
        uid,
        groupId,
        season,
        error: error.message,
      });
    }
  },
);

exports.reconcileGamification = onSchedule(
  {
    // After updateFixtures (00:00) so the day's results are already stored.
    schedule: "every day 03:00",
    timeoutSeconds: 540,
    memory: "512MiB",
  },
  async (event) => {
    try {
      const summary = await runGamificationReconcile({
        db,
        season: SEASON,
        logger,
      });
      logger.info("[gamification] reconcile complete", summary);
    } catch (error) {
      logger.error("[gamification] reconcile failed:", error.message, error);
      throw error;
    }
  },
);

exports.scheduledLiveMatchUpdate = onSchedule(
  {
    schedule: "every 1 minutes",
    timeoutSeconds: 60,
    memory: "256MiB",
    secrets: [FOOTBALL_API_KEY],
  },
  async (event) => {
    try {
      const now = Math.floor(Date.now() / 1000); // Current Unix Timestamp

      // 1. DEFINE THE "HOT ZONE"
      // We look back 4 hours (active games/just finished) and ahead 1 hour (lineups)
      const LOOKBACK_SECONDS = 4 * 60 * 60;
      const LOOKAHEAD_SECONDS = 60 * 60;

      const minTime = now - LOOKBACK_SECONDS;
      const maxTime = now + LOOKAHEAD_SECONDS;

      // 2. QUERY FIRESTORE
      // Find matches scheduled in this window
      const snapshot = await db
        .collection(`fixtures/${SEASON}/fixtures`)
        .where("timestamp", ">=", minTime)
        .where("timestamp", "<=", maxTime)
        .get();

      if (snapshot.empty) {
        logger.info("No active matches found in the Hot Zone.");
        return;
      }

      const matchesToUpdate = [];

      // 3. FILTER LOGIC (Decide what actually needs an API call)
      snapshot.forEach((doc) => {
        const data = doc.data();
        const status = data.fixture.status.short; // e.g., 'NS', 'FT', '1H', '2H'
        const matchTime = data.timestamp;

        // A. Is the match already marked as FINISHED in our DB?
        // If yes, we don't need to check it again every minute.
        if (["FT", "AET", "PEN"].includes(status)) {
          return; // Skip it
        }

        // B. Is it NOT STARTED yet?
        if (status === "NS") {
          // Only update if it starts within 60 mins — this is the window where
          // the API publishes lineups, which the fixture response embeds.
          const timeUntilKickoff = matchTime - now;
          if (timeUntilKickoff <= 3600) {
            matchesToUpdate.push(doc.id);
          }
          return;
        }

        // C. If we are here, the status is likely LIVE (1H, 2H, HT, ET, etc.)
        // OR the status is 'NS' but the time has passed (Kickoff just happened)
        matchesToUpdate.push(doc.id);
      });

      if (matchesToUpdate.length === 0) {
        logger.info(
          "Matches found in window, but none require updates (all finished or too early).",
        );
        return;
      }

      logger.info(
        `Updating ${
          matchesToUpdate.length
        } active/upcoming matches: ${matchesToUpdate.join(", ")}`,
      );

      // 4. FETCH DATA (Parallel Execution)
      // The fixtures?id= response embeds lineups, statistics and events, so one
      // call per fixture covers everything.
      const results = await Promise.allSettled(
        matchesToUpdate.map((fixtureId) => fetchAllMatchData({ fixtureId })),
      );

      let failureCount = 0;
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          failureCount++;
          logger.error(
            `Failed to update fixture ${matchesToUpdate[index]}`,
            result.reason,
          );
        }
      });

      if (failureCount === matchesToUpdate.length) {
        // Every fixture failed — surface it rather than reporting success.
        throw new Error(
          `All ${failureCount} fixture updates failed this cycle.`,
        );
      }

      logger.info("Live update cycle completed.");
    } catch (error) {
      logger.error("Error in scheduledLiveMatchUpdate:", error);
      throw error;
    }
  },
);

/** A table refetched more than this long ago is refreshed regardless. */
const STANDINGS_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** How far back a finished match keeps its competition on the refresh list. */
const STANDINGS_DIRTY_WINDOW_SECONDS = 12 * 60 * 60;

/**
 * Works out which competitions need their table refetched.
 *
 * Deliberately not a Firestore trigger on the fixtures collection. The live
 * poller rewrites every in-window fixture every minute, so a trigger would fire
 * thousands of times a matchday to catch a handful of full-time transitions,
 * and five matches ending at once would race to write the same table. It would
 * also usually be wasted: the API's standings lag the whistle, so asking the
 * instant a fixture goes FT tends to return a table that has not absorbed it.
 *
 * So instead: one indexed read of the recent fixture window — the same query
 * shape scheduledLiveMatchUpdate already uses — and a league stays on the list
 * for 12 hours after a match, which is the window the API needs to catch up.
 *
 * @param {number|string} season - Season year.
 * @return {Promise<Array<object>>} TRACKED_LEAGUES entries needing a refresh.
 */
const standingsRefreshTargets = async (season) => {
  const candidates = resolveLeagueTargets().filter((c) => c.table);
  const now = Math.floor(Date.now() / 1000);

  const snapshot = await db
    .collection(`fixtures/${season}/fixtures`)
    .where("timestamp", ">=", now - STANDINGS_DIRTY_WINDOW_SECONDS)
    .where("timestamp", "<=", now)
    .get();

  const dirty = new Set();
  snapshot.forEach((doc) => {
    const data = doc.data();
    // The nested status, not the flat one: the flat copy is only refreshed by
    // the nightly job, so mid-afternoon it still says "NS".
    const status = data.fixture?.status?.short;
    if (DECIDED.includes(status) || IN_PLAY.includes(status)) {
      dirty.add(Number(data.league?.id ?? data.leagueId));
    }
  });

  // Anything stale gets picked up too, which folds the daily baseline into the
  // same function rather than needing a second schedule for it.
  const staleChecks = await Promise.all(
    candidates.map(async (competition) => {
      if (dirty.has(competition.id)) return competition;
      try {
        const doc = await standingsDocRef(db, season, competition.id).get();
        if (!doc.exists) return competition;
        const fetchedAt = doc.data()?.fetchedAt?.toMillis?.() ?? 0;
        return Date.now() - fetchedAt > STANDINGS_MAX_AGE_MS ? competition : null;
      } catch (error) {
        logger.warn(`Standings freshness check failed for ${competition.id}`, error);
        return competition;
      }
    }),
  );

  return staleChecks.filter(Boolean);
};

/**
 * Keeps the official league tables current.
 *
 * Every 30 minutes, but only actually calls the API for competitions that
 * either had a match in the last 12 hours or have a table older than a day —
 * so a quiet Tuesday costs nothing and a four-tier Saturday costs a few dozen
 * calls. See standingsRefreshTargets for why this is a schedule and not a
 * Firestore trigger.
 *
 * The table it stores is the official one, which only reflects finished
 * matches. The live-looking table users see is computed at read time by
 * applying in-play fixtures over this base.
 */
exports.refreshStandings = onSchedule(
  {
    schedule: "every 30 minutes",
    timeoutSeconds: 120,
    memory: "256MiB",
    secrets: [FOOTBALL_API_KEY],
  },
  async () => {
    try {
      const targets = await standingsRefreshTargets(SEASON);

      if (targets.length === 0) {
        logger.info("Standings: nothing dirty or stale, no API calls made.");
        return;
      }

      const summary = await syncStandings({
        db,
        season: SEASON,
        leagueIds: targets.map((competition) => competition.id),
      });

      logger.info(
        `Standings: ${summary.leaguesWritten}/${summary.leaguesRequested} tables ` +
          `refreshed for season ${SEASON}.`,
        { targets: targets.map((c) => c.id), failures: summary.failures },
      );

      // A competition with no table is fine in July and wrong in November, so
      // it is recorded rather than thrown — but at a level that shows up.
      if (summary.empty.length) {
        logger.warn(
          `Standings: ${summary.empty.length} competition(s) returned no table.`,
          summary.empty.map((e) => e.leagueId),
        );
      }

      if (summary.failures.length === summary.leaguesRequested) {
        throw new Error(
          `All ${summary.failures.length} standings refreshes failed this cycle.`,
        );
      }
    } catch (error) {
      logger.error("Error in refreshStandings:", error);
      throw error;
    }
  },
);

/**
 * Snapshots the top four English tiers and the major world leagues into
 * leagues/season/{season}/{leagueId}, with a doc per team underneath.
 *
 * Manual rather than scheduled: league membership changes once a season, so a
 * nightly run would spend calls confirming nothing changed. Run it after a
 * season rolls over.
 *
 *   firebase functions:shell
 *   syncLeagueCatalogue({}, { auth: { uid: "<your-admin-uid>" } })
 *
 * Optional data: { season } to target a different year, { leagueIds: [39, 40] }
 * to sync a subset.
 */
exports.syncLeagueCatalogue = onCall(
  {
    maxInstances: 1,
    timeoutSeconds: 300,
    memory: "512MiB",
    secrets: [FOOTBALL_API_KEY],
  },
  async (request) => {
    assertAdmin(request.auth?.uid);

    const season = request.data?.season
      ? String(request.data.season)
      : String(SEASON);

    // Allowlisted against TRACKED_LEAGUES inside syncLeagueTeams, so a
    // caller-supplied id can never reach the API or a Firestore path.
    const leagueIds = Array.isArray(request.data?.leagueIds)
      ? request.data.leagueIds.map(Number).filter(Number.isInteger)
      : null;

    if (!/^\d{4}$/.test(season)) {
      throw new HttpsError("invalid-argument", "season must be a 4-digit year.");
    }

    try {
      const summary = await syncLeagueTeams({ db, season, leagueIds });

      logger.info(
        `League catalogue: ${summary.leaguesWritten}/${summary.leaguesRequested} ` +
          `leagues, ${summary.teamsWritten} teams, season ${season}.`,
        summary,
      );

      // An empty league is almost always a wrong id in TRACKED_LEAGUES. Logged
      // loudly because the run otherwise looks like a success.
      if (summary.empty.length) {
        logger.error(
          `League catalogue: ${summary.empty.length} league(s) returned nothing ` +
            `— check these ids in TRACKED_LEAGUES.`,
          summary.empty,
        );
      }

      return { success: true, ...summary };
    } catch (error) {
      logger.error("League catalogue sync failed:", error);
      throw new HttpsError("internal", error.message || "Sync failed.");
    }
  },
);

/**
 * The league ids the catalogue covers, with the name each one is expected to
 * resolve to. Read this before a sync to confirm what you're about to fetch.
 */
exports.listTrackedLeagues = onCall(
  { maxInstances: 1 },
  async (request) => {
    assertAdmin(request.auth?.uid);
    return { leagues: TRACKED_LEAGUES };
  },
);

exports.sitemap = onRequest(
  { timeoutSeconds: 60, memory: "256MiB", maxInstances: MAX_INSTANCES },
  async (req, res) => {
    try {
      const baseUrl = "https://11votes.com";

      // 1. Fetch BOTH collections in parallel
      const [groupsSnapshot, fixturesSnapshot] = await Promise.all([
        db.collection("groups").get(),
        db.collection(`fixtures/${SEASON}/fixtures`).get(),
      ]);

      const urls = [
        { loc: `${baseUrl}/`, changefreq: "daily", priority: "1.0" },
      ];

      // ==================================================================
      // STEP 2: BUILD THE LOOKUP MAP (The "Rosetta Stone")
      // We map the numeric API ID (e.g., 33) to your string Slug (e.g., 'man-united')
      // ==================================================================
      const clubIdToSlugMap = {};

      groupsSnapshot.forEach((doc) => {
        const data = doc.data();

        // Default-deny: only publish groups explicitly marked public.
        // `isPublic` is the field the app itself gates on.
        if (data.isPublic !== true) {
          return;
        }

        // Archived clubs stay publicly readable, but their current-season pages
        // are empty by design and their archived seasons render noindex. Keep
        // them out of the sitemap rather than advertise dead-end URLs.
        if (data.status === "archived") {
          return;
        }
        // Ensure the group has a slug and a mapped club ID
        if (data.slug && data.groupClubId) {
          // Example: clubIdToSlugMap[33] = "man-united"
          clubIdToSlugMap[data.groupClubId] = data.slug;

          // Add the Group Landing Page while we are here
          urls.push({
            loc: `${baseUrl}/${data.slug}`,
            changefreq: "weekly",
            priority: "0.8",
          });
        }
      });

      // ==================================================================
      // STEP 3: PROCESS FIXTURES USING THE MAP
      // Check if Home or Away team matches a known Group
      // ==================================================================
      fixturesSnapshot.forEach((doc) => {
        const fixtureData = doc.data();
        const fixtureId = doc.id;

        // Access the raw API IDs stored in your fixture doc
        const homeTeamId = fixtureData.teams?.home?.id;
        const awayTeamId = fixtureData.teams?.away?.id;

        // SCENARIO A: Is the HOME team one of our groups?
        if (clubIdToSlugMap[homeTeamId]) {
          urls.push({
            loc: `${baseUrl}/${clubIdToSlugMap[homeTeamId]}/fixture/${fixtureId}`,
            changefreq: "always", // Match stats change often
            priority: "0.9",
          });
        }

        // SCENARIO B: Is the AWAY team one of our groups?
        if (
          clubIdToSlugMap[awayTeamId] &&
          clubIdToSlugMap[awayTeamId] !== clubIdToSlugMap[homeTeamId]
        ) {
          urls.push({
            loc: `${baseUrl}/${clubIdToSlugMap[awayTeamId]}/fixture/${fixtureId}`,
            changefreq: "always",
            priority: "0.9",
          });
        }
      });

      // ==================================================================
      // STEP 4: GENERATE XML
      // ==================================================================
      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

      urls.forEach((url) => {
        xml += `
  <url>
    <loc>${url.loc}</loc>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`;
      });

      xml += `
</urlset>`;

      res.set("Cache-Control", "public, max-age=86400, s-maxage=86400");
      res.set("Content-Type", "application/xml");
      res.status(200).send(xml);
    } catch (error) {
      logger.error("Sitemap generation failed", error);
      res.status(500).end();
    }
  },
);

exports.addUserToGroup = onCall(
  { maxInstances: MAX_INSTANCES },
  async (request) => {
    // 1. Contextual Security: Strict UID check
    const uid = request.auth?.uid;

    if (!uid) {
      throw new HttpsError(
        "unauthenticated",
        "The function must be called while authenticated.",
      );
    }

    const { groupId } = request.data;

    if (!groupId) {
      throw new HttpsError("invalid-argument", "Missing groupId.");
    }

    try {
      // 2. Verify the group is actually open to self-service joins.
      const groupSnap = await db
        .collection("groups")
        .doc(String(groupId))
        .get();

      if (!groupSnap.exists) {
        throw new HttpsError("not-found", "Group not found.");
      }

      // Archived clubs are closed too (the reconcile sets isGroupOpen: false),
      // but "invite-only" is the wrong thing to tell a user here — they picked
      // a club that has left the league. Check it first for the clearer message.
      if (groupSnap.data().status === "archived") {
        throw new HttpsError(
          "failed-precondition",
          "That club is no longer in the Premier League. Pick a club from this season.",
        );
      }

      // Only block groups explicitly closed. Many existing group docs predate
      // updateGroupPrivacy and have no isGroupOpen field at all — requiring
      // `=== true` here would break the sign-up club-selection flow.
      if (groupSnap.data().isGroupOpen === false) {
        throw new HttpsError(
          "permission-denied",
          "This group is invite-only. Use an invite code to join.",
        );
      }

      // 3. Role is fixed, never taken from the client. A client-supplied role
      // would let any user write themselves into groupUsers/{id}/admins/{uid},
      // which firestore.rules treats as group write access.
      await addMemberToGroup(db, groupId, uid, "member");

      return {
        success: true,
        message: "Joined successfully",
        groupId: String(groupId),
      };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error("Error joining group:", error);
      throw new HttpsError(
        "internal",
        "Failed to join group. Please try again.",
      );
    }
  },
);

// 2. REMOVE USER (Standard Leave)
exports.removeUserFromGroup = onCall(
  { maxInstances: MAX_INSTANCES },
  async (request) => {
    // 1. Security: Strict UID check from the auth context
    const uid = request.auth?.uid;

    if (!uid) {
      throw new HttpsError(
        "unauthenticated",
        "The function must be called while authenticated.",
      );
    }

    const { groupId } = request.data;

    if (!groupId) {
      throw new HttpsError("invalid-argument", "Missing groupId.");
    }

    try {
      // 2. Execute the atomic removal service
      // This handles the role-check, global delete, and user doc update
      await removeMemberFromGroup(db, groupId, uid);

      return {
        success: true,
        message: "Successfully removed from group",
      };
    } catch (error) {
      logger.error("Error in removeUserFromGroup:", error);
      throw new HttpsError("internal", "Failed to process group removal.");
    }
  },
);

exports.joinGroupByCode = onCall(
  { maxInstances: MAX_INSTANCES },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError("unauthenticated", "Auth required.");
    }

    const { inviteCode } = request.data;

    if (!inviteCode || typeof inviteCode !== "string") {
      throw new HttpsError("invalid-argument", "Invite code is required.");
    }

    const normalisedCode = inviteCode.trim().toUpperCase();

    // Cheap pre-check so a scripted guesser is turned away before it costs us a
    // transaction. The counter itself is only written on failure, below.
    await assertJoinAttemptsRemaining(uid);

    let joinedGroup = null;

    try {
      joinedGroup = await db.runTransaction(async (transaction) => {
        // 1. REFS
        const inviteRef = db.collection("groupInvites").doc(normalisedCode);
        const userRef = db.collection("users").doc(uid);

        // 2. READS
        const [inviteSnap, userSnap] = await Promise.all([
          transaction.get(inviteRef),
          transaction.get(userRef),
        ]);

        const inviteData = inviteSnap.exists ? inviteSnap.data() : null;
        const verdict = evaluateInvite(inviteData);

        if (!verdict.ok) {
          throw new InviteError(
            verdict.reason === "invalid" ? "not-found" : "failed-precondition",
            INVITE_FAILURE_MESSAGES[verdict.reason],
            // Only an unrecognised code looks like guessing. Burning through a
            // legitimately expired link shouldn't lock anyone out.
            { countsAsFailure: verdict.reason === "invalid" },
          );
        }

        if (!userSnap.exists) {
          throw new InviteError("not-found", "User profile not found.");
        }

        const { groupId } = inviteData;

        // The role is only trusted because createInviteCode verified group
        // ownership before writing it. Still validated, so a malformed invite
        // can never build an arbitrary collection path. Legacy "owner" invites
        // created before owner codes were banned are demoted to member.
        const role = INVITABLE_ROLES.includes(inviteData.role)
          ? inviteData.role
          : "member";

        const groupRef = db.collection("groups").doc(String(groupId));
        const userJoinedGroupRef = userRef
          .collection("joinedGroups")
          .doc(String(groupId));

        const [groupSnap, existingMembershipSnap] = await Promise.all([
          transaction.get(groupRef),
          transaction.get(userJoinedGroupRef),
        ]);

        if (!groupSnap.exists) {
          throw new InviteError(
            "not-found",
            "The associated group no longer exists.",
          );
        }

        // Without this, re-opening an invite link silently rewrote the
        // membership doc and inflated usageCount against the invite's own limit.
        if (existingMembershipSnap.exists) {
          throw new InviteError(
            "already-exists",
            "You're already a member of this group.",
          );
        }

        const groupData = groupSnap.data();
        const userData = userSnap.data();
        const leagueKey = groupData.league;

        // 2b. READ: existing team in this league, so we can clean it up rather
        // than orphaning it.
        const oldGroupId = leagueKey
          ? userData?.leagueTeams?.[leagueKey]
          : null;
        let oldJoinedGroupDoc = null;

        if (oldGroupId && String(oldGroupId) !== String(groupId)) {
          oldJoinedGroupDoc = await transaction.get(
            userRef.collection("joinedGroups").doc(String(oldGroupId)),
          );
        }

        // 3. PREPARE PATHS
        const roleCollection = `${role}s`;
        const globalMemberRef = db
          .collection("groupUsers")
          .doc(String(groupId))
          .collection(roleCollection)
          .doc(uid);

        // Per-invite audit trail, so an owner can see who a given link brought in.
        const redemptionRef = inviteRef.collection("redemptions").doc(uid);

        // 4. DATA PREPARATION
        const displayName = userData.displayName || userData.name || "Fan";

        const globalMemberData = {
          uid: uid,
          email: userData.email || "",
          displayName: displayName,
          joinedAt: FieldValue.serverTimestamp(),
          role: role,
        };

        const userGroupMetadata = {
          groupId: String(groupId),
          groupName: groupData.name || "Unknown Group",
          role: role,
          joinedAt: FieldValue.serverTimestamp(),
          leagueKey: leagueKey || null,
        };

        const userUpdate = {
          activeGroup: String(groupId),
        };

        // Handle League Logic
        if (leagueKey) {
          userUpdate[`leagueTeams.${leagueKey}`] = String(groupId);
          userUpdate[`lastTransferDates.${leagueKey}`] =
            FieldValue.serverTimestamp();
        }

        // 5. TRANSACTIONAL WRITES
        if (oldJoinedGroupDoc) {
          queueOldMembershipCleanup(
            transaction,
            db,
            uid,
            oldGroupId,
            oldJoinedGroupDoc,
          );
        }

        transaction.set(globalMemberRef, globalMemberData);
        transaction.set(userJoinedGroupRef, userGroupMetadata);
        transaction.update(userRef, userUpdate);

        const inviteUpdate = { usageCount: FieldValue.increment(1) };

        // Retire the code in the same write that consumes its last use, so the
        // owner's list and the next joiner both see the truth immediately.
        if (
          inviteData.maxUses != null &&
          (inviteData.usageCount || 0) + 1 >= inviteData.maxUses
        ) {
          inviteUpdate.active = false;
          inviteUpdate.exhaustedAt = FieldValue.serverTimestamp();
        }

        transaction.update(inviteRef, inviteUpdate);
        transaction.set(redemptionRef, {
          uid: uid,
          displayName: displayName,
          role: role,
          groupId: String(groupId),
          joinedAt: FieldValue.serverTimestamp(),
        });

        return {
          groupId: String(groupId),
          groupName: groupData.name || "Unknown Group",
          groupSlug: groupData.slug || null,
          role: role,
        };
      });
    } catch (error) {
      if (error instanceof InviteError) {
        if (error.countsAsFailure) await registerFailedJoinAttempt(uid);
        throw new HttpsError(error.httpsCode, error.message);
      }

      // Anything else is ours, not theirs — log it in full but return nothing
      // that leaks internal state.
      logger.error("Join By Code Error:", error);
      throw new HttpsError("internal", "Failed to join group. Please retry.");
    }

    return {
      success: true,
      message: `Welcome to ${joinedGroup.groupName}!`,
      ...joinedGroup,
    };
  },
);

// Unambiguous alphabet: no O/0, I/1, so codes survive being read aloud.
const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const INVITE_CODE_LENGTH = 6;

// Bounds on the owner-configurable invite options.
const MAX_EXPIRY_DAYS = 365;
const MAX_INVITE_USES = 500;
const MAX_INVITE_LABEL_LENGTH = 40;

// Brute-force backpressure for joinGroupByCode. The keyspace is 32^6 (~1.07e9),
// so guessing is impractical only while attempts are capped — without this an
// unbounded script both finds codes eventually and bills us a read per guess.
const JOIN_ATTEMPT_WINDOW_MS = 60 * 60 * 1000;
const MAX_FAILED_JOIN_ATTEMPTS = 10;

/**
 * A redemption failure with a known cause, so the outer handler can map it to a
 * precise HttpsError instead of leaking a raw transaction message to the client.
 */
class InviteError extends Error {
  /**
   * @param {string} httpsCode - The functions error code to surface.
   * @param {string} message - Safe, user-facing copy.
   * @param {object} options - { countsAsFailure } to charge the rate limiter.
   */
  constructor(httpsCode, message, { countsAsFailure = false } = {}) {
    super(message);
    this.name = "InviteError";
    this.httpsCode = httpsCode;
    this.countsAsFailure = countsAsFailure;
  }
}

/**
 * Generates a cryptographically random, fixed-length invite code.
 * @return {string} A 6-character code.
 */
const generateInviteCode = () => {
  let code = "";
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    code += INVITE_ALPHABET[crypto.randomInt(INVITE_ALPHABET.length)];
  }
  return code;
};

/**
 * Parses an owner-supplied positive integer option, rejecting anything outside
 * the allowed range. Absent/null means "no limit" and is preserved as null.
 * @param {*} value - The raw value from the client.
 * @param {string} name - Field name, used in the error message.
 * @param {number} max - Largest accepted value.
 * @return {number|null} The validated integer, or null when unset.
 */
const parsePositiveIntOption = (value, name, max) => {
  if (value === undefined || value === null || value === "") return null;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > max) {
    throw new HttpsError(
      "invalid-argument",
      `${name} must be a whole number between 1 and ${max}.`,
    );
  }
  return parsed;
};

/**
 * Classifies an invite against the rules that make it usable right now.
 * The /join/[code] page runs the same check server-side via getInvitePreview()
 * in src/lib/firebase/firebase-admin-queries.ts, so the preview a visitor sees
 * can never disagree with what redemption actually does. Keep the two in step.
 * @param {object} invite - The groupInvites doc data, or null when missing.
 * @return {object} `{ ok }`, plus `reason` ("invalid"|"expired"|"exhausted").
 */
const evaluateInvite = (invite) => {
  if (!invite) return { ok: false, reason: "invalid" };
  if (invite.active === false) return { ok: false, reason: "invalid" };

  if (invite.expiresAt && invite.expiresAt.toMillis() <= Date.now()) {
    return { ok: false, reason: "expired" };
  }

  if (invite.maxUses != null && (invite.usageCount || 0) >= invite.maxUses) {
    return { ok: false, reason: "exhausted" };
  }

  return { ok: true };
};

// User-facing copy for each failure reason. Deliberately identical for "code
// does not exist" and "code was deactivated" so the endpoint can't be used to
// enumerate which codes are real.
const INVITE_FAILURE_MESSAGES = {
  invalid: "This invite code is invalid or is no longer active.",
  expired: "This invite link has expired. Ask the group owner for a new one.",
  exhausted: "This invite link has reached its limit. Ask for a new one.",
};

/**
 * Records a failed redemption attempt and throws once a user is over the hourly
 * cap. Uses its own transaction so the counter survives the caller rolling back.
 * @param {string} uid - The user making the attempt.
 */
const registerFailedJoinAttempt = async (uid) => {
  const attemptRef = db.collection("inviteAttempts").doc(uid);

  await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(attemptRef);
    const now = Date.now();
    const data = snap.exists ? snap.data() : null;

    const windowStart = data?.windowStart?.toMillis?.() ?? 0;
    const withinWindow = now - windowStart < JOIN_ATTEMPT_WINDOW_MS;

    transaction.set(attemptRef, {
      count: withinWindow ? (data.count || 0) + 1 : 1,
      windowStart: withinWindow ? data.windowStart : Timestamp.fromMillis(now),
      lastAttemptAt: FieldValue.serverTimestamp(),
    });
  });
};

/**
 * Throws if the user has burned through their failed-attempt budget this hour.
 * @param {string} uid - The user making the attempt.
 */
const assertJoinAttemptsRemaining = async (uid) => {
  const snap = await db.collection("inviteAttempts").doc(uid).get();
  if (!snap.exists) return;

  const data = snap.data();
  const windowStart = data.windowStart?.toMillis?.() ?? 0;
  const withinWindow = Date.now() - windowStart < JOIN_ATTEMPT_WINDOW_MS;

  if (withinWindow && (data.count || 0) >= MAX_FAILED_JOIN_ATTEMPTS) {
    throw new HttpsError(
      "resource-exhausted",
      "Too many incorrect invite codes. Please try again later.",
    );
  }
};

exports.createInviteCode = onCall(
  { maxInstances: MAX_INSTANCES },
  async (request) => {
    // 1. Auth Guard
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError("unauthenticated", "You must be logged in.");
    }

    const {
      groupId,
      role = "member",
      expiresInDays,
      maxUses,
      label,
    } = request.data;

    if (!groupId) {
      throw new HttpsError("invalid-argument", "Missing groupId.");
    }

    // INVITABLE_ROLES, not VALID_ROLES: an "owner" code would be a bearer token
    // for the whole group. See joinGroupByCode, which no longer honours one.
    if (!INVITABLE_ROLES.includes(role)) {
      throw new HttpsError("invalid-argument", `Invalid invite role: ${role}`);
    }

    const expiryDays = parsePositiveIntOption(
      expiresInDays,
      "Expiry (days)",
      MAX_EXPIRY_DAYS,
    );
    const usageLimit = parsePositiveIntOption(
      maxUses,
      "Max uses",
      MAX_INVITE_USES,
    );

    if (label !== undefined && label !== null && typeof label !== "string") {
      throw new HttpsError("invalid-argument", "Label must be text.");
    }
    const trimmedLabel =
      typeof label === "string"
        ? label.trim().slice(0, MAX_INVITE_LABEL_LENGTH) || null
        : null;

    try {
      // 2. Ownership Verification
      // We check the group document directly to see if this user is the owner
      const groupRef = db.collection("groups").doc(String(groupId));
      const groupSnap = await groupRef.get();

      if (!groupSnap.exists) {
        throw new HttpsError("not-found", "Group not found.");
      }

      const groupData = groupSnap.data();

      // Critical: Only the owner should generate codes
      if (groupData.ownerId !== uid) {
        throw new HttpsError(
          "permission-denied",
          "Unauthorized. Only owners can create codes.",
        );
      }

      // 3. Unique Code Generation
      // create() fails if the document already exists, which removes the
      // read-then-write race the old uniqueness loop had.
      let attempts = 0;
      let inviteCode = "";

      while (attempts < 5) {
        inviteCode = generateInviteCode();
        attempts++;

        const invitePayload = {
          inviteCode,
          groupId: String(groupId),
          // Denormalised for the /join/[code] preview, which renders before the
          // visitor has any read access to the group doc.
          groupName: groupData.name || "Unnamed Group",
          groupLogo: groupData.logoUrl || null,
          groupSlug: groupData.slug || null,
          createdBy: uid,
          role: role,
          active: true,
          usageCount: 0,
          label: trimmedLabel,
          // null on either field means "no limit", which is how every invite
          // created before this change behaves.
          maxUses: usageLimit,
          expiresAt: expiryDays
            ? Timestamp.fromMillis(Date.now() + expiryDays * 86400000)
            : null,
          createdAt: FieldValue.serverTimestamp(),
        };

        try {
          await db
            .collection("groupInvites")
            .doc(inviteCode)
            .create(invitePayload);
          return {
            success: true,
            inviteCode: inviteCode,
          };
        } catch (createError) {
          // ALREADY_EXISTS (code 6) means a collision — try another code.
          if (createError.code !== 6) throw createError;
          logger.warn(`Invite code collision on ${inviteCode}, retrying.`);
        }
      }

      throw new HttpsError(
        "internal",
        "Failed to generate a unique code. Try again.",
      );
    } catch (error) {
      // Re-throw if it's already an HttpsError, otherwise wrap it
      if (error instanceof HttpsError) throw error;
      logger.error("Create Invite Error:", error);
      throw new HttpsError("internal", "Internal server error.");
    }
  },
);

exports.updateGroupPrivacy = onCall(
  { maxInstances: MAX_INSTANCES },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError("unauthenticated", "Auth required.");
    }

    const { groupId, mode } = request.data;

    // Validate the 3 modes we defined for 11votes
    const validModes = ["public", "restricted", "private"];
    if (!groupId || !validModes.includes(mode)) {
      throw new HttpsError(
        "invalid-argument",
        "Missing groupId or invalid privacy mode (must be public, restricted, or private).",
      );
    }

    try {
      const groupRef = db.collection("groups").doc(String(groupId));
      const groupSnap = await groupRef.get();

      if (!groupSnap.exists) {
        throw new HttpsError("not-found", "Group not found.");
      }

      // Security Check: Only the owner can change visibility
      const groupData = groupSnap.data();
      if (groupData.ownerId !== uid) {
        throw new HttpsError(
          "permission-denied",
          "Only the owner can change group settings.",
        );
      }

      // Map the logic:
      // Public: Visible + No Code
      // Restricted: Visible + Needs Code
      // Private: Hidden + Needs Code
      const isPublic = mode === "public" || mode === "restricted";

      const updates = {
        isPublic: isPublic,
        isGroupOpen: mode === "public",
        // Kept in sync for the Next.js sitemap and the groupSlice type, which
        // both read `visibility`.
        visibility: isPublic ? "public" : "private",
        updatedAt: FieldValue.serverTimestamp(), // Better than ISO string for Firestore querying
      };

      await groupRef.update(updates);

      return {
        success: true,
        appliedMode: mode,
        flags: updates,
      };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error("Update Privacy Error:", error);
      throw new HttpsError(
        "internal",
        "Failed to update group privacy strategy.",
      );
    }
  },
);

exports.transferLeagueTeam = onCall(
  { maxInstances: MAX_INSTANCES },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Auth required.");

    const { newGroupId } = request.data; // Only need the ID

    if (!newGroupId) {
      throw new HttpsError("invalid-argument", "Missing newGroupId.");
    }

    try {
      await db.runTransaction(async (transaction) => {
        // 1. REFS
        const userRef = db.collection("users").doc(uid);
        const newGroupRef = db.collection("groups").doc(String(newGroupId));
        const newUserJoinedGroupRef = userRef
          .collection("joinedGroups")
          .doc(String(newGroupId));

        // 2. READ: Get User and New Group info
        const [userDoc, newGroupDoc] = await Promise.all([
          transaction.get(userRef),
          transaction.get(newGroupRef),
        ]);

        if (!userDoc.exists) throw new Error("User not found.");
        if (!newGroupDoc.exists) throw new Error("Target group not found.");

        const userData = userDoc.data();
        const newGroupData = newGroupDoc.data();

        // DISCOVER: Get the leagueKey from the target group
        const leagueKey = newGroupData.league;
        if (!leagueKey) {
          throw new Error("This group is not associated with a league.");
        }

        // A relegated club is a dead end — never let a transfer land in one.
        if (newGroupData.status === "archived") {
          throw new Error(
            "That club is no longer in the Premier League. Pick a club from this season.",
          );
        }

        // Same gate as addUserToGroup. Without it this function was a way into
        // any private group: it writes groupUsers/{id}/members/{uid} — which
        // firestore.rules treats as group write access — from nothing but a
        // caller-supplied group id.
        if (newGroupData.isGroupOpen === false) {
          throw new Error(
            "This group is invite-only. Use an invite code to join.",
          );
        }

        // DISCOVER: Check if user already has a team in THIS specific league
        const oldGroupId = userData?.leagueTeams?.[leagueKey];

        // 3. ATOMIC REMOVAL (If they have an old team in the SAME league)
        let oldJoinedGroupDoc = null;

        if (oldGroupId && String(oldGroupId) !== String(newGroupId)) {
          oldJoinedGroupDoc = await transaction.get(
            userRef.collection("joinedGroups").doc(String(oldGroupId)),
          );
        }

        // 4. ATOMIC ADDITION
        const newGlobalMemberRef = db
          .collection("groupUsers")
          .doc(String(newGroupId))
          .collection("members")
          .doc(uid);

        const memberData = {
          uid: uid,
          email: userData.email || "",
          displayName: userData.displayName || userData.name || "Fan",
          joinedAt: FieldValue.serverTimestamp(),
          role: "member",
        };

        const userGroupMetadata = {
          groupId: String(newGroupId),
          groupName: newGroupData.name || "Unknown Group",
          role: "member",
          joinedAt: FieldValue.serverTimestamp(),
          leagueKey: leagueKey, // Persist discovered leagueKey for easier removal later
        };

        // 5. UPDATE USER DOC (Syncing leagueTeams and activeGroup)
        const userUpdate = {
          activeGroup: String(newGroupId),
          [`leagueTeams.${leagueKey}`]: String(newGroupId),
          [`lastTransferDates.${leagueKey}`]: FieldValue.serverTimestamp(),
        };

        // 6. COMMIT EVERYTHING
        if (oldJoinedGroupDoc) {
          queueOldMembershipCleanup(
            transaction,
            db,
            uid,
            oldGroupId,
            oldJoinedGroupDoc,
          );
        }

        transaction.set(newGlobalMemberRef, memberData);
        transaction.set(newUserJoinedGroupRef, userGroupMetadata);
        transaction.update(userRef, userUpdate);
      });

      return { success: true, message: "Transfer complete" };
    } catch (error) {
      logger.error("Transfer Error:", error);
      throw new HttpsError("internal", error.message || "Transfer failed.");
    }
  },
);

const MAX_SUBJECT_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_EMAIL_LENGTH = 254;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.submitContactForm = onCall(
  { maxInstances: MAX_INSTANCES, secrets: [GMAIL_APP_PASSWORD] },
  async (request) => {
    const { data, auth } = request;
    const { email, subject, message, userId } = data ?? {};

    // --- VALIDATION ---
    if (!email || !message) {
      throw new HttpsError(
        "invalid-argument",
        "Email and Message are required fields.",
      );
    }

    if (typeof email !== "string" || !EMAIL_PATTERN.test(email)) {
      throw new HttpsError("invalid-argument", "Please provide a valid email.");
    }

    if (
      email.length > MAX_EMAIL_LENGTH ||
      String(message).length > MAX_MESSAGE_LENGTH ||
      (subject && String(subject).length > MAX_SUBJECT_LENGTH)
    ) {
      throw new HttpsError(
        "invalid-argument",
        "One or more fields exceed the maximum length.",
      );
    }

    const safeSubject = String(subject || "No Subject").slice(
      0,
      MAX_SUBJECT_LENGTH,
    );
    const safeMessage = String(message).slice(0, MAX_MESSAGE_LENGTH);

    // --- PREPARE DATA ---
    const contactEntry = {
      email: email,
      subject: safeSubject,
      message: safeMessage,
      status: "new",
      createdAt: Timestamp.now(),
      source: "web_form",
    };

    // --- ATTACH USER ID ---
    if (auth && auth.uid) {
      contactEntry.userId = auth.uid;
      contactEntry.userEmail = auth.token.email || null;
    } else if (userId) {
      contactEntry.reportedUserId = String(userId).slice(0, 128);
      contactEntry.isGuest = true;
    } else {
      contactEntry.isGuest = true;
    }

    try {
      // 1. Save to Database (Critical Step)
      await db.collection("contact_messages").add(contactEntry);

      // 2. Send Email Notification (Side Effect)
      // We wrap this in its own try/catch so email failure doesn't crash the user response
      try {
        const mailOptions = {
          from: '"11Votes Contact Form" <noreply@11votes.com>',
          replyTo: email,
          to: CONTACT_EMAIL,
          subject: `[New Contact] ${safeSubject}`,
          text: `
New message from 11Votes Contact Form:

From: ${email}
User ID: ${contactEntry.userId || "Guest"}
Subject: ${safeSubject}

Message:
${safeMessage}
        `,
          // All interpolated values are escaped — this is user-controlled text.
          html: `
<h3>New Contact Form Submission</h3>
<p><strong>From:</strong> ${escapeHtml(email)}</p>
<p><strong>User ID:</strong> ${escapeHtml(contactEntry.userId || "Guest")}</p>
<p><strong>Subject:</strong> ${escapeHtml(safeSubject)}</p>
<br/>
<p><strong>Message:</strong></p>
<p style="padding: 10px; background-color: #f4f4f4; border-left: 4px solid #00FF87;">${escapeHtml(
            safeMessage,
          )}</p>
        `,
        };

        await getTransporter().sendMail(mailOptions);
        logger.info(`Notification email sent to ${CONTACT_EMAIL}`);
      } catch (emailError) {
        // Log it, but don't fail the request. Data is already safe in DB.
        logger.error("Failed to send notification email:", emailError);
      }

      return {
        success: true,
        message: "Contact form submitted successfully.",
      };
    } catch (error) {
      logger.error("Error submitting contact form:", error);
      throw new HttpsError(
        "internal",
        "Unable to submit message at this time.",
      );
    }
  },
);
