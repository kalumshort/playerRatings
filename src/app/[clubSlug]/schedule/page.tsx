export const runtime = "nodejs";

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

interface PageProps {
  params: Promise<{ clubSlug: string }>;
}

export default async function SchedulePage({ params }: PageProps) {
  // 1. Await params (Required in Next.js 15)
  const { clubSlug } = await params;

  // 2. FETCH GROUP FIRST
  const group = await getGroupBySlugServer(clubSlug);
  if (!group) notFound();

  // 3. CHECK VISIBILITY (Server-Side Gatekeeping)
  if (group.visibility === "private") {
    const userId = await getUserIdFromSession(); // Rely on cookies, not useAuth
    const isMember = group.members?.includes(userId);

    if (!isMember) {
      return <PrivateGroupPlaceholder name={group.name} />;
    }
  }

  // 4. DATA FETCHING (Only happens if authorized)
  const currentYear = "2025";
  const clubId = group.groupClubId;
  const fixtures = await getFixturesByClubServer(clubId, currentYear);

  // 5. DATA PROCESSING
  const stats = calculateStats(fixtures, clubId);
  const played = getPlayed(fixtures, clubId);

  return (
    <Box
      component="main"
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <SeasonOverview stats={stats} played={played} />
      <ScheduleContainer initialFixtures={fixtures} />
    </Box>
  );
}
