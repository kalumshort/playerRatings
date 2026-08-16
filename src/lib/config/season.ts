// Single source of truth for the season the app reads by default.
//
// NOTE: functions/helperFunctions.js keeps its own SEASON constant — `src/` and
// `functions/` are separate packages (ESM vs CJS) and cannot import each other.
// Update both at rollover.
export const CURRENT_SEASON = "2026";

// Seasons with data in Firestore, newest first. Add the new year here at rollover.
export const SELECTABLE_SEASONS = ["2026", "2025"] as const;

/** Allowlist-validate an untrusted season value, falling back to the current one. */
export function resolveSeason(input?: string | string[] | null): string {
  const value = Array.isArray(input) ? input[0] : input;

  return value && (SELECTABLE_SEASONS as readonly string[]).includes(value)
    ? value
    : CURRENT_SEASON;
}

export const isArchivedSeason = (season: string) => season !== CURRENT_SEASON;

/** "2026" -> "2026/27" */
export const formatSeason = (season: string) =>
  `${season}/${String(Number(season) + 1).slice(-2)}`;

/** Appends `?season=` only for archived seasons, keeping current-season URLs canonical. */
export const withSeasonParam = (path: string, season: string) =>
  isArchivedSeason(season) ? `${path}?season=${season}` : path;
