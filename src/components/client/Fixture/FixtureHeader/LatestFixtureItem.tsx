"use client";

import React from "react";
import { useSelector } from "react-redux";
import { Box, Typography, Paper, useTheme, alpha } from "@mui/material";
import { selectLatestFixture } from "@/lib/redux/selectors/fixturesSelectors";
// import { footballClubsColours } from "@/hooks/Helper_Functions";
import { useParams, useRouter } from "next/navigation";
import FixtureHeader from "./FixtureHeader";
import { useClubView } from "@/context/ClubViewProvider";
import { withSeasonParam } from "@/lib/config/season";

// Sub-components (We'll need to modernize these next)

export default function LatestFixtureItem() {
  const theme = useTheme();
  const router = useRouter();
  const latestFixture = useSelector(selectLatestFixture);
  const params = useParams();
  const clubSlug = params?.clubSlug;
  const { season } = useClubView();

  if (!latestFixture) {
    return (
      <Paper
        sx={{
          bgcolor: "grey.900",
          borderRadius: "12px",
          textAlign: "center",
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="h5" fontWeight="bold" color="text.secondary">
          No Upcoming Matches
        </Typography>
      </Paper>
    );
  }

  // 2. Generate Gradient (Modern MUI approach)

  const handleFixtureClick = () => {
    // Leading slash matters: the relative form resolved wrongly from nested routes
    router.push(
      withSeasonParam(
        `/${clubSlug}/fixture/${latestFixture.fixture.id}`,
        season,
      ),
    );
  };

  return <FixtureHeader fixture={latestFixture} onClick={handleFixtureClick} />;
}
