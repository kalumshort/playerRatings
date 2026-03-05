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
  if (r >= 7.5) return "#A0E8AF"; // Matcha
  if (r >= 4.5) return "#FFD6A5"; // Warning/Apricot
  return "#FFADAD"; // Coral/Error
};
