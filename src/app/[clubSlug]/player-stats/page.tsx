// app/[groupSlug]/player-stats/page.tsx

import PlayerStatsClient from "@/components/client/PlayerStats/PlayerStatsClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Player Ratings | 11Votes",
  description: "Season-long player performance leaderboard.",
};

export default function PlayerStatsPage() {
  return <PlayerStatsClient />;
}
