"use client";

import React from "react";
import { useSelector } from "react-redux";
import { Box, Typography, Paper, useTheme, alpha } from "@mui/material";
import { selectLatestFixture } from "@/lib/redux/selectors/fixturesSelectors";
// import { footballClubsColours } from "@/hooks/Helper_Functions";
import { useParams, useRouter } from "next/navigation";
import FixtureHeader from "./FixtureHeader";

// Sub-components (We'll need to modernize these next)

export default function LatestFixtureItem() {
  const theme = useTheme();
  const router = useRouter();
  const latestFixture = useSelector(selectLatestFixture);
  const params = useParams();
  const clubSlug = params?.clubSlug;

  if (!latestFixture) {
    return (
      <Paper
        sx={{
          p: 4,
          bgcolor: "grey.900",
          borderRadius: 2,
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

  // 1. Get Team Colors
  const homeTeamId = latestFixture.teams.home.id;
  const awayTeamId = latestFixture.teams.away.id;
  const homeColor = "#1727b5";
  const awayColor = "#b92525";

  // 2. Generate Gradient (Modern MUI approach)
  const fixtureGradient = `linear-gradient(95deg, ${alpha(homeColor, 0.9)} 40%, ${alpha(awayColor, 0.9)} 60%)`;

  const handleFixtureClick = () => {
    router.push(`${clubSlug}/fixture/${latestFixture.fixture.id}`);
  };

  return (
    <div onClick={handleFixtureClick}>
      <FixtureHeader
        fixture={latestFixture}
        showDate={true}
        // Pass colors down if FixtureHeader needs them
        homeColor={homeColor}
        awayColor={awayColor}
      />
    </div>
  );
}
