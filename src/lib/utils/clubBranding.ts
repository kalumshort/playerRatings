// Club accent colours, keyed by API-Football team id.
//
// This is all that remains of the old hardcoded teamList: the list of clubs now
// comes from `config/clubDirectory`, rebuilt nightly by updateFixtures, so
// promotion and relegation need no code change. Accent colours aren't in the
// API, so they stay here — a club with no entry simply renders the default,
// which means a newly promoted club works immediately and can be given its
// colour whenever.
const CLUB_ACCENTS: Record<string, string> = {
  33: "#DA291C", // Manchester United
  34: "#241F20", // Newcastle
  35: "#B50E12", // Bournemouth
  36: "#FFFFFF", // Fulham
  39: "#FDB913", // Wolves
  40: "#C8102E", // Liverpool
  42: "#EF0107", // Arsenal
  44: "#6C1D45", // Burnley
  45: "#003399", // Everton
  46: "#0053A0", // Leicester
  47: "#132257", // Tottenham
  48: "#7A263A", // West Ham
  49: "#034694", // Chelsea
  50: "#6CABDD", // Manchester City
  51: "#0057B7", // Brighton
  52: "#1B458F", // Crystal Palace
  55: "#E30613", // Brentford
  57: "#0000FF", // Ipswich
  62: "#EE2737", // Sheffield United
  63: "#FFCD00", // Leeds
  65: "#DD0000", // Nottingham Forest
  66: "#670E36", // Aston Villa
  71: "#DA020E", // Middlesbrough
  746: "#FF0000", // Sunderland
  1359: "#D71920", // Luton
  41: "#D71920", // Southampton
};

/** Neutral fallback for a club we don't have a colour for yet. */
export const DEFAULT_CLUB_ACCENT = "#212121";

export const getClubAccent = (teamId: string | number | undefined): string =>
  (teamId !== undefined && CLUB_ACCENTS[String(teamId)]) || DEFAULT_CLUB_ACCENT;
