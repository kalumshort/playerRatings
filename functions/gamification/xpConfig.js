/**
 * Fan XP: what participating in a match is worth.
 *
 * NOTE: src/lib/gamification/xpConfig.ts is a mirror of the values below.
 * `src/` and `functions/` are separate packages (ESM/TS vs CJS) and cannot
 * import each other — the same split `SEASON` lives with in helperFunctions.js.
 * Change one, change the other.
 *
 * The design rule: XP rewards PARTICIPATION, never being correct. Rating a
 * player, tapping a mood or reacting to a goal has no right answer, and the app
 * is built on fan opinion — so showing up and having a say is the thing being
 * paid for. Accuracy is scored separately as Prediction Points.
 */

/** Every action that earns Fan XP. */
const XP = {
  ratePlayer: 2,
  submitAllRatings: 15,
  motmVote: 10,
  submitLineup: 20,
  predictWinner: 10,
  predictScore: 10,
  predictPlayerToWatch: 10,
  moodTap: 1,
  liveVote: 2,
  eventReaction: 1,
  fullNinety: 25,
};

/**
 * Ceilings, applied per match.
 *
 * These are what bound a forged participation record: `users/**` is fully
 * self-writable (firestore.rules:222-227), so a determined user can set these
 * flags without doing the work. Capping means the ceiling is roughly one
 * match's XP per fixture that actually exists, rather than unbounded.
 */
const XP_CAPS = {
  ratedPlayers: 15,
  moodTaps: 5,
  liveVotes: 5,
  eventReactions: 5,
};

/** Highest XP a single match can yield. */
const MAX_MATCH_XP =
  XP.ratePlayer * XP_CAPS.ratedPlayers +
  XP.submitAllRatings +
  XP.motmVote +
  XP.submitLineup +
  XP.predictWinner +
  XP.predictScore +
  XP.predictPlayerToWatch +
  XP.moodTap * XP_CAPS.moodTaps +
  XP.liveVote * XP_CAPS.liveVotes +
  XP.eventReaction * XP_CAPS.eventReactions +
  XP.fullNinety;

/** The five feature areas. Touching all of them earns `fullNinety`. */
const FEATURE_AREAS = [
  "predictions",
  "lineup",
  "ratings",
  "live",
  "reactions",
];

/**
 * Prediction Points — the ONLY place being right is rewarded.
 *
 * A separate ladder from Fan XP on purpose. XP is for turning up, and feeding
 * accuracy into it would put the luckiest forecaster at the top of a board
 * meant to rank the most involved fan. These never touch the XP total.
 *
 * Result and scoreline stack: calling 2-1 is also calling a home win, and
 * paying both is the convention every prediction game uses.
 */
const PREDICTION = {
  correctResult: 15,
  exactScore: 40,
  /** Per player correctly named in the starting XI. */
  xiHit: 3,
  /** All eleven, on top of the per-hit points. */
  perfectXi: 50,
  /** Your player to watch scored or assisted. */
  playerToWatchInvolved: 20,
};

/** Eleven hits is the most the per-hit award can pay. */
const PREDICTION_CAPS = { xiHits: 11 };

module.exports = {
  XP,
  XP_CAPS,
  MAX_MATCH_XP,
  FEATURE_AREAS,
  PREDICTION,
  PREDICTION_CAPS,
};
