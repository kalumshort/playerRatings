// Fan XP: what participating in a match is worth.
//
// NOTE: functions/gamification/xpConfig.js is a byte-for-byte mirror of the
// values below. `src/` and `functions/` are separate packages (ESM/TS vs CJS)
// and cannot import each other — the same split `CURRENT_SEASON` lives with in
// src/lib/config/season.ts. Change one, change the other.
//
// The design rule: XP rewards PARTICIPATION, never being correct. Rating a
// player, tapping a mood or reacting to a goal has no right answer, and the app
// is built on fan opinion — so showing up and having a say is the thing being
// paid for. Accuracy is scored separately as Prediction Points, on its own
// ladder, so a fan who never predicts can still top the XP leaderboard.

/** Every action that earns Fan XP, with its per-match ceiling. */
export const XP = {
  /** Per player rated. Ratings are idempotent-by-rules, so this can't be farmed. */
  ratePlayer: 2,
  /** One-off, for finishing the whole card. */
  submitAllRatings: 15,
  motmVote: 10,
  submitLineup: 20,
  predictWinner: 10,
  predictScore: 10,
  predictPlayerToWatch: 10,
  /** Deliberately cheap and hard-capped — mood taps are unlimited by design. */
  moodTap: 1,
  liveVote: 2,
  eventReaction: 1,
  /** Used all five feature areas in one match. */
  fullNinety: 25,
} as const;

/**
 * Ceilings, applied per match.
 *
 * These are what bound a forged participation record: `users/**` is fully
 * self-writable (firestore.rules:222-227), so a determined user can set these
 * flags without doing the work. Capping means the ceiling is roughly one
 * match's XP per fixture that actually exists, rather than unbounded.
 */
export const XP_CAPS = {
  /** A full XI plus the substitutes who featured. */
  ratedPlayers: 15,
  moodTaps: 5,
  liveVotes: 5,
  eventReactions: 5,
} as const;

/** Highest XP a single match can yield. Used by tests and the progress UI. */
export const MAX_MATCH_XP =
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

/**
 * The five feature areas. Touching all of them in one match earns `fullNinety`.
 * This is the one bonus that rewards breadth rather than volume.
 */
export const FEATURE_AREAS = [
  "predictions",
  "lineup",
  "ratings",
  "live",
  "reactions",
] as const;

export type FeatureArea = (typeof FEATURE_AREAS)[number];

/**
 * Prediction Points — the ONLY place being right is rewarded.
 *
 * A separate ladder from Fan XP on purpose. XP is for turning up, and feeding
 * accuracy into it would put the luckiest forecaster at the top of a board
 * meant to rank the most involved fan. These never touch the XP total.
 *
 * Result and scoreline stack: calling 2-1 is also calling a home win.
 */
export const PREDICTION = {
  correctResult: 15,
  exactScore: 40,
  xiHit: 3,
  perfectXi: 50,
  playerToWatchInvolved: 20,
} as const;

/** Eleven hits is the most the per-hit award can pay. */
export const PREDICTION_CAPS = { xiHits: 11 } as const;

/** Highest prediction points a single match can yield. */
export const MAX_MATCH_PREDICTION_POINTS =
  PREDICTION.correctResult +
  PREDICTION.exactScore +
  PREDICTION.xiHit * PREDICTION_CAPS.xiHits +
  PREDICTION.perfectXi +
  PREDICTION.playerToWatchInvolved;

/**
 * Levels, lowest first. Derived from total XP on read and never stored, so
 * retuning these can never leave a stored level stale.
 */
export const LEVELS = [
  { level: 1, name: "Academy", minXp: 0 },
  { level: 2, name: "Squad Player", minXp: 250 },
  { level: 3, name: "First Team", minXp: 750 },
  { level: 4, name: "Fan Favourite", minXp: 1750 },
  { level: 5, name: "Cult Hero", minXp: 3500 },
  { level: 6, name: "Club Legend", minXp: 6000 },
  { level: 7, name: "Icon", minXp: 10000 },
] as const;

export interface LevelProgress {
  level: number;
  name: string;
  /** XP at which this level started. */
  minXp: number;
  /** XP needed for the next level, or null at the top. */
  nextXp: number | null;
  /** 0-1 through the current level; 1 when maxed. */
  progress: number;
}

/** Resolves total XP to a level and how far through it the user is. */
export function levelFromXp(totalXp: number): LevelProgress {
  const xp = Math.max(0, Math.floor(totalXp || 0));

  // Explicitly the union of all tiers: `as const` narrows LEVELS[0] to just
  // Academy, so an inferred `current` cannot be reassigned to any other tier.
  let current: (typeof LEVELS)[number] = LEVELS[0];
  for (const tier of LEVELS) {
    if (xp >= tier.minXp) current = tier;
  }

  const next = LEVELS.find((tier) => tier.minXp > xp) ?? null;
  const span = next ? next.minXp - current.minXp : 0;

  return {
    level: current.level,
    name: current.name,
    minXp: current.minXp,
    nextXp: next?.minXp ?? null,
    progress: next && span > 0 ? (xp - current.minXp) / span : 1,
  };
}
