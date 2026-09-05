/**
 * Turns the official table into the one a fan sees while matches are on.
 *
 * API-Football's standings endpoint only ever reflects finished matches, and
 * lags them by an unbounded amount. So the live table is not fetched — it is
 * computed here, by applying the matches we can see over the official base.
 *
 * No `server-only`, no Firebase import: this runs on the server for the first
 * paint and in the browser for every subsequent score. Same discipline as
 * src/lib/utils/football-logic.ts.
 */
// Type-only, and deliberately so: this module is exercised by a plain-node
// test through type stripping, which erases type imports but would have to
// resolve a runtime one — and Node's resolver wants a file extension that
// the app's own bundler-style resolution does not use.
import type {
  LeagueStandings,
  StandingRow,
  StandingSplit,
} from "./standings";

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

/** The only parts of a fixture the overlay needs. */
export interface TableFixture {
  fixtureId: string;
  timestamp: number;
  /** The NESTED status. The flat copy is only refreshed by the nightly job. */
  status: string;
  /** Minutes played, from the nested status. Null before kick-off. */
  elapsed: number | null;
  homeTeamId: string;
  awayTeamId: string;
  homeName: string | null;
  awayName: string | null;
  goals: { home: number | null; away: number | null };
}

/** The match a club is playing right now, from that club's point of view. */
export interface LiveMatch {
  fixtureId: string;
  opponentId: string;
  opponentName: string | null;
  isHome: boolean;
  scored: number;
  conceded: number;
  elapsed: number | null;
  status: string;
}

export interface LiveStandingRow extends StandingRow {
  /** Where this row sat in the official table. */
  baseRank: number | null;
  /** Positions gained (positive) or lost since the official table. */
  rankDelta: number;
  /** True when this row's numbers or position moved. */
  provisional: boolean;
  /**
   * The qualification zone for the position this row now occupies.
   *
   * Read from the position, never from the club. The API attaches its
   * description to a club, so carrying it through a re-rank would drag the
   * Champions League stripe down with a club that has just dropped out of the
   * top four and leave it off the club that replaced them.
   */
  zone: StandingZone;
  /** Set only while this club is playing. */
  liveMatch: LiveMatch | null;
}

export interface LiveTable {
  groups: Array<{ name: string; rows: LiveStandingRow[] }>;
  /** Fixtures folded into the table. */
  appliedFixtureIds: string[];
  /** How many of those are still being played. */
  inPlayCount: number;
  /**
   * "clean"   — every fixture was unambiguous.
   * "partial" — at least one finished fixture looked counted for one club and
   *             not the other, so it was left out rather than half-applied.
   */
  reconciliation: "clean" | "partial";
  /** True when anything at all was applied. */
  isLive: boolean;
}

/**
 * Reads a stored fixture document into the shape the overlay wants.
 *
 * Takes the nested status and goals deliberately: a fixture document carries
 * both a flat `status` refreshed nightly and a nested `fixture.status.short`
 * refreshed by the live poller, and mid-afternoon the flat one still says NS.
 */
export const toTableFixture = (doc: any): TableFixture | null => {
  const homeTeamId = doc?.teams?.home?.id;
  const awayTeamId = doc?.teams?.away?.id;
  const fixtureId = doc?.fixture?.id ?? doc?.matchId;

  if (!homeTeamId || !awayTeamId || !fixtureId) return null;

  return {
    fixtureId: String(fixtureId),
    timestamp: doc?.fixture?.timestamp ?? doc?.timestamp ?? 0,
    status: doc?.fixture?.status?.short ?? doc?.status ?? "NS",
    elapsed: doc?.fixture?.status?.elapsed ?? null,
    homeTeamId: String(homeTeamId),
    awayTeamId: String(awayTeamId),
    homeName: doc?.teams?.home?.name ?? null,
    awayName: doc?.teams?.away?.name ?? null,
    goals: {
      home: doc?.goals?.home ?? null,
      away: doc?.goals?.away ?? null,
    },
  };
};

const cloneSplit = (split: StandingSplit): StandingSplit => ({
  played: split.played,
  win: split.win,
  draw: split.draw,
  lose: split.lose,
  goals: { for: split.goals.for, against: split.goals.against },
});

export const cloneRow = (row: StandingRow): LiveStandingRow => ({
  ...row,
  all: cloneSplit(row.all),
  home: cloneSplit(row.home),
  away: cloneSplit(row.away),
  baseRank: row.rank,
  rankDelta: 0,
  provisional: false,
  zone: zoneOf(row.description),
  liveMatch: null,
});

/**
 * Folds one result into one split.
 * @param split The split to mutate.
 * @param scored Goals this club scored.
 * @param conceded Goals this club conceded.
 */
const addResult = (split: StandingSplit, scored: number, conceded: number) => {
  split.played += 1;
  split.goals.for += scored;
  split.goals.against += conceded;
  if (scored > conceded) split.win += 1;
  else if (scored === conceded) split.draw += 1;
  else split.lose += 1;
};

const pointsFor = (scored: number, conceded: number) =>
  scored > conceded ? 3 : scored === conceded ? 1 : 0;

/**
 * Which of a club's finished fixtures the official table has not counted yet.
 *
 * Keyed off the provider's own `played` count rather than a timestamp. A
 * timestamp rule is wrong in both directions: the API's lag is unbounded, so a
 * 15:00 result can still be missing from a table fetched at 15:30, and clock
 * skew the other way double-counts.
 *
 * Clamped at zero, which is what makes every failure mode degrade to "render
 * the official table" rather than to a wrong one — if our own fixture ingest
 * is behind the API, this goes negative and we apply nothing.
 */
const pendingByTeam = (
  rows: StandingRow[],
  decidedByTeam: Map<string, TableFixture[]>,
): Map<string, number> => {
  const pending = new Map<string, number>();

  for (const row of rows) {
    const observed = decidedByTeam.get(row.teamId)?.length ?? 0;
    const counted = row.all.played;
    pending.set(row.teamId, Math.max(0, Math.min(observed - counted, observed)));
  }

  return pending;
};

/**
 * Applies the matches we can see over an official table.
 *
 * @param standings The official table, as stored.
 * @param fixtures This competition's fixtures from our own collection.
 * @returns The provisional table, with every row marked for what moved.
 */
export const buildLiveTable = (
  standings: LeagueStandings,
  fixtures: TableFixture[],
): LiveTable => {
  const appliedFixtureIds: string[] = [];
  let inPlayCount = 0;
  let reconciliation: "clean" | "partial" = "clean";

  const groups = standings.groups.map((group) => ({
    name: group.name,
    rows: group.rows.map(cloneRow),
    // Which zone belongs to which position, captured from the official table
    // before anything moves. Zones are a property of the position — 4th is a
    // Champions League place whoever is standing in it — but the API hangs
    // its description off the club, so this has to be pinned now or the
    // stripe travels with the club through the re-rank.
    //
    // Per group, because a group stage's qualification places are per group.
    zoneByRank: new Map<number, StandingZone>(
      group.rows
        .filter((row) => row.rank != null)
        .map((row) => [row.rank as number, zoneOf(row.description)]),
    ),
  }));

  // A club appears in exactly one group, so one lookup spans the competition.
  const rowByTeam = new Map<string, LiveStandingRow>();
  for (const group of groups) {
    for (const row of group.rows) rowByTeam.set(row.teamId, row);
  }

  // Only fixtures between two clubs that are actually in this table. A cup
  // tie against outside opposition would otherwise credit goals to a league
  // record it has no business touching.
  const relevant = fixtures.filter(
    (fixture) =>
      rowByTeam.has(fixture.homeTeamId) && rowByTeam.has(fixture.awayTeamId),
  );

  // Newest first, so "the fixtures the provider hasn't got to yet" is a prefix.
  const decidedByTeam = new Map<string, TableFixture[]>();
  for (const fixture of relevant) {
    if (!DECIDED_STATUSES.includes(fixture.status)) continue;
    for (const teamId of [fixture.homeTeamId, fixture.awayTeamId]) {
      const list = decidedByTeam.get(teamId) ?? [];
      list.push(fixture);
      decidedByTeam.set(teamId, list);
    }
  }
  for (const list of decidedByTeam.values()) {
    list.sort((a, b) => b.timestamp - a.timestamp);
  }

  const allRows = groups.flatMap((group) => group.rows);
  const pending = pendingByTeam(allRows, decidedByTeam);

  for (const fixture of relevant) {
    const isInPlay = IN_PLAY_STATUSES.includes(fixture.status);
    const isDecided = DECIDED_STATUSES.includes(fixture.status);

    // Postponed, cancelled, abandoned, awarded, walkover: never applied.
    if (!isInPlay && !isDecided) continue;

    if (isDecided) {
      const rankFor = (teamId: string) =>
        decidedByTeam.get(teamId)?.findIndex(
          (candidate) => candidate.fixtureId === fixture.fixtureId,
        ) ?? -1;

      const homeUncounted = rankFor(fixture.homeTeamId) < (pending.get(fixture.homeTeamId) ?? 0);
      const awayUncounted = rankFor(fixture.awayTeamId) < (pending.get(fixture.awayTeamId) ?? 0);

      if (!homeUncounted && !awayUncounted) continue;

      // Counted for one club but not the other. Applying it would break the
      // side that already has it, so it is left out and the table says so.
      if (homeUncounted !== awayUncounted) {
        reconciliation = "partial";
        continue;
      }
    }

    const home = rowByTeam.get(fixture.homeTeamId)!;
    const away = rowByTeam.get(fixture.awayTeamId)!;
    // A match that has kicked off but not scored is 0-0, not unknown.
    const homeGoals = fixture.goals.home ?? 0;
    const awayGoals = fixture.goals.away ?? 0;

    addResult(home.all, homeGoals, awayGoals);
    addResult(home.home, homeGoals, awayGoals);
    home.points += pointsFor(homeGoals, awayGoals);
    home.goalsDiff = home.all.goals.for - home.all.goals.against;
    home.provisional = true;

    addResult(away.all, awayGoals, homeGoals);
    addResult(away.away, awayGoals, homeGoals);
    away.points += pointsFor(awayGoals, homeGoals);
    away.goalsDiff = away.all.goals.for - away.all.goals.against;
    away.provisional = true;

    // Only a match still being played is worth putting on the row. A finished
    // one the provider hasn't absorbed is already reflected in the numbers,
    // and showing it would read as though it were still going.
    if (isInPlay) {
      home.liveMatch = {
        fixtureId: fixture.fixtureId,
        opponentId: away.teamId,
        opponentName: fixture.awayName ?? away.teamName,
        isHome: true,
        scored: homeGoals,
        conceded: awayGoals,
        elapsed: fixture.elapsed,
        status: fixture.status,
      };
      away.liveMatch = {
        fixtureId: fixture.fixtureId,
        opponentId: home.teamId,
        opponentName: fixture.homeName ?? home.teamName,
        isHome: false,
        scored: awayGoals,
        conceded: homeGoals,
        elapsed: fixture.elapsed,
        status: fixture.status,
      };
    }

    appliedFixtureIds.push(fixture.fixtureId);
    if (isInPlay) inPlayCount += 1;
  }

  // Nothing moved: hand back the official table in its own order, untouched.
  // Re-sorting here could only ever invent a disagreement with the real table.
  if (appliedFixtureIds.length === 0) {
    return {
      groups: groups.map(({ name, rows }) => ({ name, rows })),
      appliedFixtureIds,
      inPlayCount,
      reconciliation,
      isLive: false,
    };
  }

  for (const group of groups) {
    rerank(group.rows);

    // Zones follow the position, so they are reassigned from the map pinned
    // before the re-rank rather than carried along by the club.
    for (const row of group.rows) {
      row.zone = row.rank == null ? null : (group.zoneByRank.get(row.rank) ?? null);
    }
  }

  return {
    groups: groups.map(({ name, rows }) => ({ name, rows })),
    appliedFixtureIds,
    inPlayCount,
    reconciliation,
    isLive: true,
  };
};

/**
 * Re-orders a group and records what moved.
 *
 * Points, then goal difference, then goals scored — and a stable sort, so
 * clubs the tiebreak cannot separate keep the order the official table had
 * them in. Head-to-head is deliberately not implemented: no English
 * competition uses it, and we lack the data to do it honestly.
 */
const rerank = (rows: LiveStandingRow[]) => {
  rows.sort(
    (a, b) =>
      b.points - a.points ||
      b.goalsDiff - a.goalsDiff ||
      b.all.goals.for - a.all.goals.for,
  );

  rows.forEach((row, index) => {
    const rank = index + 1;
    row.rankDelta = row.baseRank == null ? 0 : row.baseRank - rank;
    row.rank = rank;
    if (row.rankDelta !== 0) row.provisional = true;
  });
};
