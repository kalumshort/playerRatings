const { XP, XP_CAPS } = require("./xpConfig");

/**
 * Fan XP earned from one user's participation in one match.
 *
 * Pure and deterministic: same doc in, same number out, no Firebase imports.
 * That is what lets the trigger take `compute(after) - compute(before)` as an
 * exact delta, and what makes this directly unit-testable.
 *
 * Input is the per-user match doc at
 * `users/{uid}/groups/{gid}/seasons/{season}/matches/{matchId}`.
 *
 * Every rule here keys off a field being PRESENT rather than off how often it
 * changed, because most of these actions are mutable:
 *  - winner / score / player-to-watch can be changed freely before kickoff
 *    (handlePredictWinningTeam and friends move the vote rather than adding one)
 *  - the Fans XI is not deduped at all — handlePredictTeamSubmit uses two
 *    parallel writes and double-counts the group aggregate on resubmit, so
 *    keying off the `teamSubmitted` boolean is what stops XP doing the same
 *  - ratings and the MOTM vote are already idempotent via firestore.rules
 *    (notYetRated / notYetVotedMotm), so their counts are trustworthy
 *
 * @param {object|null|undefined} doc - The per-user match document, or null
 *   when it does not exist yet (which is the `before` state of a first write).
 * @return {{xp: number, breakdown: Object<string, number>, areas: string[]}}
 *   Total XP, a per-source breakdown for the UI, and which of the five feature
 *   areas were touched.
 */
function computeMatchXp(doc) {
  const breakdown = {};
  const areas = new Set();

  if (!doc || typeof doc !== "object") {
    return { xp: 0, breakdown, areas: [] };
  }

  const award = (key, amount, area) => {
    if (amount <= 0) return;
    breakdown[key] = (breakdown[key] || 0) + amount;
    if (area) areas.add(area);
  };

  // Counts can arrive as anything after a hand-edited client write. Clamp to a
  // non-negative integer so a forged `moodTaps: -5` or `"lots"` can never
  // produce negative or NaN XP, which would corrupt the running total.
  const count = (value, cap) => {
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.min(n, cap);
  };

  // --- Pre-match predictions -------------------------------------------
  if (doc.result) award("predictWinner", XP.predictWinner, "predictions");
  if (doc.ScorePrediction) award("predictScore", XP.predictScore, "predictions");
  if (doc.preMatchMotm) {
    award("predictPlayerToWatch", XP.predictPlayerToWatch, "predictions");
  }

  // Boolean, not a count: resubmitting an XI must never pay twice.
  if (doc.teamSubmitted === true) {
    award("submitLineup", XP.submitLineup, "lineup");
  }

  // --- Ratings ----------------------------------------------------------
  const ratedPlayers = doc.players && typeof doc.players === "object"
    ? Object.keys(doc.players).length
    : 0;

  if (ratedPlayers > 0) {
    const rated = count(ratedPlayers, XP_CAPS.ratedPlayers);
    award("ratePlayer", rated * XP.ratePlayer, "ratings");
  }

  if (doc.ratingsSubmitted === true) {
    award("submitAllRatings", XP.submitAllRatings, "ratings");
  }

  // `pendingMotm` is the draft pick held while the user is still rating; only
  // the promoted `motmVote` counts.
  if (doc.motmVote) award("motmVote", XP.motmVote, "ratings");

  // --- Live participation ----------------------------------------------
  const moodTaps = count(doc.moodTaps, XP_CAPS.moodTaps);
  if (moodTaps > 0) award("moodTap", moodTaps * XP.moodTap, "live");

  const liveVotes = count(doc.liveVotes, XP_CAPS.liveVotes);
  if (liveVotes > 0) award("liveVote", liveVotes * XP.liveVote, "live");

  const reactions = count(doc.reactions, XP_CAPS.eventReactions);
  if (reactions > 0) {
    award("eventReaction", reactions * XP.eventReaction, "reactions");
  }

  // --- Breadth bonus ----------------------------------------------------
  // Rewards using the whole app on one matchday rather than grinding a single
  // action, which is the behaviour worth encouraging on an opinion app.
  if (areas.size === 5) {
    breakdown.fullNinety = XP.fullNinety;
  }

  const xp = Object.values(breakdown).reduce((sum, n) => sum + n, 0);

  return { xp, breakdown, areas: [...areas] };
}

module.exports = { computeMatchXp };
