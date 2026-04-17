import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getFixtureByIdServer,
  getGroupBySlugServer,
  getMatchPlayerRatingsServer,
  getMatchPredictionsServer,
  isGroupMemberServer,
} from "@/lib/firebase/firebase-admin-queries";
import FixtureClientWrapper from "@/components/client/Fixture/FixtureClientWrapper";
import { getUserIdFromSession } from "@/lib/auth-server";
import PrivateGroupPlaceholder from "@/components/ui/PrivateGroupPlaceholder";

interface PageProps {
  params: Promise<{ clubSlug: string; matchId: string }>;
}

const CURRENT_YEAR = "2025";

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { matchId } = await params;

  try {
    const fixture = await getFixtureByIdServer(matchId, CURRENT_YEAR);
    if (!fixture) return { title: "Match Not Found" };

    const { home, away } = fixture.teams;
    return {
      title: `${home.name} vs ${away.name} - Player Ratings | 11Votes`,
      description: `Rate the players for ${home.name} vs ${away.name}.`,
      openGraph: { images: [home.logo, away.logo] },
    };
  } catch (error) {
    console.error("[Metadata Error]:", error);
    return { title: "Error Loading Match" };
  }
}

export default async function FixturePage({ params }: PageProps) {
  const { clubSlug, matchId } = await params;

  console.log(`--- [DEBUG] Starting Page Load for ${clubSlug}/${matchId} ---`);

  // 1. Resolve Group & User Identity
  const [group, userId] = await Promise.all([
    getGroupBySlugServer(clubSlug),
    getUserIdFromSession(),
  ]);

  if (!group) {
    console.error(`[NOT_FOUND]: Group not found for slug "${clubSlug}"`);
    notFound();
  }

  console.log(
    `[DEBUG]: Group found (${group.id}), User ID: ${userId ?? "Guest"}`,
  );

  // 2. Security Check
  const isPublic = group.isPublic === true;
  const isAuthorized =
    isPublic || (userId ? await isGroupMemberServer(group.id, userId) : false);

  if (!isAuthorized) {
    console.warn(
      `[AUTH_DENIED]: User ${userId} unauthorized for group ${group.id}`,
    );
    return <PrivateGroupPlaceholder name={group.name} />;
  }

  // 3. Parallel Data Fetching
  console.log(
    `[DEBUG]: Fetching fixture/ratings for matchId: ${matchId}, year: ${CURRENT_YEAR}`,
  );

  const [fixture, predictions, ratingsData] = await Promise.all([
    getFixtureByIdServer(matchId, CURRENT_YEAR),
    getMatchPredictionsServer(group.id, matchId, CURRENT_YEAR),
    getMatchPlayerRatingsServer(group.id, matchId, CURRENT_YEAR),
  ]);

  if (!fixture) {
    console.error(
      `[NOT_FOUND]: Fixture data missing for matchId "${matchId}" in year ${CURRENT_YEAR}`,
    );
    notFound();
  }

  console.log(
    `[SUCCESS]: Data loaded for ${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
  );

  return (
    <FixtureClientWrapper
      initialFixture={fixture}
      initialPredictions={predictions}
      initialRatings={ratingsData}
      group={group}
      matchId={matchId}
      currentYear={CURRENT_YEAR}
    />
  );
}
