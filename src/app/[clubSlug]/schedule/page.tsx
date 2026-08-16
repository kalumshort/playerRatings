import { notFound } from "next/navigation";
import { getUserIdFromSession } from "@/lib/auth-server";
import SeasonOverview from "@/components/client/Schedule/SeasonOverview";
import ScheduleContainer from "@/components/client/Schedule/ScheduleContainer";
import {
  getFixturesByClubServer,
  getGroupBySlugServer,
} from "@/lib/firebase/firebase-admin-queries";
import { calculateStats, getPlayed } from "@/lib/utils/football-logic";
import PrivateGroupPlaceholder from "@/components/ui/PrivateGroupPlaceholder";
import { Box } from "@mui/material";
import { resolveSeason } from "@/lib/config/season";

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
  // Allowlisted before it reaches a Firestore path
  const season = resolveSeason(seasonParam);
  const clubId = group.groupClubId;
  const fixtures = await getFixturesByClubServer(clubId, season);

  // 5. DATA PROCESSING
  const stats = calculateStats(fixtures, clubId);
  const played = getPlayed(fixtures, clubId);

  return (
    <Box
      component="main"
      sx={{
        display: "flex",
        flexDirection: "column",
        // ScheduleContainer is an inner-scrolling panel, so it needs a bounded
        // height. 100vh was wrong twice over: it ignores the mobile URL bar,
        // and it didn't subtract the fixed header spacer, so the bottom of the
        // list sat below the fold and was unreachable. dvh tracks the visible
        // viewport; the offsets match the spacer in Header/index.tsx.
        height: { xs: "calc(100dvh - 64px)", md: "calc(100dvh - 80px)" },
        overflow: "hidden",
      }}
    >
      <SeasonOverview stats={stats} played={played} season={season} />
      <ScheduleContainer
        initialFixtures={fixtures}
        season={season}
        clubId={clubId}
      />
    </Box>
  );
}
