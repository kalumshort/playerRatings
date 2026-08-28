import { Fixture } from "@/types/football";
import { getFixtureState, MatchStatus } from "@/lib/utils/football-logic";

export type ClubSide = "H" | "A";
export type MatchResult = "W" | "D" | "L";

/**
 * The id everything else keys on.
 *
 * Fixtures carry two: the Firestore doc id (`fixture.id`, injected by
 * getFixturesByClubServer / the fetchFixtures thunk) and the API-Football id
 * (`fixture.fixture.id`). They're the same value today — the doc key IS the
 * API id — but the two were used inconsistently: routing went through
 * `fixture.fixture.id` while the user's per-match data is keyed by
 * `String(fixture.id)`. Route every lookup through here so they can't drift.
 */
export const getMatchId = (fixture: Fixture): string =>
  String(fixture.id ?? fixture.fixture.id);

export const getFixtureStatus = (fixture: Fixture): MatchStatus =>
  getFixtureState(fixture);

/** Which side of the tie the club is on. Null if it isn't in this fixture. */
export function getClubSide(
  fixture: Fixture,
  clubId: number,
): ClubSide | null {
  if (fixture.teams.home.id === clubId) return "H";
  if (fixture.teams.away.id === clubId) return "A";
  return null;
}

export function getOpponent(fixture: Fixture, clubId: number) {
  return fixture.teams.home.id === clubId
    ? fixture.teams.away
    : fixture.teams.home;
}

/**
 * W/D/L from the club's perspective. Only meaningful once the match is over —
 * returns null otherwise, so a postponed or in-play fixture can't render a
 * result badge.
 */
export function getResult(
  fixture: Fixture,
  clubId: number,
): MatchResult | null {
  if (getFixtureState(fixture) !== "postmatch") return null;

  const homeWin = fixture.teams.home.winner;
  const awayWin = fixture.teams.away.winner;

  // The API uses winner: null on BOTH sides to mean a draw.
  if (homeWin === null && awayWin === null) return "D";

  const isHome = fixture.teams.home.id === clubId;
  return (isHome && homeWin) || (!isHome && awayWin) ? "W" : "L";
}

/**
 * The trailing context line: "Premier League · Matchweek 3 · Old Trafford".
 * Every part is optional in the data, so build it from what's actually there.
 */
export function getFixtureContext(fixture: Fixture): string {
  return [formatRound(fixture.league?.round), fixture.fixture.venue?.name]
    .filter(Boolean)
    .join(" · ");
}

/** API rounds arrive as "Regular Season - 3". */
function formatRound(round?: string): string | null {
  if (!round) return null;
  const regularSeason = round.match(/^Regular Season\s*-\s*(\d+)$/i);
  return regularSeason ? `Matchweek ${regularSeason[1]}` : round;
}
