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

/**
 * Match statuses and zone classification live in ./liveTable, next to the code
 * that branches on them — the overlay has to assign zones by position as it
 * re-ranks, and it cannot import this module at runtime. Re-exported here so
 * this stays the one import a caller needs.
 */
export {
  DECIDED_STATUSES,
  IN_PLAY_STATUSES,
  zoneOf,
  type StandingZone,
} from "./liveTable";

/** Goal difference from a split, for when the stored value is absent. */
export const diffOf = (split: StandingSplit): number =>
  split.goals.for - split.goals.against;
