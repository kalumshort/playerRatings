/**
 * Full time: turning the live vote timeline into the story of the match.
 *
 * Everything here reads data the app was already writing and then throwing
 * away. `livePlayerStats` kept a per-minute record of what fans felt about
 * every player, all match, and nothing ever read it back — the pitch only ever
 * looked at a ten-minute window, and once the whistle went that window froze
 * and the rest was dead weight in a document.
 */

import {
  HEAT_TIERS,
  heatTierOf,
  subThreshold,
  type HeatTier,
  type LivePlayerCounts,
  type LiveStatsDoc,
} from "./heat";
import { MOODS, getStatus } from
  "@/components/client/Fixture/Components/FanMoodSelector/moodConfig";

// ─── SHARED ─────────────────────────────────────────────────────────────────

/** Minute keys present in the document, ascending. */
const minuteKeys = (stats: LiveStatsDoc): number[] =>
  Object.keys(stats ?? {})
    .filter((key) => /^\d+$/.test(key))
    .map(Number)
    .sort((a, b) => a - b);

/** True when a match has enough of a record to tell a story about. */
export const hasLiveStory = (stats: LiveStatsDoc | null | undefined): boolean =>
  minuteKeys(stats ?? {}).length > 0;

// ─── MOMENTUM ───────────────────────────────────────────────────────────────

export interface MomentumPoint {
  minute: number;
  /** Hot minus cold expressed that minute, across every player. */
  net: number;
  hot: number;
  cold: number;
  subs: number;
  /** Running total of `net`. The line fans actually recognise as the match. */
  cumulative: number;
}

/**
 * The crowd's feeling about the players, minute by minute.
 *
 * Charted as a RUNNING total, not per-minute net. Per-minute is a hedgehog of
 * spikes at the few moments anyone tapped and flat zero in between, which reads
 * as "nothing happened" for most of the match. A cumulative line has the shape
 * people remember: rising through a good spell, turning over at a goal against.
 */
export const buildMomentumSeries = (
  stats: LiveStatsDoc | null | undefined,
  finalMinute?: number,
): MomentumPoint[] => {
  const doc = stats ?? {};
  const minutes = minuteKeys(doc);
  if (minutes.length === 0) return [];

  const last = Math.max(finalMinute ?? 0, minutes[minutes.length - 1]);
  const series: MomentumPoint[] = [];
  let cumulative = 0;

  // Every minute, not only the ones with votes: gaps in a time axis make the
  // chart lie about when things happened.
  for (let minute = 0; minute <= last; minute += 1) {
    const bucket: Record<string, LivePlayerCounts> = doc[String(minute)] ?? {};
    let hot = 0;
    let cold = 0;
    let subs = 0;

    Object.values(bucket).forEach((counts) => {
      hot += counts?.hot ?? 0;
      cold += counts?.cold ?? 0;
      subs += counts?.sub ?? 0;
    });

    const net = hot - cold;
    cumulative += net;
    series.push({ minute, net, hot, cold, subs, cumulative });
  }

  return series;
};

// ─── THE FANS' XI ───────────────────────────────────────────────────────────

export interface RatedPlayer {
  playerId: string;
  support: number;
  doubt: number;
  net: number;
  tier: HeatTier;
}

/**
 * Who the crowd finished the match rating, and who they had given up on.
 *
 * Reads the final HELD stances (`live`), not the append-only totals: a fan who
 * called someone cold at 20' and hot at 80' had one opinion at full time, and
 * totals would count both.
 */
export const rateSquad = (
  stats: LiveStatsDoc | null | undefined,
): RatedPlayer[] => {
  const doc = stats ?? {};
  const live = doc.live ?? {};
  const engaged = Math.max(Number(doc.voterCount) || 0, 1);

  return Object.entries(live)
    .map(([playerId, counts]) => {
      const support = Math.max(counts?.hot ?? 0, 0);
      const doubt = Math.max(counts?.cold ?? 0, 0);
      const net = support - doubt;
      return {
        playerId,
        support,
        doubt,
        net,
        tier: heatTierOf(net, Math.max(-1, Math.min(1, net / engaged))),
      };
    })
    .filter((p) => p.support + p.doubt > 0)
    .sort((a, b) => b.net - a.net || b.support - a.support);
};

/** The players the crowd rated, best first. Neutral verdicts are left out. */
export const heroesOf = (rated: RatedPlayer[], limit = 5) =>
  rated.filter((p) => HEAT_TIERS[p.tier].direction === "hot").slice(0, limit);

/** The players the crowd turned on, worst first. */
export const villainsOf = (rated: RatedPlayer[], limit = 5) =>
  rated
    .filter((p) => HEAT_TIERS[p.tier].direction === "cold")
    .slice()
    .reverse()
    .slice(0, limit);

// ─── DID THE MANAGER LISTEN? ────────────────────────────────────────────────

export type SubOutcome = "listened" | "ignored";

export interface SubVerdict {
  playerId: string;
  /** First minute the crowd's requests crossed the threshold. */
  demandMinute: number;
  /** Requests over the whole match. */
  totalRequests: number;
  /** Minute the player actually came off, if they did. */
  actualMinute: number | null;
  /** Who actually replaced them. */
  replacementId: string | null;
  /** Who the crowd wanted on instead. */
  crowdChoiceId: string | null;
  /** True when the manager brought on the crowd's own pick. */
  matchedChoice: boolean;
  /** Minutes between the crowd deciding and the change being made. */
  minutesWaited: number | null;
  outcome: SubOutcome;
}

const topSubTarget = (counts: LivePlayerCounts | undefined): string | null => {
  if (!counts) return null;
  let best: string | null = null;
  let bestVotes = 0;
  Object.entries(counts).forEach(([key, value]) => {
    if (!key.startsWith("sub_req_")) return;
    if ((value ?? 0) > bestVotes) {
      bestVotes = value ?? 0;
      best = key.slice("sub_req_".length);
    }
  });
  return best;
};

/**
 * For every player the crowd asked to be taken off, whether it happened.
 *
 * The threshold is the same one the live pitch used — `subThreshold(engaged)` —
 * so a verdict here can never contradict a badge the fans actually saw during
 * the match.
 */
export const buildSubVerdicts = (
  stats: LiveStatsDoc | null | undefined,
  events: any[] = [],
  clubId?: string | number,
): SubVerdict[] => {
  const doc = stats ?? {};
  const totals = doc.totals ?? {};
  const engaged = Math.max(Number(doc.voterCount) || 0, 1);
  const threshold = subThreshold(engaged);
  const minutes = minuteKeys(doc);

  // When the crowd's requests for each player first crossed the line.
  const demandMinute = new Map<string, number>();
  const running = new Map<string, number>();
  minutes.forEach((minute) => {
    const bucket: Record<string, LivePlayerCounts> = doc[String(minute)] ?? {};
    Object.entries(bucket).forEach(([playerId, counts]) => {
      const asked = counts?.sub ?? 0;
      if (asked === 0) return;
      const next = (running.get(playerId) ?? 0) + asked;
      running.set(playerId, next);
      if (next >= threshold && !demandMinute.has(playerId)) {
        demandMinute.set(playerId, minute);
      }
    });
  });

  const subEvents = events.filter(
    (e) =>
      e?.type === "subst" &&
      (clubId == null || Number(e?.team?.id) === Number(clubId)),
  );

  return [...demandMinute.entries()]
    .map(([playerId, minute]) => {
      const event = subEvents.find(
        (e) => String(e?.player?.id) === playerId,
      );
      const actualMinute = event?.time?.elapsed ?? null;
      const replacementId = event?.assist?.id ? String(event.assist.id) : null;
      const crowdChoiceId = topSubTarget(totals[playerId]);

      return {
        playerId,
        demandMinute: minute,
        totalRequests: totals[playerId]?.sub ?? running.get(playerId) ?? 0,
        actualMinute,
        replacementId,
        crowdChoiceId,
        matchedChoice: Boolean(
          replacementId && crowdChoiceId && replacementId === crowdChoiceId,
        ),
        // Negative when the change was already made before the crowd got
        // there, which is worth showing rather than clamping to zero.
        minutesWaited: actualMinute == null ? null : actualMinute - minute,
        outcome: (actualMinute == null ? "ignored" : "listened") as SubOutcome,
      };
    })
    .sort((a, b) => a.demandMinute - b.demandMinute);
};

// ─── THE MOOD ARC ───────────────────────────────────────────────────────────

export interface MoodSwing {
  minute: number;
  from: number;
  to: number;
  delta: number;
  label: string;
}

/** Weighted 0-100 sentiment for one minute's mood bucket. */
const sentimentOf = (bucket: Record<string, number> | undefined) => {
  if (!bucket) return null;
  let score = 0;
  let votes = 0;
  MOODS.forEach((m) => {
    const count = bucket[m.label] || 0;
    score += count * m.weight;
    votes += count;
  });
  return votes > 0 ? { sentiment: score / votes, votes } : null;
};

/**
 * The sharpest turn in the room's mood, and where it landed.
 *
 * Compares consecutive minutes that actually had votes rather than raw
 * neighbours — an empty minute between two busy ones is silence, not a swing
 * back to neutral.
 */
export const biggestMoodSwing = (
  moods: Record<string, Record<string, number>> | null | undefined,
): MoodSwing | null => {
  if (!moods) return null;

  const points = Object.keys(moods)
    .filter((key) => /^\d+$/.test(key))
    .map(Number)
    .sort((a, b) => a - b)
    .map((minute) => ({ minute, ...(sentimentOf(moods[String(minute)]) ?? {}) }))
    .filter((p): p is { minute: number; sentiment: number; votes: number } =>
      typeof (p as any).sentiment === "number",
    );

  if (points.length < 2) return null;

  let best: MoodSwing | null = null;
  for (let i = 1; i < points.length; i += 1) {
    const from = points[i - 1].sentiment;
    const to = points[i].sentiment;
    const delta = to - from;
    if (!best || Math.abs(delta) > Math.abs(best.delta)) {
      best = {
        minute: points[i].minute,
        from,
        to,
        delta,
        label: getStatus(to).label,
      };
    }
  }

  return best;
};

/** Where the room ended up. */
export const finalMood = (
  moods: Record<string, Record<string, number>> | null | undefined,
): { sentiment: number; label: string } | null => {
  if (!moods) return null;
  const minutes = Object.keys(moods)
    .filter((key) => /^\d+$/.test(key))
    .map(Number)
    .sort((a, b) => b - a);

  for (const minute of minutes) {
    const point = sentimentOf(moods[String(minute)]);
    if (point) {
      return { sentiment: point.sentiment, label: getStatus(point.sentiment).label };
    }
  }
  return null;
};
