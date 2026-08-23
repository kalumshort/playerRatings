import { Home, Calendar, Trophy, User, Medal } from "lucide-react";

export const getNavItems = (clubSlug) =>
  clubSlug
    ? [
        { text: "Home", icon: <Home size={20} />, path: `/${clubSlug}` },
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
        { text: "Settings", icon: <User size={20} />, path: `/profile` },
      ]
    : [
        { text: "Home", icon: <Home size={20} />, path: `/` },
        { text: "Settings", icon: <User size={20} />, path: `/profile` },
      ];
