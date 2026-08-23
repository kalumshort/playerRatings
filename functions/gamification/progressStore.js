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
 * Redaction happens HERE, at write time, rather than when rendering: the
 * leaderboard collection is world-readable, so an opted-out user's real name
 * must never be written into it in the first place.
 *
 * @param {object|null} progress - The userProgress doc, if any.
 * @return {string|null} A publishable name, or null when anonymous/unknown.
 */
function publishableName(progress) {
  if (!progress || progress.anonymous === true) return null;
  const name = String(progress.displayName || "").trim();
  return name.length > 0 ? name : null;
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

  // The name is denormalised onto the row so a leaderboard is one query with
  // no fan-out read per entry.
  const progressSnap = await progressRef.get();
  const displayName = publishableName(progressSnap.data());

  const batch = db.batch();

  batch.set(
    progressRef,
    {
      uid,
      totalXp: FieldValue.increment(xpDelta),
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
      ...(nowParticipating
        ? { matchesParticipated: FieldValue.increment(1) }
        : {}),
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
