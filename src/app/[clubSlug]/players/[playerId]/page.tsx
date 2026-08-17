// src/app/[clubSlug]/players/[playerId]/page.tsx
import { Metadata } from "next";

import PlayerPageClient from "@/components/client/PlayerPage/PlayerPageClient";
import { adminDb } from "@/lib/firebase/admin";
import { getGroupBySlugServer } from "@/lib/firebase/firebase-admin-queries";
import { archivedClubSeason, resolveSeason } from "@/lib/config/season";

interface Props {
  params: Promise<{ clubSlug: string; playerId: string }>;
  searchParams: Promise<{ season?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { playerId } = await params;

  // Fetch player data for SEO
  const playerDoc = await adminDb.collection("players").doc(playerId).get();
  if (!playerDoc.exists) return { title: "Player Not Found" };

  const player = playerDoc.data();
  return {
    title: `${player?.name} - Stats & Ratings | 11Votes`,
    description: `View season performance, match history, and fan ratings for ${player?.name}.`,
    openGraph: { images: [player?.photo] },
  };
}

export default async function Page({ params, searchParams }: Props) {
  const { clubSlug, playerId } = await params;
  const group = await getGroupBySlugServer(clubSlug);

  // Resolved server-side so the rating fetches start on the right season. An
  // archived club falls back to its last active season.
  const season = resolveSeason(
    (await searchParams).season,
    archivedClubSeason(group),
  );

  return <PlayerPageClient playerId={playerId} season={season} />;
}
