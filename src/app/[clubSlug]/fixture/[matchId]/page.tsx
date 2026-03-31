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

const CURRENT_YEAR = "2025"; // Centralized year config

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { matchId } = await params;
  const fixture = await getFixtureByIdServer(matchId, CURRENT_YEAR);

  if (!fixture) return { title: "Match Not Found" };

  const { home, away } = fixture.teams;

  return {
    title: `${home.name} vs ${away.name} - Player Ratings | 11Votes`,
    description: `Rate the players for ${home.name} vs ${away.name}. See the real-time fan consensus.`,
    openGraph: {
      images: [home.logo, away.logo],
    },
  };
}

export default async function FixturePage({ params }: PageProps) {
  const { clubSlug, matchId } = await params;

  // 1. Resolve Group & User Identity
  // We fetch these together to keep the "waterfall" short
  const [group, userId] = await Promise.all([
    getGroupBySlugServer(clubSlug),
    getUserIdFromSession(),
  ]);

  if (!group) notFound();

  // 2. Security Check (Sub-collection lookup for private groups)
  const isPublic = group.isPublic === true;
  const isAuthorized =
    isPublic || (userId ? await isGroupMemberServer(group.id, userId) : false);

  if (!isAuthorized) {
    return <PrivateGroupPlaceholder name={group.name} />;
  }

  // 3. Parallel Data Fetching
  // Now that we're past the gate, we fetch the bulk data in one shot
  const [fixture, predictions, ratingsData] = await Promise.all([
    getFixtureByIdServer(matchId, CURRENT_YEAR),
    getMatchPredictionsServer(group.id, matchId, CURRENT_YEAR),
    getMatchPlayerRatingsServer(group.id, matchId, CURRENT_YEAR),
  ]);

  if (!fixture) notFound();

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
