import { Box, Container, Typography } from "@mui/material";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  getGroupBySlugServer,
  isGroupMemberServer,
} from "@/lib/firebase/firebase-admin-queries";
import { getUserIdFromSession } from "@/lib/auth-server";
import {
  getClubLeaderboard,
  getPredictorLeaderboard,
  getUserProgress,
  getUserRank,
} from "@/lib/gamification/progressQueries";
import {
  archivedClubSeason,
  isArchivedSeason,
  resolveSeason,
} from "@/lib/config/season";
import PrivateGroupPlaceholder from "@/components/ui/PrivateGroupPlaceholder";
import FansPageClient from "@/components/client/Gamification/FansPageClient";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo/jsonLd";

interface PageProps {
  params: Promise<{ clubSlug: string }>;
  searchParams: Promise<{ season?: string }>;
}

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
    title: `${group.name} Fan Leaderboard`,
    description: `The most involved ${group.name} fans this season — ranked by taking part, not by being right.`,
    alternates: { canonical: `https://11votes.com/${clubSlug}/fans` },
    ...(isArchivedSeason(season) && { robots: { index: false, follow: true } }),
  };
}

/**
 * The club's fan leaderboard.
 *
 * Ranked by Fan XP, which is earned purely by taking part — rating players,
 * calling the mood, reacting, picking an XI. Prediction accuracy is scored on
 * its own separate ladder and deliberately does not feed this board, so the top
 * of it is the most involved fan rather than the luckiest forecaster.
 *
 * Server-rendered: this is a page fans land on directly and share, so the
 * rankings belong in the initial HTML.
 */
export default async function FansPage({ params, searchParams }: PageProps) {
  const { clubSlug } = await params;
  const group = await getGroupBySlugServer(clubSlug);
  if (!group) notFound();

  const isPublic = group.isPublic === true;
  const userId = await getUserIdFromSession();

  if (!isPublic) {
    const authorized = userId
      ? await isGroupMemberServer(group.id, userId)
      : false;
    if (!authorized) return <PrivateGroupPlaceholder name={group.name} />;
  }

  const season = resolveSeason(
    (await searchParams).season,
    archivedClubSeason(group),
  );

  const [clubEntries, predictorEntries] = await Promise.all([
    getClubLeaderboard(group.id, 50, season),
    getPredictorLeaderboard(group.id, 50, season),
  ]);

  // Only meaningful for a signed-in fan, and only once they have any XP.
  const progress = userId
    ? await getUserProgress(userId, group.id, season)
    : null;
  const rank = progress
    ? await getUserRank(group.id, progress.seasonXp, season)
    : null;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "" },
          { name: group.name, path: `/${clubSlug}` },
          { name: "Fan Leaderboard", path: `/${clubSlug}/fans` },
        ])}
      />

      <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h4"
            sx={{ fontWeight: 900, letterSpacing: -0.5, mb: 0.5 }}
          >
            {group.name} Fan Leaderboard
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: "1rem" }}>
            Ranked by taking part — rate players, call the mood, pick an XI.
            There are no right answers here, only turnout.
          </Typography>
        </Box>

        <FansPageClient
          clubName={group.name}
          clubEntries={clubEntries}
          predictorEntries={predictorEntries}
          currentUid={userId}
          rank={rank}
          predictionPoints={progress?.predictionPoints ?? 0}
          predictionsResolved={progress?.predictionsResolved ?? 0}
        />
      </Container>
    </>
  );
}
