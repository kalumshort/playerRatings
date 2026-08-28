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
/**
 * The rating ramp. Tuned against the dark card (#1F1F25), where it sits between
 * 7:1 and 14.5:1 and reads perfectly.
 */
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

// Near-black, matching the light palette's textPrimary rather than pure #000 so
// the outline sits in the same family as the rest of the type.
const RATING_STROKE = "#18181B";

/**
 * sx for a rating rendered as TEXT, keeping the pastel fill.
 *
 * The ramp was never checked against a light surface, and as text on white
 * every band fails badly on its own:
 *
 *     9.0+ 1.57:1   8.0 1.43:1   7.0 1.31:1   6.0 1.13:1
 *     5.0  1.36:1   4.0 1.77:1   <4  2.35:1
 *
 * 6.0 is the rating input's default value, so the first number a light-mode
 * voter ever saw was drawn at 1.13:1.
 *
 * Rather than darken the palette, light mode outlines the glyph in near-black,
 * so the letterform is carried by a 16:1 edge while the fill keeps saying which
 * band the rating is in. `paint-order: stroke fill` puts the stroke BEHIND the
 * fill so it hugs the outside of the glyph instead of eating into it; where
 * that's unsupported the stroke centres on the edge, which still reads at these
 * weights (everything using this is >= 700).
 *
 * Dark mode gets no stroke — the pastels already clear 6:1 there, and a
 * near-black outline on a near-black card would only erode the glyph.
 *
 * Note this is a legibility fix, not a WCAG-conformant one: the contrast
 * algorithm only ever compares fill to background, and has no notion of an
 * outline.
 *
 * Scale `strokeWidth` with the type: 1px suits the 2-3rem card numbers, 0.6px
 * the ~1.35rem chips. Going heavier at chip size starts closing up the counters
 * in 6 and 8 on the paler bands.
 */
export const getRatingTextSx = (
  r: number,
  mode: "light" | "dark",
  strokeWidth = "1px",
) => ({
  color: getRatingColor(r),
  ...(mode === "light"
    ? {
        WebkitTextStrokeWidth: strokeWidth,
        WebkitTextStrokeColor: RATING_STROKE,
        paintOrder: "stroke fill",
      }
    : {}),
});

/**
 * sx for a rating rendered as a filled CHIP rather than as coloured text.
 *
 * The pastel-on-surface form above needs an outline to be legible in light
 * mode, and an outlined glyph is the wrong tool inside a share PNG: html2canvas
 * strokes text with a lineWidth taken straight from the CSS px value, so the
 * ramp's palest bands come out as hollow letterforms in the exported image.
 *
 * Inverting it — pastel as the fill, near-black as the ink — is one appearance
 * in both modes and rasterises as a solid rect plus solid text, which every
 * renderer agrees on. Contrast is 12:1 or better across the whole ramp, since
 * every band was tuned to read against #1F1F25 to begin with.
 */
export const getRatingChipSx = (r: number) => ({
  backgroundColor: getRatingColor(r),
  color: RATING_STROKE,
});

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
