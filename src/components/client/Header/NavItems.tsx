import { Home, Calendar, Trophy, User } from "lucide-react";

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
        { text: "Settings", icon: <User size={20} />, path: `/profile` },
      ]
    : [
        { text: "Home", icon: <Home size={20} />, path: `/` },
        { text: "Settings", icon: <User size={20} />, path: `/profile` },
      ];
