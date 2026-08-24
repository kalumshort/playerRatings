import { Home, Calendar, Trophy, User, Medal, Globe } from "lucide-react";

/**
 * Drawer navigation for the current context.
 *
 * `isAuthed` gates only the entries that genuinely need a session — a
 * signed-out visitor on a public club still gets the club's pages and, more
 * importantly, a way back out to the site. Without that last entry the drawer
 * rendered nothing but a login form, so a guest who landed on a club had no
 * navigation at all.
 */
export const getNavItems = (clubSlug, { isAuthed = true } = {}) => {
  if (!clubSlug) {
    return [
      { text: "Home", icon: <Home size={20} />, path: `/` },
      ...(isAuthed
        ? [{ text: "Settings", icon: <User size={20} />, path: `/profile` }]
        : []),
    ];
  }

  return [
    { text: "Club Home", icon: <Home size={20} />, path: `/${clubSlug}` },
    {
      text: "Schedule",
      icon: <Calendar size={20} />,
      path: `/${clubSlug}/schedule`,
    },
    {
      text: "Player Ratings",
      icon: <Trophy size={20} />,
      path: `/${clubSlug}/player-stats`,
    },
    // Ranks fans, not players — distinct from "Player Ratings" above,
    // which ranks the squad.
    {
      text: "Fan Leaderboard",
      icon: <Medal size={20} />,
      path: `/${clubSlug}/fans`,
    },
    ...(isAuthed
      ? [{ text: "Settings", icon: <User size={20} />, path: `/profile` }]
      : []),
    // The way out of the club, mirroring the header logo.
    { text: "11Votes Home", icon: <Globe size={20} />, path: `/` },
  ];
};
