// Single source of truth for the season the app reads by default.
//
// NOTE: functions/helperFunctions.js keeps its own SEASON constant — `src/` and
// `functions/` are separate packages (ESM vs CJS) and cannot import each other.
// Update both at rollover.
export const CURRENT_SEASON = "2026";

// Seasons with data in Firestore, newest first. Add the new year here at rollover.
export const SELECTABLE_SEASONS = ["2026", "2025"] as const;

const isSelectable = (value?: string | null): value is string =>
  !!value && (SELECTABLE_SEASONS as readonly string[]).includes(value);

/**
 * Allowlist-validate an untrusted season value.
 *
 * @param input - The requested season, typically `?season=`.
 * @param fallback - Season to use when `input` is absent or invalid. Archived
 *   clubs pass their `lastActiveSeason` here so their pages land on the last
 *   season that actually has data instead of an empty current season. It is
 *   allowlisted exactly like `input`, so a stale value can never reach a
 *   Firestore path.
 */
export function resolveSeason(
  input?: string | string[] | null,
  fallback?: string | null,
): string {
  const value = Array.isArray(input) ? input[0] : input;

  if (isSelectable(value)) return value;
  if (isSelectable(fallback)) return fallback;

  return CURRENT_SEASON;
}

export const isArchivedSeason = (season: string) => season !== CURRENT_SEASON;

/**
 * The season an archived club's pages should default to — the last one it was
 * in the league, which is the last one with any data. Returns null for active
 * clubs so `resolveSeason` falls through to CURRENT_SEASON as usual.
 */
export const archivedClubSeason = (
  group?: { status?: string; lastActiveSeason?: string | null } | null,
) => (group?.status === "archived" ? (group.lastActiveSeason ?? null) : null);

/** "2026" -> "2026/27" */
export const formatSeason = (season: string) =>
  `${season}/${String(Number(season) + 1).slice(-2)}`;

/** Appends `?season=` only for archived seasons, keeping current-season URLs canonical. */
export const withSeasonParam = (path: string, season: string) =>
  isArchivedSeason(season) ? `${path}?season=${season}` : path;
