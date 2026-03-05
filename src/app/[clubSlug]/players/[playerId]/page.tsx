// src/app/[clubSlug]/players/[playerId]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";

import PlayerPageClient from "@/components/client/PlayerPage/PlayerPageClient";
import { adminDb } from "@/lib/firebase/admin";

interface Props {
  params: Promise<{ clubSlug: string; playerId: string }>;
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

export default async function Page({ params }: Props) {
  const { playerId } = await params;
  return <PlayerPageClient playerId={playerId} />;
}
