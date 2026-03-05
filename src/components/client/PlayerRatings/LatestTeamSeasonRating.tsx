"use client";

import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import {
  Paper,
  Typography,
  Box,
  Button,
  useTheme,
  Skeleton,
} from "@mui/material";
import { styled, alpha } from "@mui/material/styles";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

// --- NEW SELECTORS ---
import { selectActiveClubFixtures } from "@/lib/redux/selectors/fixturesSelectors";
import {
  selectAllPlayerOverallRatings,
  selectRatingsLoadingStates,
} from "@/lib/redux/selectors/ratingsSelectors";
import { RootState, AppDispatch } from "@/lib/redux/store";
import RatingLineupPlayer from "./RatingLineupPlayer";

// --- COMPONENTS ---

// --- STYLED COMPONENTS ---
const CardContainer = styled(Paper)(({ theme }) => ({
  padding: "24px",
  borderRadius: "24px",
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  overflow: "hidden",
}));

const PitchContainer = styled(Box)(({ theme }) => {
  const accent = theme.palette.primary.main;
  return {
    borderRadius: "20px",
    padding: "40px 10px",
    minHeight: "450px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    position: "relative",
    overflow: "hidden",
    backgroundColor: alpha(theme.palette.background.default, 0.5),
    border: `1px solid ${alpha(accent, 0.3)}`,
    boxShadow: `inset 0 0 40px ${alpha("#000", 0.2)}`,

    "&::before": {
      content: '""',
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: "120px",
      height: "120px",
      border: `2px solid ${alpha(accent, 0.1)}`,
      borderRadius: "50%",
      pointerEvents: "none",
    },
    "&::after": {
      content: '""',
      position: "absolute",
      top: "50%",
      left: 0,
      right: 0,
      height: "2px",
      backgroundColor: alpha(accent, 0.1),
      pointerEvents: "none",
    },
  };
});

const PlayerRow = styled(Box)({
  display: "flex",
  justifyContent: "space-around",
  alignItems: "center",
  zIndex: 2,
  position: "relative",
});

export default function LatestTeamSeasonRating() {
  // 1. Get Context from Redux
  const activeGroupId = useSelector(
    (state: RootState) => state.groupData.activeGroupId,
  );
  const activeGroup = useSelector((state: RootState) =>
    activeGroupId ? state.groupData.byGroupId[activeGroupId] : null,
  );
  const currentYear = useSelector(
    (state: RootState) => state.globalData.currentYear,
  );

  const clubId = Number(activeGroup?.groupClubId);

  // 2. Selectors
  const allFixtures = useSelector(selectActiveClubFixtures);
  const playerStats = useSelector(selectAllPlayerOverallRatings);

  // 3. Compute Lineup Logic
  const { formationRows, fixtureData } = useMemo(() => {
    if (!allFixtures || !clubId)
      return { formationRows: [], fixtureData: null };

    // Find the latest fixture that has lineups for our club
    const fixtureWithLineup = allFixtures.find(
      (f: any) => f.lineups && f.lineups.some((l: any) => l.team.id === clubId),
    );

    if (!fixtureWithLineup) return { formationRows: [], fixtureData: null };

    const teamLineup = fixtureWithLineup.lineups.find(
      (l: any) => l.team.id === clubId,
    );
    const startXI = teamLineup?.startXI || [];

    // Group players by their grid row (e.g., "4:3:3" logic)
    const rows = startXI.reduce((acc: any, { player }: any) => {
      const [row] = player.grid ? player.grid.split(":").map(Number) : [0];
      if (!acc[row]) acc[row] = [];
      acc[row].push(player);
      return acc;
    }, {});

    const sortedRows = Object.keys(rows)
      .sort((a, b) => Number(b) - Number(a))
      .map((key) => rows[key]);

    return { formationRows: sortedRows, fixtureData: fixtureWithLineup };
  }, [allFixtures, clubId]);

  // 4. Loading Check
  const isLoading = !allFixtures;

  if (isLoading) {
    return (
      <CardContainer elevation={0}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Box>
            <Skeleton variant="text" width={140} height={40} />
            <Skeleton variant="text" width={100} height={20} />
          </Box>
          <Skeleton variant="rounded" width={120} height={36} />
        </Box>
        <Skeleton
          variant="rounded"
          height={450}
          width="100%"
          sx={{ borderRadius: "20px" }}
        />
      </CardContainer>
    );
  }

  return (
    <CardContainer elevation={0}>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Box>
          <Typography variant="h5" fontWeight={800}>
            Latest XI
          </Typography>
          <Typography variant="overline" color="primary.main" fontWeight={700}>
            Season Avg Ratings
          </Typography>
        </Box>

        <Button
          component={Link}
          href={`${activeGroup?.slug}/player-stats`}
          size="small"
          endIcon={<ArrowForwardIcon />}
          variant="contained"
          sx={{ borderRadius: 2 }}
        >
          View Squad
        </Button>
      </Box>

      {/* Pitch Visual */}
      <PitchContainer>
        {formationRows.length > 0 ? (
          formationRows.map((rowPlayers, rowIndex) => (
            <PlayerRow key={`row-${rowIndex}`}>
              {rowPlayers.map((player: any) => {
                const stats = playerStats?.[player.id];

                // Calculate Average from your specific store structure
                const playerRating =
                  stats?.totalRating && stats?.totalSubmits
                    ? (stats.totalRating / stats.totalSubmits).toFixed(1)
                    : "—";

                return (
                  <RatingLineupPlayer
                    key={player.id}
                    player={player}
                    playerRating={playerRating}
                  />
                );
              })}
            </PlayerRow>
          ))
        ) : (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            height="100%"
          >
            <Typography variant="h6" color="text.secondary">
              No Lineup Data
            </Typography>
            <Typography variant="caption" color="text.disabled">
              Check back after the next match
            </Typography>
          </Box>
        )}
      </PitchContainer>
    </CardContainer>
  );
}
