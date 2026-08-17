// app/[groupSlug]/player-stats/page.tsx

import PlayerStatsClient from "@/components/client/PlayerStats/PlayerStatsClient";
import { Metadata } from "next";
import { getGroupBySlugServer } from "@/lib/firebase/firebase-admin-queries";
import { archivedClubSeason, resolveSeason } from "@/lib/config/season";

export const metadata: Metadata = {
  title: "Player Ratings | 11Votes",
  description: "Season-long player performance leaderboard.",
};

interface PageProps {
  params: Promise<{ clubSlug: string }>;
  searchParams: Promise<{ season?: string }>;
}

export default async function PlayerStatsPage({
  params,
  searchParams,
}: PageProps) {
  const { clubSlug } = await params;
  const group = await getGroupBySlugServer(clubSlug);

  // Resolved server-side so the rating fetches below start on the right season.
  // An archived club falls back to its last active season.
  const season = resolveSeason(
    (await searchParams).season,
    archivedClubSeason(group),
  );

  return <PlayerStatsClient season={season} />;
}
