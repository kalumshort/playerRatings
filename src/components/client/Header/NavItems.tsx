import {
  Home,
  Calendar,
  Trophy,
  User,
  Medal,
  Globe,
  ListOrdered,
  Swords,
} from "lucide-react";

/**
 * Drawer navigation for the current context.
 *
 * `isAuthed` splits the two audiences rather than just hiding account entries.
 * A guest on a public club needs a way back out to the marketing site, and
 * without it the drawer rendered nothing but a login form. A signed-in fan
 * needs the opposite: "/" only redirects them to their own club, so a
 * "11Votes Home" entry would be a link that appears to go somewhere else and
 * doesn't.
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
      text: "League Table",
      icon: <ListOrdered size={20} />,
      path: `/${clubSlug}/table`,
    },
    {
      text: "Cups",
      icon: <Swords size={20} />,
      path: `/${clubSlug}/cups`,
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
      : // Guests only: their way out of the club, mirroring the header logo.
        // For a signed-in fan "/" just bounces back to their own club, so the
        // entry would promise a destination it never reaches.
        [{ text: "11Votes Home", icon: <Globe size={20} />, path: `/` }]),
  ];
};
