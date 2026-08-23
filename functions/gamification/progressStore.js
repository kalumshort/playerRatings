const { FieldValue } = require("firebase-admin/firestore");

/**
 * Reads and writes the authoritative gamification state.
 *
 * Both collections here are SERVER-ONLY. `users/**` is fully self-writable by
 * its owner (firestore.rules:222-227 — no field allow-list, at any depth), so
 * XP stored there would be forgeable from a browser console. These live at the
 * top level instead, where the rules' closing
 * `match /{document=**} { allow write: if false; }` denies clients by default —
 * the same trick config/clubDirectory and inviteAttempts already use.
 *
 *   userProgress/{uid}                        identity, all-time XP, badges
 *   userSeasonProgress/{season}_{gid}_{uid}   one leaderboard row
 */

/**
 * Composite id so a leaderboard row is addressable without a query.
 * @param {string|number} season - Season key, e.g. "2026".
 * @param {string} groupId - Club group id.
 * @param {string} uid - The user.
 * @return {string} The `userSeasonProgress` document id.
 */
const seasonRowId = (season, groupId, uid) => `${season}_${groupId}_${uid}`;

/**
 * The display name to publish on a leaderboard.
 *
 * Reads `users/{uid}`, not `userProgress`. The user doc is the only place the
 * name and the opt-out actually live: `userProgress` is server-only, so a user
 * could never set an `anonymous` flag on it, and an opt-out you cannot reach is
 * not an opt-out. `users/**` is self-writable, which is exactly right for a
 * preference — the worst a user can do is rename themselves.
 *
 * Redaction happens HERE, at write time, rather than when rendering: both
 * gamification collections are world-readable, so an opted-out user's real name
 * must never be written into either of them in the first place.
 *
 * @param {object|null|undefined} userDoc - The `users/{uid}` document.
 * @return {string|null} A publishable name, or null when anonymous/unknown.
 */
function publishableName(userDoc) {
  if (!userDoc || userDoc.leaderboardAnonymous === true) return null;
  const name = String(userDoc.displayName || "").trim();
  // Cap the length so one fan cannot stretch every leaderboard row.
  return name.length > 0 ? name.slice(0, 40) : null;
}

/**
 * The name to put on this user's rows, preferring the cached copy.
 *
 * The trigger runs on every participation write — ~14 times during one rating
 * card — so re-reading `users/{uid}` each time would be pure waste. The
 * redacted name is cached onto `userProgress` and `nameSyncedAt` marks it as
 * resolved; the nightly reconcile always re-reads, so a rename or a change of
 * mind about anonymity propagates within a day.
 *
 * `nameSyncedAt` rather than a null check on the name itself, because null is a
 * legitimate cached value for an anonymous user and would otherwise re-read
 * forever.
 *
 * @param {FirebaseFirestore.Firestore} db - Admin Firestore.
 * @param {string} uid - The user.
 * @param {object|undefined} progressData - Existing userProgress data, if any.
 * @return {Promise<object>} `{ name, fresh }` — the publishable name, and
 *   whether it was just resolved (so the caller knows to cache it).
 */
async function resolvePublishedName(db, uid, progressData) {
  if (progressData?.nameSyncedAt) {
    return { name: progressData.displayName ?? null, fresh: false };
  }

  const userSnap = await db
    .collection("users")
    .doc(uid)
    .get()
    .catch(() => null);

  return { name: publishableName(userSnap?.data()), fresh: true };
}

/**
 * Applies an XP delta to a user's season row and all-time total.
 *
 * Deliberately an increment rather than an absolute write. Recomputing the
 * season total on every participation write would cost a read per match played
 * (~50) on every rating tap, and a user rates ~14 players a match. The nightly
 * reconcile is what corrects any drift this introduces — Firestore triggers are
 * at-least-once, so a retried delivery can double-apply.
 *
 * @param {object} args - Everything needed to locate and update the row.
 * @param {FirebaseFirestore.Firestore} args.db - Admin Firestore.
 * @param {string} args.uid - The user.
 * @param {string} args.groupId - Club group.
 * @param {string} args.season - Season key, e.g. "2026".
 * @param {number} args.xpDelta - Signed XP change; a no-op when 0.
 * @param {boolean} args.nowParticipating - True when this write is the user's
 *   first participation in the match, so the match counter moves once only.
 * @return {Promise<void>}
 */
async function applyXpDelta({
  db,
  uid,
  groupId,
  season,
  xpDelta,
  nowParticipating,
}) {
  if (!uid || !groupId || !season) return;
  if (!xpDelta && !nowParticipating) return;

  const progressRef = db.collection("userProgress").doc(uid);
  const rowRef = db
    .collection("userSeasonProgress")
    .doc(seasonRowId(season, groupId, uid));

  const [progressSnap, rowSnap] = await Promise.all([
    progressRef.get(),
    rowRef.get(),
  ]);

  // The name is denormalised onto the row so a leaderboard is one query with
  // no fan-out read per entry.
  const { name: displayName, fresh } = await resolvePublishedName(
    db,
    uid,
    progressSnap.data(),
  );

  /*
   * Matches played, which must survive a user whose participation predates
   * this trigger existing.
   *
   * `nowParticipating` alone only fires when XP crosses 0, so for a doc that
   * already had predictions on it the first event we ever see is an UPDATE
   * with xpBefore > 0 — and the counter was never written at all. Anchoring on
   * the row instead: if there is no row yet and this match earned anything,
   * that is at least one match. The nightly reconcile writes the true absolute
   * figure over the top.
   */
  const rowData = rowSnap.data();
  const hasCounter = typeof rowData?.matchesParticipated === "number";

  let matchesPatch = {};
  if (!hasCounter) {
    matchesPatch = { matchesParticipated: 1 };
  } else if (nowParticipating) {
    matchesPatch = { matchesParticipated: FieldValue.increment(1) };
  }

  const batch = db.batch();

  batch.set(
    progressRef,
    {
      uid,
      totalXp: FieldValue.increment(xpDelta),
      // Cached redacted name, plus the marker that says it is resolved.
      ...(fresh ? { displayName, nameSyncedAt: FieldValue.serverTimestamp() } : {}),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  batch.set(
    rowRef,
    {
      uid,
      season: String(season),
      groupId: String(groupId),
      displayName,
      xp: FieldValue.increment(xpDelta),
      ...matchesPatch,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  await batch.commit();
}

/**
 * Overwrites a season row with authoritative absolute values.
 *
 * Used by the nightly reconcile, which recomputes from the source match docs.
 * Absolute rather than incremental, so a double-applied trigger delta is
 * corrected rather than compounded.
 *
 * @param {object} args - The recomputed totals.
 * @param {FirebaseFirestore.Firestore} args.db - Admin Firestore.
 * @param {object} args.writer - A BulkWriter (or a dry-run stub).
 * @param {string} args.uid - The user.
 * @param {string} args.groupId - Club group.
 * @param {string} args.season - Season key.
 * @param {number} args.xp - Absolute season XP.
 * @param {number} args.matchesParticipated - Absolute match count.
 * @param {number} [args.predictionPoints] - Absolute prediction points.
 * @param {number} [args.predictionsResolved] - Matches that scored any points.
 * @param {string|null} args.displayName - Already redacted for anonymity.
 * @return {void}
 */
function writeSeasonRow({
  db,
  writer,
  uid,
  groupId,
  season,
  xp,
  matchesParticipated,
  predictionPoints = 0,
  predictionsResolved = 0,
  displayName,
}) {
  const rowRef = db
    .collection("userSeasonProgress")
    .doc(seasonRowId(season, groupId, uid));

  writer.set(
    rowRef,
    {
      uid,
      season: String(season),
      groupId: String(groupId),
      displayName,
      xp,
      matchesParticipated,
      // The second ladder, kept as its own field so it can never be summed
      // into XP by accident — the whole point is that turning up and being
      // right are ranked separately.
      predictionPoints,
      predictionsResolved,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

module.exports = {
  seasonRowId,
  publishableName,
  applyXpDelta,
  writeSeasonRow,
};
