const { FieldValue } = require("firebase-admin/firestore");

const { computeMatchXp } = require("./computeMatchXp");
const { computePredictionPoints } = require("./predictionPoints");
const { publishableName, writeSeasonRow } = require("./progressStore");

/** API-Football short codes that mean the result is final. */
const FINISHED_STATUSES = ["FT", "AET", "PEN"];

/**
 * A club's finished fixtures, oldest first.
 *
 * Streaks are counted over the matches the club actually played, not over the
 * docs the fan happens to have — a fan who missed three matches has no doc for
 * them at all, so counting their own docs would report an unbroken streak
 * through the games they skipped.
 *
 * @param {Map<string, object>} fixtures - Finished fixtures by match id.
 * @param {string} clubId - API team id of the club.
 * @return {Array<string>} Match ids in kickoff order.
 */
function clubFixturesInOrder(fixtures, clubId) {
  const target = String(clubId);

  return [...fixtures.entries()]
    .filter(
      ([, data]) =>
        String(data.homeTeamId) === target || String(data.awayTeamId) === target,
    )
    .sort((a, b) => (Number(a[1].timestamp) || 0) - (Number(b[1].timestamp) || 0))
    .map(([id]) => id);
}

/**
 * Current and best run of consecutive club matches the fan took part in.
 *
 * "Took part" is any XP at all, which is the same bar the participation
 * counter uses — one mood tap counts, and that is deliberate on an app about
 * turning up.
 *
 * The current streak is counted from the most recent match backwards, so it
 * reflects "am I on a run right now"; the best is the longest anywhere in the
 * season.
 *
 * @param {Array<string>} orderedMatchIds - Club fixtures, oldest first.
 * @param {Set<string>} participatedIds - Matches the fan earned XP in.
 * @return {object} `{ currentStreak, bestStreak }`.
 */
function computeStreaks(orderedMatchIds, participatedIds) {
  let best = 0;
  let running = 0;

  for (const matchId of orderedMatchIds) {
    running = participatedIds.has(matchId) ? running + 1 : 0;
    if (running > best) best = running;
  }

  // Walk back from the latest match; the first gap ends the current run.
  let current = 0;
  for (let i = orderedMatchIds.length - 1; i >= 0; i--) {
    if (!participatedIds.has(orderedMatchIds[i])) break;
    current++;
  }

  return { currentStreak: current, bestStreak: best };
}

/**
 * Every finished fixture of the season, keyed by match id.
 *
 * Loaded once and shared across every user, because prediction scoring needs
 * the result and the team sheet for each match — reading them per user would
 * multiply one collection read by the size of the membership.
 *
 * Finished only: an unplayed match cannot score anything, and the unfinished
 * majority is the bulk of the collection.
 *
 * @param {FirebaseFirestore.Firestore} db - Admin Firestore.
 * @param {string} season - Season key.
 * @return {Promise<Map<string, object>>} matchId -> fixture data.
 */
async function loadFinishedFixtures(db, season) {
  const snapshot = await db
    .collection(`fixtures/${season}/fixtures`)
    .where("status", "in", FINISHED_STATUSES)
    .get();

  return new Map(snapshot.docs.map((doc) => [doc.id, doc.data()]));
}

/**
 * Recomputes every user's season XP from source and corrects the leaderboard.
 *
 * The trigger that runs during a match applies XP as a delta, because
 * recomputing a season total on every rating tap would cost a read per match
 * played. Firestore triggers are at-least-once, so a retried delivery can
 * double-apply a delta and leave a row permanently inflated. This job is the
 * correction: it reads the per-user match docs — the same documents the client
 * writes and the trigger reacts to — and writes absolute values over the top.
 *
 * Absolute, never incremental. That is the whole point: an incremental fix
 * would compound the error it exists to remove.
 *
 * Reads are scoped by walking known members of known club groups rather than
 * scanning `users`, so cost tracks membership rather than total signups.
 *
 * @param {object} args - Job dependencies.
 * @param {FirebaseFirestore.Firestore} args.db - Admin Firestore.
 * @param {string|number} args.season - Season key to rebuild.
 * @param {object} [args.logger] - console-compatible logger.
 * @param {boolean} [args.dryRun] - Compute and report without writing.
 * @return {Promise<{users: number, rows: number, groups: number}>} Summary.
 */
async function runGamificationReconcile({
  db,
  season,
  logger = console,
  dryRun = false,
}) {
  const seasonKey = String(season);

  // Same dry-run stub shape leagueCatalogue.js uses, so a rehearsal run costs
  // nothing and touches nothing.
  const writer = dryRun
    ? { set: () => {}, close: async () => {} }
    : db.bulkWriter();

  const summary = {
    users: 0,
    rows: 0,
    groups: 0,
    totalsFixed: 0,
    fixturesScored: 0,
  };

  const fixtures = await loadFinishedFixtures(db, seasonKey);
  summary.fixturesScored = fixtures.size;

  // Every uid touched this run, so the all-time totals pass below knows who to
  // rebuild without rescanning `users`.
  const seenUids = new Set();

  // Redacted names resolved this run, reused when refreshing the cached copy
  // on userProgress rather than re-reading every user doc a second time.
  const names = new Map();

  const groupsSnap = await db.collection("groups").get();

  for (const groupDoc of groupsSnap.docs) {
    const groupId = groupDoc.id;

    /*
     * The club whose XI this group's fans predict.
     *
     * NOT the group id. Auto-generated club groups live at groups/{teamId} so
     * the two match, but a community group does not: "The United Stand" is
     * groups/007 following club 33. Scoring its members' XI against team id 7
     * matches nothing in the feed and silently pays zero — and community
     * groups hold some of the most active fans.
     *
     * Every group carries groupClubId; the fallback is belt and braces.
     */
    const clubId = String(groupDoc.data()?.groupClubId ?? groupId);

    // Once per club, not once per fan — every member of a group streaks
    // against the same fixture list.
    const clubFixtureOrder = clubFixturesInOrder(fixtures, clubId);

    // Union of all three role collections. isGroupMemberServer only checks
    // `members` and misses staff, which would silently drop admins and owners
    // off their own club's leaderboard.
    const roleSnaps = await Promise.all(
      ["members", "admins", "owners"].map((role) =>
        db
          .collection("groupUsers")
          .doc(groupId)
          .collection(role)
          .get()
          .catch(() => null),
      ),
    );

    const uids = new Set();
    for (const snap of roleSnaps) {
      snap?.docs.forEach((doc) => uids.add(doc.id));
    }

    if (uids.size === 0) continue;
    summary.groups++;

    for (const uid of uids) {
      const matchesSnap = await db
        .collection("users")
        .doc(uid)
        .collection("groups")
        .doc(groupId)
        .collection("seasons")
        .doc(seasonKey)
        .collection("matches")
        .get()
        .catch(() => null);

      if (!matchesSnap) continue;
      summary.users++;

      let xp = 0;
      let matchesParticipated = 0;
      let predictionPoints = 0;
      let predictionsResolved = 0;
      const participatedIds = new Set();

      for (const matchDoc of matchesSnap.docs) {
        const data = matchDoc.data();

        const { xp: matchXp } = computeMatchXp(data);
        if (matchXp > 0) {
          xp += matchXp;
          matchesParticipated++;
          participatedIds.add(matchDoc.id);
        }

        // The second, separate ladder.
        const { points, resolved } = computePredictionPoints(
          data,
          fixtures.get(matchDoc.id),
          clubId,
        );
        if (resolved && points > 0) {
          predictionPoints += points;
          predictionsResolved++;
        }
      }

      // Read from `users/{uid}`, not the cached copy on userProgress: this
      // nightly pass is what makes a rename — or a change of mind about
      // appearing anonymously — actually propagate to the leaderboard.
      const userSnap = await db
        .collection("users")
        .doc(uid)
        .get()
        .catch(() => null);

      const displayName = publishableName(userSnap?.data());
      names.set(uid, displayName);

      const { currentStreak, bestStreak } = computeStreaks(
        clubFixtureOrder,
        participatedIds,
      );

      // A user with a membership but no participation still gets a row at 0,
      // so joining a club shows you on the board rather than nowhere.
      writeSeasonRow({
        db,
        writer,
        uid,
        groupId,
        season: seasonKey,
        xp,
        matchesParticipated,
        predictionPoints,
        predictionsResolved,
        currentStreak,
        bestStreak,
        displayName,
      });
      summary.rows++;
      seenUids.add(uid);
    }
  }

  // Season rows must land before the totals below are summed from them.
  await writer.close();

  // --- All-time totals --------------------------------------------------
  // `userProgress.totalXp` spans every season, so it cannot be rebuilt from
  // this season's numbers alone — a user's 2025 XP would vanish. Sum the user's
  // own season rows instead, which is a single-field query Firestore indexes
  // automatically.
  const totalsWriter = dryRun
    ? { set: () => {}, close: async () => {} }
    : db.bulkWriter();

  for (const uid of seenUids) {
    const rowsSnap = await db
      .collection("userSeasonProgress")
      .where("uid", "==", uid)
      .get()
      .catch(() => null);

    if (!rowsSnap) continue;

    const totalXp = rowsSnap.docs.reduce(
      (sum, doc) => sum + (Number(doc.data().xp) || 0),
      0,
    );

    // Refresh the cached name alongside the total. Without re-stamping
    // `nameSyncedAt` the trigger would keep serving whatever it cached on the
    // very first write, and a rename would never reach a leaderboard.
    totalsWriter.set(
      db.collection("userProgress").doc(uid),
      {
        uid,
        totalXp,
        displayName: names.get(uid) ?? null,
        nameSyncedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    summary.totalsFixed++;
  }

  await totalsWriter.close();

  logger.info?.(
    `[gamification] reconcile ${dryRun ? "(dry run) " : ""}season ${seasonKey}: ` +
      `${summary.rows} rows across ${summary.groups} groups`,
  );

  return summary;
}

module.exports = { runGamificationReconcile };
