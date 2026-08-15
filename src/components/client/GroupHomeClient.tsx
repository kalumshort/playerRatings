"use client";

import React from "react";
import { useSelector } from "react-redux";

import { Box, Grid, useMediaQuery, useTheme } from "@mui/material";
import {
  selectActiveClubFixtures,
  selectFixturesLoading,
  selectFixturesLoaded,
} from "@/lib/redux/selectors/fixturesSelectors";

import PageSkeleton from "@/components/ui/PageSkeleton";
import useGroupData from "@/Hooks/useGroupData";
import LatestFixtureItem from "./Fixture/FixtureHeader/LatestFixtureItem";
import ScheduleContainer from "./Schedule/ScheduleContainer";
import LatestTeamSeasonRating from "./PlayerRatings/LatestTeamSeasonRating";

export default function GroupHomeClient() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const fixtures = useSelector(selectActiveClubFixtures);
  const loading = useSelector(selectFixturesLoading);
  const loaded = useSelector(selectFixturesLoaded);
  const { userHomeGroup } = useGroupData();

  // "Not started" = store uninitialised, fetch hasn't been dispatched yet.
  // Without this, the first render sees loading=false, loaded=false and falls
  // straight through to render empty content — causing the flash.
  const notStarted = !loaded && !loading;

  // An in-place skeleton, not <Spinner />: that one is position:fixed / 100vh /
  // z-9999, so switching season blanked the entire app including the header.
  if (notStarted || loading) {
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
            <ScheduleContainer
              limitAroundLatest={isMobile ? 2 : 3}
              showLink={true}
              scroll={false}
              scrollOnLoad={false}
            />
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
