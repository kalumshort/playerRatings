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
      // Same top offset and insets as the loaded page, so nothing shifts when
      // the fixtures arrive.
      <Box sx={{ mt: { xs: 0, md: 4 } }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <PageSkeleton rows={3} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ px: { xs: 2, md: 0 } }}>
              <PageSkeleton rows={1} />
            </Box>
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    // No top margin on mobile: the latest fixture is the hero and sits flush
    // under the app bar, the same way the fixture page's header does.
    <Box sx={{ mt: { xs: 0, md: 4 } }}>
      <Grid container spacing={3}>
        {/* --- LEFT COLUMN --- */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Full-bleed, so its squared top corners meet the app bar. */}
            <LatestFixtureItem />
            {/* Everything below the hero is inset on mobile — edge to edge, the
                cards had no breathing room against the screen edges. */}
            <Box sx={{ px: { xs: 2, md: 0 } }}>
              <UpcomingFixturesCard count={3} />
            </Box>
          </Box>
        </Grid>

        {/* --- RIGHT COLUMN --- */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              px: { xs: 2, md: 0 },
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
