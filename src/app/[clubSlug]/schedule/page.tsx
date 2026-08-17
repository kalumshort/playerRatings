import { notFound } from "next/navigation";
import { getUserIdFromSession } from "@/lib/auth-server";
import SeasonOverview from "@/components/client/Schedule/SeasonOverview";
import ScheduleView from "@/components/client/Schedule/ScheduleView";
import {
  getFixturesByClubServer,
  getGroupBySlugServer,
} from "@/lib/firebase/firebase-admin-queries";
import { calculateStats, getPlayed } from "@/lib/utils/football-logic";
import PrivateGroupPlaceholder from "@/components/ui/PrivateGroupPlaceholder";
import { Box } from "@mui/material";
import { archivedClubSeason, resolveSeason } from "@/lib/config/season";

interface PageProps {
  params: Promise<{ clubSlug: string }>;
  searchParams: Promise<{ season?: string }>;
}

export default async function SchedulePage({
  params,
  searchParams,
}: PageProps) {
  // 1. Await params (Required in Next.js 15)
  const { clubSlug } = await params;
  const { season: seasonParam } = await searchParams;

  // 2. FETCH GROUP FIRST
  const group = await getGroupBySlugServer(clubSlug);
  if (!group) notFound();

  // 3. CHECK VISIBILITY (Server-Side Gatekeeping)
  const isPublic = group.isPublic === true;

  if (group.isPublic === false) {
    const userId = await getUserIdFromSession(); // Rely on cookies, not useAuth
    const isMember = group.members?.includes(userId);

    if (!isMember) {
      return <PrivateGroupPlaceholder name={group.name} />;
    }
  }

  // 4. DATA FETCHING (Only happens if authorized)
  // Allowlisted before it reaches a Firestore path. An archived club falls back
  // to its last active season, so a bare /schedule shows real fixtures rather
  // than an empty current season.
  const season = resolveSeason(seasonParam, archivedClubSeason(group));
  const clubId = group.groupClubId;
  const fixtures = await getFixturesByClubServer(clubId, season);

  // 5. DATA PROCESSING
  const stats = calculateStats(fixtures, clubId);
  const played = getPlayed(fixtures, clubId);

  return (
    <Box
      component="main"
      sx={{
        // The page scrolls normally now. This used to be a bounded dvh column
        // wrapping an inner-scrolling panel with the scrollbar hidden, which
        // left the list with no scroll affordance and a nested scroll region
        // that fought the browser on both mobile and desktop.
        maxWidth: 1200,
        mx: "auto",
        px: { xs: 1, md: 3 },
        pt: 2,
        pb: 8,
      }}
    >
      <SeasonOverview stats={stats} played={played} season={season} />
      <ScheduleView
        initialFixtures={fixtures}
        season={season}
        clubId={clubId}
      />
    </Box>
  );
}
