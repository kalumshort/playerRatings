const axios = require("axios");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

// --- CONFIGURATION ---
const BASE_URL = "https://v3.football.api-sports.io";

// The season every function reads and writes. Bump this once per season.
// Keep in sync with CURRENT_SEASON in src/lib/config/season.ts — `src/` and
// `functions/` are separate packages (ESM vs CJS) and cannot import each other.
const SEASON = 2026;
const LEAGUE_ID = 39; // Premier League

// The leagueKey written onto club group docs. Drives the one-team-per-league
// invariant in addMemberToGroup and the transfer market in the UI.
const LEAGUE_KEY = "premier-league";

// A full Premier League season is 20 clubs. The nightly reconcile refuses to
// archive anything if the API returns fewer than this — a partial or
// mislabelled response would otherwise mark live clubs as relegated.
const MIN_EXPECTED_TEAMS = 20;

// The public doc the client reads to render the club picker and transfer
// market. One doc, one read, no composite index — and it sidesteps the fact
// that a wildcard list query over `groups` can't satisfy the get()-based
// isGroupPublic() check in firestore.rules.
const CLUB_DIRECTORY_PATH = { collection: "config", doc: "clubDirectory" };

// Roles a user may hold in a group. Anything outside this list is rejected
// before it reaches a Firestore path, because `groupUsers/{groupId}/admins/{uid}`
// grants group write access via firestore.rules.
const VALID_ROLES = ["member", "admin", "owner"];

// Roles a user is allowed to grant themselves by joining. Admin/owner must come
// from an invite created by an existing owner.
const SELF_JOIN_ROLES = ["member"];

// Roles an owner may hand out through an invite code. "owner" is deliberately
// absent: redeeming a code must never transfer the group, because a code is a
// bearer token that can be forwarded, reused and screenshotted. Ownership
// transfer needs its own explicit, confirmed flow.
const INVITABLE_ROLES = ["member", "admin"];

/**
 * Generic helper to fetch data from API-Football.
 * @param {string} endpoint - The endpoint path (e.g., "fixtures", "fixtures/statistics").
 * @param {object} params - Query parameters (e.g., { id: 123, fixture: 456 }).
 * @param {object} options - { allowEmpty } to return [] rather than throw on an empty response.
 */
const fetchFootballApi = async (endpoint, params = {}, options = {}) => {
  // Read at call time, not module load: secrets are only present in the
  // runtime environment of functions that declare them.
  const apiKey = process.env.FOOTBALL_API_KEY;

  if (!apiKey) {
    throw new Error(
      "FOOTBALL_API_KEY is not set. Run: firebase functions:secrets:set FOOTBALL_API_KEY",
    );
  }

  try {
    const response = await axios.get(`${BASE_URL}/${endpoint}`, {
      headers: {
        "x-apisports-key": apiKey,
      },
      params: params, // Axios automatically serializes this to ?key=value
    });

    const data = response.data.response;

    if (!data || (Array.isArray(data) && data.length === 0)) {
      if (options.allowEmpty) {
        return [];
      }
      throw new Error(
        `No data found for endpoint: ${endpoint} with params: ${JSON.stringify(
          params,
        )}`,
      );
    }

    return data;
  } catch (error) {
    // Enhance error logging to see API response details if available
    const msg = error.response?.data?.message || error.message;
    console.error(`API Error [${endpoint}]:`, msg);
    throw error;
  }
};

// --- SPECIFIC FETCH FUNCTIONS ---

/**
 * Fetches a single fixture. The `fixtures?id=` response already embeds
 * lineups, statistics and events, so no separate calls are needed.
 * @param {number|string} fixtureId - The API fixture id.
 */
const fetchFixtureData = async (fixtureId) => {
  const data = await fetchFootballApi("fixtures", { id: fixtureId });
  const fixtureObj = data[0];

  return {
    ...fixtureObj,
    matchDate: fixtureObj.fixture.timestamp,
  };
};

// --- AGGREGATION & FIRESTORE LOGIC ---

/**
 * Fetches a fixture and writes it to fixtures/{season}/fixtures/{fixtureId}.
 * Throws on failure so callers and the scheduler can see it.
 * @param {object} args - { fixtureId }.
 */
const fetchAllMatchData = async ({ fixtureId }) => {
  console.log(`Fetching all data for fixture: ${fixtureId}`);

  const fixtureData = await fetchFixtureData(fixtureId);

  // Safety Check: If the core fixture data is missing, we shouldn't save
  if (!fixtureData) {
    console.warn(
      `Skipping save for ${fixtureId} because core fixture data is missing.`,
    );
    return;
  }

  const year = fixtureData?.league?.season;

  if (!year) {
    throw new Error("League season not found in the fixture data.");
  }

  await getFirestore()
    .collection("fixtures")
    .doc(year.toString())
    .collection("fixtures")
    .doc(fixtureId.toString())
    .set(fixtureData, { merge: true });

  console.log(`Successfully saved available data for fixture ${fixtureId}`);
};

/**
 * Deletes a user's existing membership for a league, if they have one in a
 * different group. Must be called inside a transaction, after all reads.
 * @param {object} transaction - The active Firestore transaction.
 * @param {object} db - Firestore instance.
 * @param {string} uid - The user id.
 * @param {string} oldGroupId - The group being left.
 * @param {object} oldJoinedGroupDoc - Already-read snapshot of the old membership.
 */
const queueOldMembershipCleanup = (
  transaction,
  db,
  uid,
  oldGroupId,
  oldJoinedGroupDoc,
) => {
  if (!oldJoinedGroupDoc.exists) return;

  const { role: oldRole } = oldJoinedGroupDoc.data();
  const oldRoleCollection = VALID_ROLES.includes(oldRole)
    ? `${oldRole}s`
    : "members";

  const oldGlobalMemberRef = db
    .collection("groupUsers")
    .doc(String(oldGroupId))
    .collection(oldRoleCollection)
    .doc(String(uid));

  transaction.delete(oldGlobalMemberRef);
  transaction.delete(oldJoinedGroupDoc.ref);
};

const addMemberToGroup = async (db, groupId, uid, role = "member") => {
  if (!VALID_ROLES.includes(role)) {
    throw new Error(`Invalid role: ${role}`);
  }

  const groupRef = db.collection("groups").doc(String(groupId));
  const userRef = db.collection("users").doc(uid);

  // User's private record for UI and permission checks
  const userJoinedGroupRef = userRef
    .collection("joinedGroups")
    .doc(String(groupId));

  // Dynamic global collection based on role (members, admins, or owners)
  // This allows for path-based Firestore Security Rules
  const roleCollection = `${role}s`;

  const globalMemberRef = db
    .collection("groupUsers")
    .doc(String(groupId))
    .collection(roleCollection)
    .doc(String(uid));

  try {
    await db.runTransaction(async (transaction) => {
      // 1. READ: Fetch Group and User data
      const [groupDoc, userDoc] = await Promise.all([
        transaction.get(groupRef),
        transaction.get(userRef),
      ]);

      if (!groupDoc.exists) throw new Error("Group does not exist.");
      if (!userDoc.exists) throw new Error("User does not exist.");

      const groupData = groupDoc.data();
      const fullUserData = userDoc.data();
      const leagueKey = groupData.league;

      // 1b. READ: If they already hold a team in this league, we must clear it
      // out rather than just overwriting the pointer, which would leave an
      // orphaned doc in the old group's member list.
      const oldGroupId = leagueKey
        ? fullUserData?.leagueTeams?.[leagueKey]
        : null;
      let oldJoinedGroupDoc = null;

      if (oldGroupId && String(oldGroupId) !== String(groupId)) {
        oldJoinedGroupDoc = await transaction.get(
          userRef.collection("joinedGroups").doc(String(oldGroupId)),
        );
      }

      // 2. PREPARE: Global Data (Stored in groupUsers/{groupId}/{role}s/{uid})
      const globalMemberData = {
        uid: uid,
        email: fullUserData.email || "",
        displayName: fullUserData.displayName || fullUserData.name || "Fan",
        joinedAt: FieldValue.serverTimestamp(),
        // We keep the role string here for easy querying if needed later
        role: role,
      };

      // 3. PREPARE: Private Metadata (Stored in users/{uid}/joinedGroups/{groupId})
      const userGroupMetadata = {
        groupId: String(groupId),
        groupName: groupData.name || "Unknown Group",
        role: role,
        joinedAt: FieldValue.serverTimestamp(),
        leagueKey: leagueKey || null,
      };

      // 4. PREPARE: User Profile Updates
      const userUpdate = {
        activeGroup: String(groupId),
      };

      if (leagueKey) {
        userUpdate[`leagueTeams.${leagueKey}`] = String(groupId);
        userUpdate[`lastTransferDates.${leagueKey}`] =
          FieldValue.serverTimestamp();
      }

      // 5. WRITE: Execute all updates atomically
      // If any of these fail, none of them happen.
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
    });

    return { success: true };
  } catch (error) {
    console.error("Transaction Join Error:", error);
    throw new Error(error.message || "Failed to join group.");
  }
};

const removeMemberFromGroup = async (db, groupId, uid) => {
  const userRef = db.collection("users").doc(uid);
  const userJoinedGroupRef = userRef
    .collection("joinedGroups")
    .doc(String(groupId));

  try {
    await db.runTransaction(async (transaction) => {
      // 1. READ: We must know the role and league before we can delete
      const userJoinedGroupDoc = await transaction.get(userJoinedGroupRef);

      if (!userJoinedGroupDoc.exists) {
        throw new Error("User record not found in this group.");
      }

      const { role, leagueKey } = userJoinedGroupDoc.data();

      // 2. REF: Construct the path to the global collection (members/admins/owners)
      // Fall back to "members" if the stored role is unrecognised, so we never
      // build a path from unvalidated data.
      const roleCollection = VALID_ROLES.includes(role) ? `${role}s` : "members";
      const globalMemberRef = db
        .collection("groupUsers")
        .doc(String(groupId))
        .collection(roleCollection)
        .doc(String(uid));

      // 3. PREPARE: User profile updates
      const userUpdate = {
        activeGroup: FieldValue.delete(), // Remove active status
      };

      // 11votes Logic: If this was their league-specific team, clear that slot
      if (leagueKey) {
        userUpdate[`leagueTeams.${leagueKey}`] = FieldValue.delete();
        // NOTE: We keep lastTransferDates.${leagueKey} as a "paper trail"
        // to prevent immediate re-joining/spamming.
      }

      // 4. WRITE: Atomic Cleanup
      transaction.delete(globalMemberRef); // Wipe from the global role list
      transaction.delete(userJoinedGroupRef); // Wipe from user's private list
      transaction.update(userRef, userUpdate); // Update the user document
    });

    return { success: true };
  } catch (error) {
    console.error("Transaction Removal Error:", error);
    throw new Error(error.message || "Failed to remove member safely.");
  }
};

// --- CLUB REGISTRY ---
//
// `groups/{teamId}` doubles as the club registry: the doc id is the
// API-Football team id. The nightly reconcile below is what makes
// promotion/relegation work without hand-editing the Firestore console.

/**
 * "Nottingham Forest" -> "nottingham-forest".
 * @param {string} name - The club name from the API.
 * @return {string} A URL-safe slug.
 */
const slugify = (name) =>
  String(name || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * A club group is one the reconcile is allowed to create/archive. Community and
 * private groups must never be touched, so both conditions have to hold: the
 * doc id is the numeric API team id, and the doc identifies itself as a club.
 * `groupType` is checked too because some hand-created docs predate `league`.
 * @param {string} docId - The group document id.
 * @param {object} data - The group document data.
 * @return {boolean} True when the reconcile owns this doc.
 */
const isClubGroup = (docId, data) =>
  /^\d+$/.test(String(docId)) &&
  (data?.groupType === "club" || data?.league === LEAGUE_KEY);

/**
 * Picks a slug that no existing group has already claimed.
 * @param {string} name - The club name from the API.
 * @param {string} teamId - The API team id, used to break collisions.
 * @param {Set<string>} takenSlugs - Slugs already in use across all groups.
 * @return {string} An unclaimed slug.
 */
const uniqueSlug = (name, teamId, takenSlugs) => {
  const base = slugify(name) || `club-${teamId}`;

  if (!takenSlugs.has(base)) return base;

  // The [clubSlug] route resolves a slug with `where slug == ... limit 1`, so a
  // duplicate would shadow an existing club. Suffix and log for manual cleanup.
  return `${base}-${teamId}`;
};

/**
 * Reconciles `groups` against this season's league table.
 *
 * Promoted clubs are created, survivors are marked active, and clubs that have
 * dropped out are frozen: `status: "archived"` plus `isGroupOpen: false`, which
 * the three join paths already reject. `isPublic`/`visibility` are deliberately
 * left alone so archived club pages stay publicly readable — existing members
 * keep their history, they just can't vote in a season that will never have data.
 *
 * @param {object} args - { db, apiTeams, season, dryRun }.
 * @return {Promise<object>} Summary of intended/applied changes.
 */
const reconcileClubGroups = async ({ db, apiTeams, season, dryRun = false }) => {
  const seasonStr = String(season);
  const summary = {
    dryRun,
    skipped: false,
    created: [],
    reactivated: [],
    archived: [],
    backfilled: [],
  };

  const apiById = new Map();

  for (const entry of apiTeams || []) {
    const id = entry?.team?.id;
    if (id === undefined || id === null) continue;
    apiById.set(String(id), entry.team);
  }

  // SAFETY: a short response means the API failed, throttled us, or hasn't
  // published the new season yet. Archiving off that would wipe out live clubs,
  // so bail before any write. Fixtures for whatever did come back still run.
  if (apiById.size < MIN_EXPECTED_TEAMS) {
    summary.skipped = true;
    return summary;
  }

  const groupsSnapshot = await db.collection("groups").get();
  const takenSlugs = new Set();
  const clubDocs = new Map();

  groupsSnapshot.forEach((doc) => {
    const data = doc.data() || {};

    // Every slug in the collection, not just clubs — the route looks up slugs
    // across all groups, so a community group can collide with a new club.
    if (data.slug) takenSlugs.add(data.slug);
    if (isClubGroup(doc.id, data)) clubDocs.set(doc.id, data);
  });

  const batch = db.batch();

  // --- A. Clubs in this season's league ---
  for (const [teamId, team] of apiById) {
    const ref = db.collection("groups").doc(teamId);
    const existing = clubDocs.get(teamId);
    const logoUrl =
      team.logo || `https://media.api-sports.io/football/teams/${teamId}.png`;

    if (!existing) {
      const slug = uniqueSlug(team.name, teamId, takenSlugs);
      takenSlugs.add(slug);
      summary.created.push({ teamId, name: team.name, slug });

      if (!dryRun) {
        batch.set(ref, {
          name: team.name || `Club ${teamId}`,
          slug,
          groupClubId: teamId,
          logoUrl,
          league: LEAGUE_KEY,
          groupType: "club",
          visibility: "public",
          isPublic: true,
          isGroupOpen: true,
          status: "active",
          lastActiveSeason: seasonStr,
          createdAt: FieldValue.serverTimestamp(),
        });
      }
      continue;
    }

    const update = {
      name: team.name || existing.name || `Club ${teamId}`,
      logoUrl,
      groupClubId: teamId,
      league: LEAGUE_KEY,
      groupType: "club",
      status: "active",
      lastActiveSeason: seasonStr,
    };

    // Backfill a slug rather than leave the club unroutable.
    if (!existing.slug) {
      update.slug = uniqueSlug(team.name, teamId, takenSlugs);
      takenSlugs.add(update.slug);
      summary.backfilled.push({ teamId, slug: update.slug });
    }

    // Only force the club back open when it was frozen. Touching isGroupOpen on
    // every run would silently undo an owner's updateGroupPrivacy choice.
    if (existing.status === "archived") {
      update.isGroupOpen = true;
      update.archivedAt = FieldValue.delete();
      summary.reactivated.push({ teamId, name: team.name });
    }

    if (!dryRun) batch.set(ref, update, { merge: true });
  }

  // --- B. Clubs that have dropped out ---
  for (const [teamId, data] of clubDocs) {
    if (apiById.has(teamId)) continue;
    if (data.status === "archived") continue;

    // On the very first run nothing has lastActiveSeason yet. A club missing
    // from this season's table was last in it the season before.
    const lastActiveSeason =
      data.lastActiveSeason || String(Number(season) - 1);

    summary.archived.push({ teamId, name: data.name, lastActiveSeason });

    if (!dryRun) {
      batch.set(
        db.collection("groups").doc(teamId),
        {
          status: "archived",
          isGroupOpen: false,
          lastActiveSeason,
          archivedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }
  }

  if (!dryRun) await batch.commit();

  return summary;
};

/**
 * Rebuilds `config/clubDirectory` — the single public doc the client reads to
 * render the club picker and transfer market, replacing the old hardcoded
 * teamList. Re-reads `groups` so it reflects the just-committed reconcile.
 * @param {object} args - { db, season }.
 */
const writeClubDirectory = async ({ db, season }) => {
  const groupsSnapshot = await db.collection("groups").get();
  const clubs = [];

  groupsSnapshot.forEach((doc) => {
    const data = doc.data() || {};
    if (!isClubGroup(doc.id, data)) return;
    if (data.isPublic === false) return;

    clubs.push({
      teamId: doc.id,
      name: data.name || "",
      slug: data.slug || "",
      logoUrl:
        data.logoUrl ||
        `https://media.api-sports.io/football/teams/${doc.id}.png`,
      status: data.status === "archived" ? "archived" : "active",
      lastActiveSeason: data.lastActiveSeason || null,
    });
  });

  // Active first, then alphabetical — the order the picker renders in.
  clubs.sort((a, b) => {
    if (a.status !== b.status) return a.status === "active" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  await db
    .collection(CLUB_DIRECTORY_PATH.collection)
    .doc(CLUB_DIRECTORY_PATH.doc)
    .set({
      season: String(season),
      clubs,
      updatedAt: FieldValue.serverTimestamp(),
    });

  return clubs;
};

module.exports = {
  SEASON,
  LEAGUE_ID,
  LEAGUE_KEY,
  MIN_EXPECTED_TEAMS,
  VALID_ROLES,
  SELF_JOIN_ROLES,
  INVITABLE_ROLES,
  fetchFootballApi,
  fetchFixtureData,
  fetchAllMatchData,
  addMemberToGroup,
  removeMemberFromGroup,
  queueOldMembershipCleanup,
  slugify,
  isClubGroup,
  reconcileClubGroups,
  writeClubDirectory,
};
