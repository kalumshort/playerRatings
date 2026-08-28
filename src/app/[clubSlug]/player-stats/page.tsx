// app/[groupSlug]/player-stats/page.tsx

import PlayerStatsClient from "@/components/client/PlayerStats/PlayerStatsClient";
import { Metadata } from "next";
import { getGroupBySlugServer } from "@/lib/firebase/firebase-admin-queries";
import {
  archivedClubSeason,
  isArchivedSeason,
  resolveSeason,
} from "@/lib/config/season";

interface PageProps {
  params: Promise<{ clubSlug: string }>;
  searchParams: Promise<{ season?: string }>;
}

/**
 * Was a static `metadata` export, which gave all 20 clubs the identical title
 * "Player Ratings" and the same description — 20 pages competing with each
 * other on duplicate titles. Now club-specific, with a canonical.
 */
export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { clubSlug } = await params;
  const group = await getGroupBySlugServer(clubSlug);
  if (!group) return { title: "Club Not Found" };

  const season = resolveSeason(
    (await searchParams).season,
    archivedClubSeason(group),
  );

  return {
    title: `${group.name} Player Ratings Leaderboard`,
    description: `Season-long fan ratings for every ${group.name} player, ranked by average score.`,
    alternates: {
      canonical: `https://11votes.com/${clubSlug}/player-stats`,
    },
    ...(isArchivedSeason(season) && {
      robots: { index: false, follow: true },
    }),
  };
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
