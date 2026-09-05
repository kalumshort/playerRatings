/**
 * What the app can show for each competition.
 *
 * A client-safe mirror of the capability flags on TRACKED_LEAGUES in
 * functions/leagueCatalogue.js. The functions codebase is CommonJS and this one
 * is ESM, so neither can import the other — the same reason CURRENT_SEASON is
 * duplicated in src/lib/config/season.ts and functions/helperFunctions.js.
 *
 * Keep the ids in step with that file. This side only needs to know what to
 * render; the ingestion side owns the country, the expected name and the
 * allowlist that stops a bad id reaching the API.
 */

export interface CompetitionConfig {
  id: number;
  name: string;
  /** A standings table exists for this competition. */
  table: boolean;
  /** A knockout bracket exists for this competition. */
  bracket: boolean;
}

export const COMPETITIONS: readonly CompetitionConfig[] = [
  // England, top four tiers
  { id: 39, name: "Premier League", table: true, bracket: false },
  { id: 40, name: "Championship", table: true, bracket: false },
  { id: 41, name: "League One", table: true, bracket: false },
  { id: 42, name: "League Two", table: true, bracket: false },

  // Domestic cups
  { id: 45, name: "FA Cup", table: false, bracket: true },
  { id: 48, name: "League Cup", table: false, bracket: true },

  // Europe — a league phase table AND a knockout bracket
  { id: 2, name: "UEFA Champions League", table: true, bracket: true },
  { id: 3, name: "UEFA Europa League", table: true, bracket: true },
  { id: 848, name: "UEFA Europa Conference League", table: true, bracket: true },

  // Major leagues worldwide
  { id: 140, name: "La Liga", table: true, bracket: false },
  { id: 135, name: "Serie A", table: true, bracket: false },
  { id: 78, name: "Bundesliga", table: true, bracket: false },
  { id: 61, name: "Ligue 1", table: true, bracket: false },
  { id: 88, name: "Eredivisie", table: true, bracket: false },
  { id: 94, name: "Primeira Liga", table: true, bracket: false },
  { id: 71, name: "Serie A (Brazil)", table: true, bracket: false },
  { id: 128, name: "Liga Profesional Argentina", table: true, bracket: false },
  { id: 253, name: "Major League Soccer", table: true, bracket: false },
  { id: 307, name: "Pro League", table: true, bracket: false },
] as const;

const BY_ID = new Map(COMPETITIONS.map((c) => [c.id, c]));

/**
 * The config for a competition, or undefined when it isn't one we cover.
 *
 * A club's fixtures include competitions outside this list — pre-season
 * friendlies, the Community Shield — so callers must handle the miss rather
 * than assume every fixture's league is here.
 */
export const competitionById = (
  leagueId: number | null | undefined,
): CompetitionConfig | undefined =>
  leagueId == null ? undefined : BY_ID.get(Number(leagueId));

/** Whether a standings table exists for this competition. */
export const hasTable = (leagueId: number | null | undefined): boolean =>
  competitionById(leagueId)?.table === true;

/** Whether a knockout bracket exists for this competition. */
export const hasBracket = (leagueId: number | null | undefined): boolean =>
  competitionById(leagueId)?.bracket === true;

/**
 * Validates a `?league=` parameter against a set the caller already trusts.
 *
 * The allowed ids come from the club's own fixtures, so a URL can only ever
 * address a competition that club actually played in — the same discipline
 * resolveSeason applies before a season reaches a Firestore path.
 */
export const resolveCompetition = (
  input: string | string[] | undefined,
  allowed: Array<number | null>,
  fallback: number | null = null,
): number | null => {
  const raw = Array.isArray(input) ? input[0] : input;
  const asNumber = Number(raw);

  if (Number.isInteger(asNumber) && allowed.includes(asNumber)) {
    return asNumber;
  }

  return fallback;
};
