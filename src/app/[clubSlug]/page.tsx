import React from "react";
import { Metadata } from "next";
import { adminDb } from "@/lib/firebase/admin";
import { notFound } from "next/navigation";

// Sub-components (We will migrate these next)
import GroupHomeClient from "@/components/client/GroupHomeClient";
import {
  getClubCompetitionsServer,
  getGroupBySlugServer,
  getLeagueTableServer,
  isGroupMemberServer,
} from "@/lib/firebase/firebase-admin-queries";
import { getUserIdFromSession } from "@/lib/auth-server";
import PrivateGroupPlaceholder from "@/components/ui/PrivateGroupPlaceholder";
import MiniLeagueTable from "@/components/client/Table/MiniLeagueTable";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, sportsTeamJsonLd } from "@/lib/seo/jsonLd";
import { archivedClubSeason, resolveSeason } from "@/lib/config/season";

interface Props {
  params: Promise<{ clubSlug: string }>;
}

// --- STEP 1: DYNAMIC SEO (Replaces Helmet) ---
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { clubSlug } = await params;

  const groupQuery = await adminDb
    .collection("groups")
    .where("slug", "==", clubSlug)
    .limit(1)
    .get();

  if (groupQuery.empty) return { title: "Club Not Found" };

  const group = groupQuery.docs[0].data();
  const groupName = group.name || group.groupName || "Football";

  return {
    title: `${groupName} Player Ratings & Fan Hub`,
    description: `The ultimate ${groupName} fan community. Rate players after every match, track season stats, and see the real-time fan consensus.`,
    alternates: {
      canonical: `https://11votes.com/${clubSlug}`,
    },
    openGraph: {
      title: `${groupName} Player Ratings`,
      description: `The ultimate ${groupName} fan community.`,
      url: `https://11votes.com/${clubSlug}`,
      type: "website",
      images: group.logoUrl ? [{ url: group.logoUrl }] : [],
    },
  };
}

// --- STEP 2: SERVER COMPONENT ---
export default async function ClubPage({ params }: Props) {
  const { clubSlug } = await params;

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

  // The club's corner of its league table. Fetched here rather than in the
  // client component because standings are a server read; everything else on
  // this page comes from Redux via the layout's initializer.
  const season = resolveSeason(undefined, archivedClubSeason(group));
  const leagueSummary = await buildLeagueSummary(
    group.groupClubId,
    clubSlug,
    season,
  );

  return (
    <>
      <JsonLd
        data={[
          sportsTeamJsonLd({
            name: group.name,
            slug: clubSlug,
            logoUrl: group.logoUrl,
          }),
          // Places the club hub directly under Home. This is the signal that
          // actually expresses site hierarchy to Google.
          breadcrumbJsonLd([
            { name: "Home", path: "" },
            { name: group.name, path: `/${clubSlug}` },
          ]),
        ]}
      />
      <GroupHomeClient leagueSummary={leagueSummary} />
    </>
  );
}

/**
 * The mini table for a club's own league, or nothing.
 *
 * Picks the first competition the club plays in that has a table — for a
 * Premier League club that is the league itself, and a club whose only
 * competitions are cups simply gets no card rather than an empty one.
 *
 * Never throws: a missing table is a card that does not render, not a home
 * page that fails.
 */
async function buildLeagueSummary(
  clubId: string,
  clubSlug: string,
  season: string,
) {
  try {
    const competitions = await getClubCompetitionsServer(clubId, season);
    const league = competitions.find((competition) => competition.table);
    if (!league?.leagueId) return null;

    const table = await getLeagueTableServer(league.leagueId, season);
    if (!table) return null;

    return (
      <MiniLeagueTable
        standings={table.standings}
        initialLive={table.live}
        leagueId={league.leagueId}
        season={season}
        clubId={String(clubId)}
        clubSlug={clubSlug}
      />
    );
  } catch (error) {
    console.error("❌ League summary failed:", error);
    return null;
  }
}
