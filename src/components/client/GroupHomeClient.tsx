"use client";

import React from "react";
import { useSelector } from "react-redux";

import { Box, Grid } from "@mui/material";
import {
  selectActiveClubFixturesLoaded,
  selectFixturesLoading,
} from "@/lib/redux/selectors/fixturesSelectors";

import PageSkeleton from "@/components/ui/PageSkeleton";
import useGroupData from "@/Hooks/useGroupData";
import LatestFixtureItem from "./Fixture/FixtureHeader/LatestFixtureItem";
import UpcomingFixturesCard from "./Schedule/UpcomingFixturesCard";
import LatestTeamSeasonRating from "./PlayerRatings/LatestTeamSeasonRating";

export default function GroupHomeClient() {
  const loading = useSelector(selectFixturesLoading);
  // Bucket presence for THIS club+season, not the global `loaded` flag. That
  // flag stays true from the previous season across a switch, so the old
  // `notStarted` heuristic fell through and rendered empty content.
  const activeSeasonLoaded = useSelector(selectActiveClubFixturesLoaded);

  const { userHomeGroup } = useGroupData();

  // An in-place skeleton, not <Spinner />: that one is position:fixed / 100vh /
  // z-9999, so switching season blanked the entire app including the header.
  if (!activeSeasonLoaded || loading) {
    return (
      <Box sx={{ mt: { xs: 2, md: 4 } }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <PageSkeleton rows={3} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <PageSkeleton rows={1} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: { xs: 2, md: 4 }, px: { xs: 0, md: 0 } }}>
      <Grid container spacing={3}>
        {/* --- LEFT COLUMN --- */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <LatestFixtureItem />
            <UpcomingFixturesCard count={3} />
          </Box>
        </Grid>

        {/* --- RIGHT COLUMN --- */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              position: { md: "sticky" },
              top: 100,
            }}
          >
            <LatestTeamSeasonRating />
          </Box>
        </Grid>
      </Grid>

      {userHomeGroup?.groupId === "002" && <div>Legacy Modal Placeholder</div>}
    </Box>
  );
}
