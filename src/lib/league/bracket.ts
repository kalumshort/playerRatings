/**
 * The shape of a stored cup bracket.
 *
 * Mirrors what functions/bracket.js writes. No Firebase import and no
 * `server-only`, so a client component can hold these types.
 */

export interface TieLeg {
  fixtureId: string;
  timestamp: number;
  status: string;
  homeTeamId: string;
  awayTeamId: string;
  goals: { home: number | null; away: number | null };
  /** Present only on a leg decided by a shootout. */
  penalty: { home: number | null; away: number | null } | null;
  winnerTeamId: string | null;
}

export interface TieSide {
  teamId: string;
  name: string | null;
  logo: string;
}

export interface Tie {
  tieId: string;
  /** The display frame: the first leg's home and away sides. */
  home: TieSide;
  away: TieSide;
  legs: TieLeg[];
  /** In the display frame, mapped by team id — never by home/away slot. */
  aggregate: { home: number; away: number } | null;
  winnerTeamId: string | null;
  decidedBy:
    | "normal"
    | "extra-time"
    | "penalties"
    | "aggregate"
    | "replay"
    | null;
  state: "scheduled" | "live" | "complete";
  anomaly: "replay" | "extra-legs" | null;
}

export interface BracketRound {
  key: string;
  label: string;
  order: number;
  legs: number;
  /** False when the competition reaches this round but has not drawn it yet. */
  drawn: boolean;
  ties: Tie[];
}

export interface CupBracket {
  leagueId: string;
  season: string;
  name: string;
  rounds: BracketRound[];
  /** Rounds the ladder could not classify. Surfaced, never silently dropped. */
  unmatched: Array<{ fixtureId: string; round: string | null }>;
  fixtureCount: number;
}

/** Whether a club appears anywhere in a tie. */
export const tieInvolves = (tie: Tie, clubId: string): boolean =>
  tie.home.teamId === clubId || tie.away.teamId === clubId;

/**
 * The furthest round a club reached, and whether they went out there.
 *
 * Used to open the page on the round that actually concerns this club rather
 * than at the start of a draw they left in September.
 */
export const clubProgress = (
  bracket: CupBracket,
  clubId: string,
): { lastRoundKey: string | null; exited: boolean; won: boolean } => {
  let lastRoundKey: string | null = null;
  let exited = false;
  let won = false;

  for (const round of bracket.rounds) {
    const tie = round.ties.find((candidate) => tieInvolves(candidate, clubId));
    if (!tie) continue;

    lastRoundKey = round.key;
    // Only a completed tie settles anything; a live one is still open.
    if (tie.state === "complete" && tie.winnerTeamId) {
      const advanced = tie.winnerTeamId === clubId;
      exited = !advanced;
      won = advanced && round.key === "final";
    } else {
      exited = false;
      won = false;
    }
  }

  return { lastRoundKey, exited, won };
};

/** How a tie was settled, in words, for the line under the score. */
export const decidedLabel = (tie: Tie): string | null => {
  switch (tie.decidedBy) {
    case "penalties": {
      const leg = [...tie.legs].reverse().find((l) => l.penalty);
      const pens = leg?.penalty;
      return pens && pens.home != null
        ? `Won on penalties (${pens.home}–${pens.away})`
        : "Won on penalties";
    }
    case "extra-time":
      return "After extra time";
    case "aggregate":
      return tie.aggregate
        ? `${tie.aggregate.home}–${tie.aggregate.away} on aggregate`
        : "On aggregate";
    case "replay":
      return "Decided by a replay";
    default:
      return null;
  }
};
