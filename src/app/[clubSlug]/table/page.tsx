import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Box, Container, Typography } from "@mui/material";

import { getUserIdFromSession } from "@/lib/auth-server";
import {
  getClubCompetitionsServer,
  getGroupBySlugServer,
  getLeagueStandingsServer,
  isGroupMemberServer,
} from "@/lib/firebase/firebase-admin-queries";
import PrivateGroupPlaceholder from "@/components/ui/PrivateGroupPlaceholder";
import LeagueTable from "@/components/client/Table/LeagueTable";
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
    title: `${group.name} League Table`,
    description: `The live league table for ${group.name}, updated as matches are played.`,
    alternates: { canonical: `https://11votes.com/${clubSlug}/table` },
    ...(isArchivedSeason(season) && {
      robots: { index: false, follow: true },
    }),
  };
}

export default async function TablePage({ params, searchParams }: PageProps) {
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

  // Which competitions this club actually played in, and which of those the
  // app can render a table for.
  const competitions = await getClubCompetitionsServer(clubId, season);
  const withTables = competitions.filter((c) => c.table);

  // `?league=` is allowlisted against the club's own competitions before it
  // can reach a Firestore path — the same discipline resolveSeason applies.
  const selected = resolveCompetition(
    leagueParam,
    withTables.map((c) => c.leagueId),
    withTables[0]?.leagueId ?? null,
  );

  const standings = selected
    ? await getLeagueStandingsServer(selected, season)
    : null;

  const selectedName =
    withTables.find((c) => c.leagueId === selected)?.name ?? "League Table";

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "" },
          { name: group.name, path: `/${clubSlug}` },
          { name: "League Table", path: `/${clubSlug}/table` },
        ])}
      />

      <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
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
              {standings?.country ? ` · ${standings.country}` : ""}
            </Typography>
          </Box>
          <SeasonSwitcher season={season} />
        </Box>

        {withTables.length > 1 && (
          <Box sx={{ mb: 2.5 }}>
            <CompetitionSwitcher
              competitions={withTables}
              selected={selected}
              clubSlug={clubSlug}
              season={season}
            />
          </Box>
        )}

        {standings ? (
          <LeagueTable standings={standings} clubId={String(clubId)} />
        ) : (
          <Typography
            color="text.secondary"
            sx={{ py: 6, textAlign: "center" }}
          >
            {competitions.length === 0
              ? "No matches have been played yet this season."
              : "No table is available for this competition yet."}
          </Typography>
        )}
      </Container>
    </>
  );
}
