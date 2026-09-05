/**
 * The shape of a stored league table, and the rules for reading one.
 *
 * Deliberately free of `server-only` and of any Firebase import, so the same
 * module works on the server and in the browser — the live table is computed
 * on both sides. Same discipline as src/lib/utils/football-logic.ts.
 */

/** A club's record over some subset of its matches. */
export interface StandingSplit {
  played: number;
  win: number;
  draw: number;
  lose: number;
  goals: { for: number; against: number };
}

export interface StandingRow {
  rank: number | null;
  teamId: string;
  teamName: string;
  teamLogo: string;
  points: number;
  /**
   * Points held beyond what the results earned — a deduction is negative.
   *
   * Not derivable from fixtures at any price, which is why the official table
   * is stored rather than computed. Render it, never explain it: the API gives
   * no reason and guessing one is a liability.
   */
  pointsAdjustment: number;
  goalsDiff: number;
  form: string | null;
  status: string | null;
  /** "Promotion - Champions League (Group Stage)", "Relegation", … */
  description: string | null;
  all: StandingSplit;
  home: StandingSplit;
  away: StandingSplit;
  update: string | null;
}

export interface StandingGroup {
  name: string;
  rows: StandingRow[];
}

export interface LeagueStandings {
  leagueId: string;
  season: string;
  name: string;
  logo: string;
  country: string;
  flag: string | null;
  /**
   * One entry for a domestic league or a UEFA league phase; several for a
   * group stage. Never flattened — eight groups flattened is eight teams all
   * ranked first.
   */
  groups: StandingGroup[];
  teamIds: string[];
  teamCount: number;
  /** ISO string. When the API last recomputed this table. */
  fetchedAt: string | null;
}

/** Statuses where a result is final and counted by the provider. */
export const DECIDED_STATUSES = ["FT", "AET", "PEN"];

/** Statuses where the match is under way. */
export const IN_PLAY_STATUSES = [
  "1H",
  "HT",
  "2H",
  "ET",
  "BT",
  "P",
  "LIVE",
  "SUSP",
  "INT",
];

/** A zone stripe for a table row, matched loosely from the API's free text. */
export type StandingZone =
  | "champions-league"
  | "europa-league"
  | "conference-league"
  | "promotion"
  | "play-off"
  | "relegation"
  | null;

/**
 * Classifies a row's `description` into a zone.
 *
 * Matched loosely and never by position: the number of European places and the
 * size of the relegation zone change per season and per competition, and an
 * unrecognised description has to fall through to no stripe rather than throw.
 */
export const zoneOf = (description: string | null): StandingZone => {
  if (!description) return null;
  const text = description.toLowerCase();

  if (/relegation/.test(text)) return "relegation";
  if (/play-?off/.test(text)) return "play-off";
  if (/champions league/.test(text)) return "champions-league";
  if (/europa league/.test(text)) return "europa-league";
  if (/conference league/.test(text)) return "conference-league";
  if (/promotion/.test(text)) return "promotion";

  return null;
};

/** Goal difference from a split, for when the stored value is absent. */
export const diffOf = (split: StandingSplit): number =>
  split.goals.for - split.goals.against;
