// src/app/[clubSlug]/players/[playerId]/page.tsx
import { Metadata } from "next";

import PlayerPageClient from "@/components/client/PlayerPage/PlayerPageClient";
import { adminDb } from "@/lib/firebase/admin";
import {
  getGroupBySlugServer,
  getSquadPlayerServer,
} from "@/lib/firebase/firebase-admin-queries";
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

/**
 * The player behind this URL, as `{ name, photo, ... }` or null.
 *
 * Squad first, since that is where the nightly job actually writes players.
 * The legacy `players/{id}` collection stays as a fallback: it is sparse, but
 * it is not empty, and a hand-created doc there is still a real name.
 *
 * Never throws — a page that renders entirely from the client should not 500
 * over a title.
 */
async function resolvePlayer(
  clubId: string | number | null | undefined,
  season: string,
  playerId: string,
) {
  const squadPlayer = await getSquadPlayerServer(clubId, season, playerId);
  if (squadPlayer?.name) return squadPlayer;

  const legacyDoc = await adminDb
    .collection("players")
    .doc(playerId)
    .get()
    .catch(() => null);

  return legacyDoc?.exists ? legacyDoc.data() : null;
}

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { clubSlug, playerId } = await params;

  // Group first: the squad is stored per club id, so nothing can be resolved
  // without it.
  const group = await getGroupBySlugServer(clubSlug);
  const season = resolveSeason(
    (await searchParams).season,
    archivedClubSeason(group),
  );

  const player = await resolvePlayer(group?.groupClubId, season, playerId);

  return {
    // A named player gets a real title; anything else falls back to the plain
    // brand name via `absolute`, which opts out of the root layout's
    // "%s | 11Votes" template. It must never read "Player Not Found" again —
    // the page itself loads the player fine, so that title was only ever a
    // statement about this lookup.
    ...(player?.name
      ? {
          title: `${player.name} - Stats & Ratings`,
          description: `Season performance, match history and fan ratings for ${player.name}${
            group?.name ? ` at ${group.name}` : ""
          }.`,
          openGraph: { images: player.photo ? [player.photo] : [] },
        }
      : { title: { absolute: "11Votes" } }),
    // Outside the branch on purpose: the old early return dropped the
    // canonical and the archived-season noindex for exactly the pages that hit
    // it, which was nearly all of them.
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

  // The player is resolved the same way the title resolves it — cache()d, so
  // this costs nothing on top of generateMetadata. Both reads are allowed to
  // fail: the page renders from the client either way, and structured data is
  // never worth breaking a page for.
  const [player, seasonDoc] = await Promise.all([
    resolvePlayer(group?.groupClubId, season, playerId),
    group
      ? adminDb
          .doc(`groups/${group.id}/seasons/${season}/players/${playerId}`)
          .get()
          .catch(() => null)
      : Promise.resolve(null),
  ]);

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
