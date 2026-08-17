"use client";

import { useState } from "react";
import { Alert, AlertTitle, Box, Button } from "@mui/material";

import StadiumSwitcher from "../Groups/StadiumSwitcher";
import useGroupData from "@/Hooks/useGroupData";
import useUserData from "@/Hooks/useUserData";
import { formatSeason } from "@/lib/config/season";

interface ArchivedClubNoticeProps {
  clubName: string;
  /** Last season the club was in the league — the season these pages show. */
  lastActiveSeason?: string | null;
  /** Guests get the explanation without the transfer call to action. */
  isGuestView: boolean;
}

/**
 * Shown across every page of a club that has left the Premier League. Its data
 * stops at `lastActiveSeason` — the nightly job no longer fetches fixtures or
 * squads for it — so the whole club is read-only. Members are pointed at the
 * transfer market so they aren't stranded on a club that can't be voted in.
 */
export default function ArchivedClubNotice({
  clubName,
  lastActiveSeason,
  isGuestView,
}: ArchivedClubNoticeProps) {
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const { userData } = useUserData();
  const { groupData } = useGroupData();

  const seasonLabel = lastActiveSeason
    ? ` after ${formatSeason(lastActiveSeason)}`
    : "";

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 1, md: 3 }, pt: 2 }}>
      <Alert
        severity="info"
        variant="outlined"
        action={
          isGuestView ? undefined : (
            <Button
              size="small"
              variant="contained"
              onClick={() => setSwitcherOpen(true)}
              sx={{ fontWeight: 800, whiteSpace: "nowrap" }}
            >
              Pick a new club
            </Button>
          )
        }
        sx={{ alignItems: "center", borderRadius: 2 }}
      >
        <AlertTitle sx={{ fontWeight: 900, mb: 0.25 }}>
          {clubName} left the Premier League{seasonLabel}
        </AlertTitle>
        Everything here is preserved as a read-only archive of that season.
        {isGuestView ? "" : " Transfer to keep predicting and rating."}
      </Alert>

      {!isGuestView && (
        <StadiumSwitcher
          open={switcherOpen}
          onClose={() => setSwitcherOpen(false)}
          groups={groupData}
          userData={userData}
        />
      )}
    </Box>
  );
}
