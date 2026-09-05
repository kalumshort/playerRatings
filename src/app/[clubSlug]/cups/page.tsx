import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Box, Container, Typography } from "@mui/material";

import { getUserIdFromSession } from "@/lib/auth-server";
import {
  getClubCompetitionsServer,
  getCupBracketServer,
  getGroupBySlugServer,
  isGroupMemberServer,
} from "@/lib/firebase/firebase-admin-queries";
import PrivateGroupPlaceholder from "@/components/ui/PrivateGroupPlaceholder";
import CupBracket from "@/components/client/Cups/CupBracket";
import CompetitionSwitcher from "@/components/client/Table/CompetitionSwitcher";
import SeasonSwitcher from "@/components/client/Widgets/SeasonSwitcher";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo/jsonLd";
import {
  archivedClubSeason,
  formatSeason,
  isArchivedSeason,
  resolveSeason,
} from "@/lib/config/season";
import { resolveCompetition } from "@/lib/config/competitions";

interface PageProps {
  params: Promise<{ clubSlug: string }>;
  searchParams: Promise<{ season?: string; league?: string }>;
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
    title: `${group.name} Cup Runs`,
    description: `Every knockout round ${group.name} played this season, and who is left in each competition.`,
    alternates: { canonical: `https://11votes.com/${clubSlug}/cups` },
    ...(isArchivedSeason(season) && {
      robots: { index: false, follow: true },
    }),
  };
}

export default async function CupsPage({ params, searchParams }: PageProps) {
  const { clubSlug } = await params;
  const { season: seasonParam, league: leagueParam } = await searchParams;

  const group = await getGroupBySlugServer(clubSlug);
  if (!group) notFound();

  if (group.isPublic === false) {
    const userId = await getUserIdFromSession();
    const isMember = userId
      ? await isGroupMemberServer(group.id, userId)
      : false;
    if (!isMember) return <PrivateGroupPlaceholder name={group.name} />;
  }

  const season = resolveSeason(seasonParam, archivedClubSeason(group));
  const clubId = group.groupClubId;

  const competitions = await getClubCompetitionsServer(clubId, season);
  const withBrackets = competitions.filter((c) => c.bracket);

  // Allowlisted against the club's own competitions before it can reach a
  // Firestore path, the same discipline resolveSeason applies to the season.
  const selected = resolveCompetition(
    leagueParam,
    withBrackets.map((c) => c.leagueId),
    withBrackets[0]?.leagueId ?? null,
  );

  const bracket = selected
    ? await getCupBracketServer(selected, season)
    : null;

  const selectedName =
    withBrackets.find((c) => c.leagueId === selected)?.name ?? "Cup Runs";

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "" },
          { name: group.name, path: `/${clubSlug}` },
          { name: "Cups", path: `/${clubSlug}/cups` },
        ])}
      />

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{ fontWeight: 900, letterSpacing: -0.5, mb: 0.5 }}
            >
              {selectedName}
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: "1rem" }}>
              {formatSeason(season)}
            </Typography>
          </Box>
          <SeasonSwitcher season={season} />
        </Box>

        {withBrackets.length > 1 && (
          <Box sx={{ mb: 2.5 }}>
            <CompetitionSwitcher
              competitions={withBrackets}
              selected={selected}
              clubSlug={clubSlug}
              season={season}
              basePath="cups"
            />
          </Box>
        )}

        {bracket ? (
          <CupBracket bracket={bracket} clubId={String(clubId)} />
        ) : (
          <Typography
            color="text.secondary"
            sx={{ py: 6, textAlign: "center" }}
          >
            {withBrackets.length === 0
              ? "No cup matches have been played yet this season."
              : "This competition's bracket hasn't been built yet."}
          </Typography>
        )}
      </Container>
    </>
  );
}
