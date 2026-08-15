// app/[groupSlug]/player-stats/page.tsx

import PlayerStatsClient from "@/components/client/PlayerStats/PlayerStatsClient";
import { Metadata } from "next";
import { resolveSeason } from "@/lib/config/season";

export const metadata: Metadata = {
  title: "Player Ratings | 11Votes",
  description: "Season-long player performance leaderboard.",
};

interface PageProps {
  searchParams: Promise<{ season?: string }>;
}

export default async function PlayerStatsPage({ searchParams }: PageProps) {
  // Resolved server-side so the rating fetches below start on the right season
  const season = resolveSeason((await searchParams).season);

  return <PlayerStatsClient season={season} />;
}
