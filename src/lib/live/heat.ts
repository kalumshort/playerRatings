/**
 * Live manager mode: how the crowd's mood on a player is scored.
 *
 * This replaces a top-2/bottom-2 RANKING. That model badged somebody hot and
 * somebody cold no matter what happened on the pitch — with four engaged fans,
 * a single tap in a quiet minute crowned the league's hottest player. Here a
 * player earns a badge on their own numbers or gets nothing, so several players
 * can be hot at once and a flat first half badges nobody.
 *
 * Two different inputs, deliberately:
 *  - `live`  — one NET stance per fan per player. Drives the tier, and only
 *              means anything because each fan holds one stance at a time
 *              (see `voters/{userId}` in client-actions.ts).
 *  - minute buckets — the append-only history. Drives momentum (the secondary
 *              rising/falling arrow) and the whole Full Time story.
 */

export type HeatTier =
  | "inferno"
  | "onfire"
  | "warm"
  | "neutral"
  | "chilly"
  | "frozen";

export type StanceMood = "hot" | "cold" | null;

/** Net stances before anyone is badged at all. */
export const HEAT_FLOOR = 3;

/** Minutes of history behind the momentum arrow. */
export const MOMENTUM_WINDOW = 10;

/** Share of engaged fans that has to want a player off to force the call. */
export const SUB_DEMAND_SHARE = 0.5;

// ─── SHAPES ─────────────────────────────────────────────────────────────────

/** One player's counters. Also carries `sub_req_{playerId}` keys. */
export interface LivePlayerCounts {
  hot?: number;
  cold?: number;
  subOut?: number;
  [key: string]: number | undefined;
}

/** The `livePlayerStats/{matchId}` aggregate document. */
export interface LiveStatsDoc {
  /** Append-only running totals. Kept for the Full Time story. */
  totals?: Record<string, LivePlayerCounts>;
  /** Net CURRENT stances — the deduped signal the pitch reads. */
  live?: Record<string, LivePlayerCounts>;
  /** Distinct fans who have cast at least one stance this match. */
  voterCount?: number;
  /** Minute buckets, keyed by elapsed minute as a string. */
  [minute: string]: any;
}

/** One fan's stance on one player. */
export interface PlayerStance {
  mood?: StanceMood;
  moodMinute?: number;
  /** Id of the substitute they want brought on, or null for no sub request. */
  subFor?: string | null;
  subMinute?: number;
}

export type StanceMap = Record<string, PlayerStance>;

export interface PlayerHeat {
  playerId: string;
  tier: HeatTier;
  /** Fans currently calling them hot. */
  support: number;
  /** Fans currently calling them cold. */
  doubt: number;
  net: number;
  /** net / engaged, clamped to -1..1. */
  share: number;
  engaged: number;
  /** Net hot-minus-cold over the last MOMENTUM_WINDOW minutes of history. */
  momentum: number;
  subOut: number;
  /** 0..1 toward the sub threshold. */
  subPressure: number;
  subDemanded: boolean;
  /** Stances still needed to trip the demand. 0 once demanded. */
  subRemaining: number;
  /** Id of the replacement the crowd most wants on. */
  topSubTarget: string | null;
}

// ─── TIER TABLE ─────────────────────────────────────────────────────────────

export interface HeatTierSpec {
  label: string;
  /** Short line for the legend. */
  hint: string;
  direction: "hot" | "cold" | "none";
  /** Ranks tiers by intensity, for "who was hottest" sorts. */
  rank: number;
  /** Seconds per pulse. Hotter pulses faster; neutral does not pulse. */
  pulseSeconds: number;
  /** Multiplier on the badge's glow radius. */
  glow: number;
}

/**
 * One table so the badge, the player ring, the legend, the modal and the Full
 * Time tab cannot drift apart. Colours are NOT here — they come from
 * `theme.palette.heat` at render time, because they have to follow the mode.
 */
export const HEAT_TIERS: Record<HeatTier, HeatTierSpec> = {
  inferno: {
    label: "Unplayable",
    hint: "Half the crowd or more, and climbing",
    direction: "hot",
    rank: 3,
    pulseSeconds: 1.1,
    glow: 1,
  },
  onfire: {
    label: "On fire",
    hint: "A quarter of the crowd are raving",
    direction: "hot",
    rank: 2,
    pulseSeconds: 1.6,
    glow: 0.7,
  },
  warm: {
    label: "Warming up",
    hint: "A few fans like what they see",
    direction: "hot",
    rank: 1,
    pulseSeconds: 2.4,
    glow: 0.4,
  },
  neutral: {
    label: "Nothing in it",
    hint: "Not enough of a verdict either way",
    direction: "none",
    rank: 0,
    pulseSeconds: 0,
    glow: 0,
  },
  chilly: {
    label: "Struggling",
    hint: "A few fans have seen enough",
    direction: "cold",
    rank: 1,
    pulseSeconds: 2.4,
    glow: 0.4,
  },
  frozen: {
    label: "Frozen out",
    hint: "A quarter of the crowd or more have turned",
    direction: "cold",
    rank: 2,
    pulseSeconds: 1.6,
    glow: 0.7,
  },
};

/** Resolves the gradient for a tier against the live theme palette. */
export const tierGradient = (tier: HeatTier, heat: any): string => {
  switch (tier) {
    case "inferno":
      return `linear-gradient(135deg, ${heat.infernoStart} 0%, ${heat.infernoEnd} 100%)`;
    case "onfire":
      return `linear-gradient(135deg, ${heat.fireStart} 0%, ${heat.fireEnd} 100%)`;
    case "warm":
      return `linear-gradient(135deg, ${heat.warmStart} 0%, ${heat.warmEnd} 100%)`;
    case "frozen":
      return `linear-gradient(135deg, ${heat.frozenStart} 0%, ${heat.frozenEnd} 100%)`;
    case "chilly":
      return `linear-gradient(135deg, ${heat.chillyStart} 0%, ${heat.chillyEnd} 100%)`;
    default:
      return "transparent";
  }
};

/** The single colour for a tier — rings, bars and text, where a gradient can't go. */
export const tierColor = (tier: HeatTier, heat: any): string | null => {
  const dir = HEAT_TIERS[tier].direction;
  if (dir === "hot") return heat.hotSolid;
  if (dir === "cold") return heat.coldSolid;
  return null;
};

// ─── STANCE ARITHMETIC ──────────────────────────────────────────────────────

const EMPTY_STANCE: PlayerStance = { mood: null, subFor: null };

/**
 * The counter deltas that move one player's aggregate from `from` to `to`.
 *
 * The single source of truth for both halves of a vote: the Firestore write
 * (`castLivePlayerVote`) and the optimistic paint (`overlayStances`) call this,
 * so what the fan sees the instant they tap is arithmetically the same thing
 * the server is about to be told. When they disagree, it is a bug in one
 * function rather than two implementations that drifted.
 *
 * `sub` and `sub_req_{id}` always move together — split across two writes, a
 * failure between them counted a sub request with no target and corrupted the
 * suggestion list.
 */
export const stanceDelta = (
  from: PlayerStance | undefined,
  to: PlayerStance,
): Record<string, number> => {
  const prev = from ?? EMPTY_STANCE;
  const delta: Record<string, number> = {};

  const bump = (key: string, by: number) => {
    delta[key] = (delta[key] ?? 0) + by;
    if (delta[key] === 0) delete delta[key];
  };

  const prevMood = prev.mood ?? null;
  const nextMood = to.mood ?? null;
  if (prevMood !== nextMood) {
    if (prevMood) bump(prevMood, -1);
    if (nextMood) bump(nextMood, 1);
  }

  const prevSub = prev.subFor ?? null;
  const nextSub = to.subFor ?? null;
  if (prevSub !== nextSub) {
    if (prevSub) {
      bump("subOut", -1);
      bump(`sub_req_${prevSub}`, -1);
    }
    if (nextSub) {
      bump("subOut", 1);
      bump(`sub_req_${nextSub}`, 1);
    }
  }

  return delta;
};

/**
 * Applies the difference between the fan's confirmed and pending stances on
 * top of the server's `live` map.
 *
 * Self-correcting by construction: it is always a diff against what the server
 * last confirmed, so once the snapshot catches up the delta is zero and the
 * overlay vanishes on its own. No timers, no reconciliation pass.
 */
export const overlayStances = (
  live: Record<string, LivePlayerCounts>,
  confirmed: StanceMap,
  pending: StanceMap,
): Record<string, LivePlayerCounts> => {
  const ids = Object.keys(pending);
  if (ids.length === 0) return live;

  const out: Record<string, LivePlayerCounts> = { ...live };

  ids.forEach((playerId) => {
    const delta = stanceDelta(confirmed[playerId], pending[playerId]);
    const keys = Object.keys(delta);
    if (keys.length === 0) return;

    const next: LivePlayerCounts = { ...(out[playerId] ?? {}) };
    keys.forEach((key) => {
      // Never below zero: an overlay is a guess, and a negative counter would
      // render as a nonsense percentage if the guess raced a stale snapshot.
      next[key] = Math.max(0, (next[key] ?? 0) + delta[key]);
    });
    out[playerId] = next;
  });

  return out;
};

// ─── SCORING ────────────────────────────────────────────────────────────────

/** How many fans must want a player off before the crowd forces the call. */
export const subThreshold = (engaged: number) =>
  Math.max(HEAT_FLOOR, Math.ceil(SUB_DEMAND_SHARE * Math.max(engaged, 1)));

/**
 * Tier from a net stance count and its share of the crowd.
 *
 * The floor is applied FIRST and without exception. It is the whole difference
 * between this and the ranking it replaces: three fans have to agree before
 * anything appears, so the first tap of a match badges nobody.
 */
export const heatTierOf = (net: number, share: number): HeatTier => {
  const size = Math.abs(net);
  if (size < HEAT_FLOOR) return "neutral";

  if (net > 0) {
    if (net >= 5 && share >= 0.5) return "inferno";
    if (share >= 0.25) return "onfire";
    return "warm";
  }
  if (share <= -0.25) return "frozen";
  return "chilly";
};

/** Net hot-minus-cold for one player over the last MOMENTUM_WINDOW minutes. */
const momentumFor = (
  stats: LiveStatsDoc,
  playerId: string,
  currentMinute: number,
): number => {
  let net = 0;
  for (let i = 0; i < MOMENTUM_WINDOW; i += 1) {
    const minute = currentMinute - i;
    if (minute < 0) break;
    const bucket = stats[String(minute)]?.[playerId];
    if (!bucket) continue;
    net += (bucket.hot || 0) - (bucket.cold || 0);
  }
  return net;
};

/** The replacement the crowd most wants on for this player. */
const topSubTargetOf = (counts: LivePlayerCounts): string | null => {
  let best: string | null = null;
  let bestVotes = 0;
  Object.entries(counts).forEach(([key, value]) => {
    if (!key.startsWith("sub_req_")) return;
    const votes = value ?? 0;
    if (votes > bestVotes) {
      bestVotes = votes;
      best = key.slice("sub_req_".length);
    }
  });
  return best;
};

/**
 * Scores every player the crowd has an opinion on.
 *
 * `live` is optional on the document: a match whose stats predate this feature
 * has only `totals`, and a doc can exist with neither. Everything below reads
 * through `?? {}` rather than destructuring — the previous version did
 * `Object.keys(totals)` on a raw destructure and threw outright on a document
 * that existed without that one field.
 */
export const computeHeatBoard = (
  stats: LiveStatsDoc | null | undefined,
  elapsedMinute: number | string | null | undefined,
  live?: Record<string, LivePlayerCounts>,
): Record<string, PlayerHeat> => {
  const doc = stats ?? {};
  const current = live ?? doc.live ?? {};
  const engaged = Math.max(Number(doc.voterCount) || 0, 0);
  const minute = Number(elapsedMinute) || 0;
  const threshold = subThreshold(engaged);

  const board: Record<string, PlayerHeat> = {};

  Object.keys(current).forEach((playerId) => {
    const counts = current[playerId] ?? {};
    const support = Math.max(counts.hot ?? 0, 0);
    const doubt = Math.max(counts.cold ?? 0, 0);
    const subOut = Math.max(counts.subOut ?? 0, 0);
    const net = support - doubt;

    // Clamped because `engaged` is a separate counter from the stance counters
    // and can momentarily lag them mid-write.
    const share = Math.max(-1, Math.min(1, net / Math.max(engaged, 1)));

    board[playerId] = {
      playerId,
      tier: heatTierOf(net, share),
      support,
      doubt,
      net,
      share,
      engaged,
      momentum: momentumFor(doc, playerId, minute),
      subOut,
      subPressure: Math.min(1, subOut / threshold),
      subDemanded: subOut >= threshold,
      subRemaining: Math.max(0, threshold - subOut),
      topSubTarget: topSubTargetOf(counts),
    };
  });

  return board;
};

/** A player with no crowd verdict at all, so callers never handle undefined. */
export const emptyHeat = (playerId: string, engaged = 0): PlayerHeat => ({
  playerId,
  tier: "neutral",
  support: 0,
  doubt: 0,
  net: 0,
  share: 0,
  engaged,
  momentum: 0,
  subOut: 0,
  subPressure: 0,
  subDemanded: false,
  subRemaining: subThreshold(engaged),
  topSubTarget: null,
});
