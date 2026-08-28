import { XP, XP_CAPS } from "./xpConfig";

/**
 * Fan XP earned from one match — the display-side mirror.
 *
 * NOTE: functions/gamification/computeMatchXp.js is the authoritative copy.
 * That one decides what a fan is actually paid; this one only decides what the
 * card shows. `src/` and `functions/` are separate packages and cannot import
 * each other, the same split `CURRENT_SEASON` and the XP constants already
 * live with. Change one, change the other — a drift here is a card that
 * disagrees with the leaderboard.
 *
 * Kept thin and constant-driven precisely to make drift unlikely: every value
 * comes from xpConfig, so retuning the economy touches only that file.
 *
 * Mirrored deliberately rather than persisted server-side, so the card updates
 * live as a fan rates players instead of waiting on a trigger round-trip.
 */

/** One earnable line on the card, whether or not it has been earned. */
export interface XpLine {
  key: string;
  /** What the fan did, or could do. */
  label: string;
  /** XP earned so far from this line. */
  earned: number;
  /** The most this line can give in one match. */
  available: number;
}

export interface MatchXpResult {
  xp: number;
  lines: XpLine[];
  /** Which of the five feature areas were touched. */
  areas: string[];
  /** True once all five areas are covered. */
  fullNinety: boolean;
}

/** Clamp to a non-negative integer, capped. Mirrors the server's `count`. */
const count = (value: unknown, cap: number): number => {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(n, cap);
};

/**
 * Builds the full earnable list for a match, marking what has been earned.
 *
 * Always returns every line, including the untouched ones — a card that shows
 * only what you earned tells a fan who did nothing that they got nothing,
 * which is exactly the fan the card exists to reach.
 *
 * @param doc The per-user match document, or undefined when they took no part.
 */
export function computeMatchXp(doc: any): MatchXpResult {
  const d = doc && typeof doc === "object" ? doc : {};
  const areas = new Set<string>();

  const line = (
    key: string,
    label: string,
    earned: number,
    available: number,
    area?: string,
  ): XpLine => {
    if (earned > 0 && area) areas.add(area);
    return { key, label, earned, available };
  };

  const ratedPlayers =
    d.players && typeof d.players === "object"
      ? count(Object.keys(d.players).length, XP_CAPS.ratedPlayers)
      : 0;

  const moodTaps = count(d.moodTaps, XP_CAPS.moodTaps);
  const liveVotes = count(d.liveVotes, XP_CAPS.liveVotes);
  const reactions = count(d.reactions, XP_CAPS.eventReactions);

  const lines: XpLine[] = [
    line("predictWinner", "Predict the winner", d.result ? XP.predictWinner : 0, XP.predictWinner, "predictions"),
    line("predictScore", "Predict the scoreline", d.ScorePrediction ? XP.predictScore : 0, XP.predictScore, "predictions"),
    line("predictPlayerToWatch", "Pick a player to watch", d.preMatchMotm ? XP.predictPlayerToWatch : 0, XP.predictPlayerToWatch, "predictions"),
    line("submitLineup", "Build your XI", d.teamSubmitted === true ? XP.submitLineup : 0, XP.submitLineup, "lineup"),
    line("ratePlayer", `Rate players (${ratedPlayers}/${XP_CAPS.ratedPlayers})`, ratedPlayers * XP.ratePlayer, XP_CAPS.ratedPlayers * XP.ratePlayer, "ratings"),
    line("submitAllRatings", "Submit all ratings", d.ratingsSubmitted === true ? XP.submitAllRatings : 0, XP.submitAllRatings, "ratings"),
    line("motmVote", "Vote Man of the Match", d.motmVote ? XP.motmVote : 0, XP.motmVote, "ratings"),
    line("moodTap", `Tap the vibe check (${moodTaps}/${XP_CAPS.moodTaps})`, moodTaps * XP.moodTap, XP_CAPS.moodTaps * XP.moodTap, "live"),
    line("liveVote", `Call players hot or cold (${liveVotes}/${XP_CAPS.liveVotes})`, liveVotes * XP.liveVote, XP_CAPS.liveVotes * XP.liveVote, "live"),
    line("eventReaction", `React to events (${reactions}/${XP_CAPS.eventReactions})`, reactions * XP.eventReaction, XP_CAPS.eventReactions * XP.eventReaction, "reactions"),
  ];

  const fullNinety = areas.size === 5;

  lines.push({
    key: "fullNinety",
    label: "Full 90 — use all five features",
    earned: fullNinety ? XP.fullNinety : 0,
    available: XP.fullNinety,
  });

  return {
    xp: lines.reduce((sum, l) => sum + l.earned, 0),
    lines,
    areas: [...areas],
    fullNinety,
  };
}
