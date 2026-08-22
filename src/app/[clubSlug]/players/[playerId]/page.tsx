// src/app/[clubSlug]/players/[playerId]/page.tsx
import { Metadata } from "next";

import PlayerPageClient from "@/components/client/PlayerPage/PlayerPageClient";
import { adminDb } from "@/lib/firebase/admin";
import { getGroupBySlugServer } from "@/lib/firebase/firebase-admin-queries";
import {
  archivedClubSeason,
  isArchivedSeason,
  resolveSeason,
} from "@/lib/config/season";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, playerJsonLd } from "@/lib/seo/jsonLd";

interface Props {
  params: Promise<{ clubSlug: string; playerId: string }>;
  searchParams: Promise<{ season?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { clubSlug, playerId } = await params;

  // Fetch player data for SEO
  const playerDoc = await adminDb.collection("players").doc(playerId).get();
  if (!playerDoc.exists) return { title: "Player Not Found" };

  const player = playerDoc.data();
  const group = await getGroupBySlugServer(clubSlug);
  const season = resolveSeason(
    (await searchParams).season,
    archivedClubSeason(group),
  );

  return {
    title: `${player?.name} - Stats & Ratings`,
    description: `Season performance, match history and fan ratings for ${player?.name}.`,
    openGraph: { images: player?.photo ? [player.photo] : [] },
    alternates: {
      canonical: `https://11votes.com/${clubSlug}/players/${playerId}`,
    },
    // Was missing here while the fixture route already did it, so archived
    // `?season=` variants were competing with the current-season URL.
    ...(isArchivedSeason(season) && {
      robots: { index: false, follow: true },
    }),
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

  // Read for the AggregateRating only. Both reads are allowed to fail: the
  // page renders from the client either way, and structured data is never
  // worth breaking a page for.
  const [playerDoc, seasonDoc] = await Promise.all([
    adminDb
      .collection("players")
      .doc(playerId)
      .get()
      .catch(() => null),
    group
      ? adminDb
          .doc(`groups/${group.id}/seasons/${season}/players/${playerId}`)
          .get()
          .catch(() => null)
      : Promise.resolve(null),
  ]);

  const player = playerDoc?.data();
  // `totalRating` is the running sum the rating writes increment alongside
  // `totalSubmits`, so the mean is the one over the other. Guarded because a
  // player nobody has rated has no doc at all.
  const totals = seasonDoc?.data();
  const ratingCount = Number(totals?.totalSubmits) || 0;
  const averageRating =
    ratingCount > 0 ? Number(totals?.totalRating) / ratingCount : null;

  return (
    <>
      {player?.name && (
        <JsonLd
          data={[
            playerJsonLd({
              name: player.name,
              photo: player.photo,
              clubName: group?.name,
              url: `/${clubSlug}/players/${playerId}`,
              averageRating,
              ratingCount,
            }),
            breadcrumbJsonLd([
              { name: "Home", path: "" },
              ...(group
                ? [{ name: group.name, path: `/${clubSlug}` }]
                : []),
              {
                name: player.name,
                path: `/${clubSlug}/players/${playerId}`,
              },
            ]),
          ]}
        />
      )}
      <PlayerPageClient playerId={playerId} season={season} />
    </>
  );
}
