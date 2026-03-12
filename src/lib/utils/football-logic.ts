/**
 * Shared utility to calculate W/D/L stats from a fixture list.
 * Works on both Server and Client.
 */
export const calculateStats = (fixtures: any[], clubId: string | number) => {
  const teamId = Number(clubId);

  // 1. Filter only finished games
  const played = fixtures.filter((f) =>
    ["FT", "AET", "PEN"].includes(f.fixture.status.short),
  );

  const stats = { w: 0, d: 0, l: 0 };

  played.forEach((game) => {
    const isHome = game.teams.home.id === teamId;
    const homeWin = game.teams.home.winner;
    const awayWin = game.teams.away.winner;

    // Winner === null means a Draw
    if (homeWin === null && awayWin === null) {
      stats.d++;
    } else if ((isHome && homeWin) || (!isHome && awayWin)) {
      stats.w++;
    } else {
      stats.l++;
    }
  });

  return stats;
};

/**
 * Shared utility to process and sort played games with result markers (W/D/L).
 */
export const getPlayed = (fixtures: any[], clubId: string | number) => {
  const teamId = Number(clubId);

  return (
    fixtures
      .filter((f) => ["FT", "AET", "PEN"].includes(f.fixture.status.short))
      .map((game) => {
        const isHome = game.teams.home.id === teamId;
        const homeWin = game.teams.home.winner;
        const awayWin = game.teams.away.winner;

        let result = "D";
        if ((isHome && homeWin) || (!isHome && awayWin)) result = "W";
        else if ((isHome && awayWin) || (!isHome && homeWin)) result = "L";

        return { ...game, result };
      })
      // Sort Oldest -> Newest for the Form Guide timeline
      .sort((a, b) => a.fixture.timestamp - b.fixture.timestamp)
  );
};

export function getInitialSurname(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0]; // single name → show as is

  const firstInitial = parts[0].charAt(0).toUpperCase();
  const surname = parts.slice(1).join(" ");
  return `${firstInitial}. ${surname}`;
}

export const getResultColor = (result, theme) => {
  if (result === "W") return theme.palette.success.main;
  if (result === "D") return theme.palette.warning.main;
  return theme.palette.error.main;
};
export const getRatingColor = (r: number) => {
  // World Class / Elite
  if (r >= 9.0) return "#7AE582"; // Vivid Green
  // Excellent
  if (r >= 8.0) return "#A0E8AF"; // Soft Matcha
  // Good / Solid
  if (r >= 7.0) return "#C4EBC8"; // Light Mint
  // Average
  if (r >= 6.0) return "#FFF2AF"; // Mellow Yellow
  // Below Average
  if (r >= 5.0) return "#FFD6A5"; // Apricot
  // Poor
  if (r >= 4.0) return "#FFADAD"; // Coral
  // Disastrous
  return "#FF8585"; // Deep Red
};

export type MatchStatus = "prematch" | "inplay" | "postmatch" | "cancelled";

/**
 * Returns the match state based on API-Football short status codes.
 * https://www.api-football.com/documentation-v3#operation/get-fixtures
 */
export const getFixtureState = (fixtureData: any): MatchStatus => {
  const status = fixtureData?.fixture?.status?.short;

  switch (status) {
    // --- PRE-MATCH ---
    case "TBD": // Time To Be Defined
    case "NS": // Not Started
      return "prematch";

    // --- IN-PLAY ---
    case "1H": // First Half, Kick Off
    case "HT": // Halftime
    case "2H": // Second Half, 2nd Half Started
    case "ET": // Extra Time
    case "BT": // Break Time (Extra time start)
    case "P": // Penalty In Progress
    case "SUSP": // Match Suspended
    case "INT": // Match Interrupted
    case "LIVE": // In Play (Used when events are not available)
      return "inplay";

    // --- POST-MATCH ---
    case "FT": // Full Time
    case "AET": // After Extra Time
    case "PEN": // After Penalties
      return "postmatch";

    // --- CANCELLED / ABNORMAL ---
    case "PST": // Match Postponed
    case "CANC": // Match Cancelled
    case "ABD": // Match Abandoned
    case "AWD": // Technical Loss (Awarded)
    case "WO": // WalkOver
      return "cancelled";

    default:
      return "prematch";
  }
};
export const isLive = (fixture: any) => getFixtureState(fixture) === "inplay";
export const isFinished = (fixture: any) =>
  getFixtureState(fixture) === "postmatch";
export const isPostponed = (fixture: any) =>
  fixture?.fixture?.status?.short === "PST";
