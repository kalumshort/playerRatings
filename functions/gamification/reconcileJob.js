const { FieldValue } = require("firebase-admin/firestore");

const { computeMatchXp } = require("./computeMatchXp");
const { publishableName, writeSeasonRow } = require("./progressStore");

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

  const summary = { users: 0, rows: 0, groups: 0, totalsFixed: 0 };

  // Every uid touched this run, so the all-time totals pass below knows who to
  // rebuild without rescanning `users`.
  const seenUids = new Set();

  // Redacted names resolved this run, reused when refreshing the cached copy
  // on userProgress rather than re-reading every user doc a second time.
  const names = new Map();

  const groupsSnap = await db.collection("groups").get();

  for (const groupDoc of groupsSnap.docs) {
    const groupId = groupDoc.id;

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

      for (const matchDoc of matchesSnap.docs) {
        const { xp: matchXp } = computeMatchXp(matchDoc.data());
        if (matchXp > 0) {
          xp += matchXp;
          matchesParticipated++;
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
