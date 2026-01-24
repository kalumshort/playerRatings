import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
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

import { selectPreviousFixtures } from "../../Selectors/fixturesSelectors";
import { selectAllPlayersSeasonOverallRating } from "../../Selectors/selectors";

import { RatingLineupPlayer } from "../Fixtures/Fixture-Components/PlayerRatings/RatingLineup";
import { useAppPaths } from "../../Hooks/Helper_Functions";
import useGlobalData from "../../Hooks/useGlobalData";
import { fetchAllPlayersSeasonOverallRating } from "../../Hooks/Fixtures_Hooks";
import useGroupData from "../../Hooks/useGroupsData";

// --- STYLED COMPONENTS (Glassified) ---
const CardContainer = styled(Paper)(({ theme }) => ({
  padding: "24px",
  borderRadius: "24px",
  overflow: "hidden",
  // Use clay card style if available in your theme, otherwise fallback
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

    border: `1px solid ${alpha(accent, 0.3)}`,
    boxShadow: `inset 0 0 20px ${alpha("#000", 0.3)}`,

    // Center Circle (Decoration)
    "&::before": {
      content: '""',
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: "120px",
      height: "120px",
      border: `2px solid ${alpha(accent, 0.2)}`,
      borderRadius: "50%",
      pointerEvents: "none",
    },
    // Halfway Line
    "&::after": {
      content: '""',
      position: "absolute",
      top: "50%",
      left: 0,
      right: 0,
      height: "2px",
      backgroundColor: alpha(accent, 0.2),
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
  const theme = useTheme();
  const dispatch = useDispatch();
  const { getPath } = useAppPaths();
  const globalData = useGlobalData();

  // 1. Get Context
  const { activeGroup } = useGroupData();
  const groupId = activeGroup?.groupId;
  const clubId = Number(activeGroup?.groupClubId);

  // 2. Selectors
  const previousFixtures = useSelector(selectPreviousFixtures);
  const playerStats = useSelector(selectAllPlayersSeasonOverallRating);

  // 3. Fetch Data
  useEffect(() => {
    const hasData = playerStats && Object.keys(playerStats).length > 0;
    if (groupId && !hasData) {
      dispatch(
        fetchAllPlayersSeasonOverallRating({
          groupId: groupId,
          currentYear: globalData.currentYear,
        }),
      );
    }
  }, [dispatch, groupId, globalData.currentYear, playerStats]);

  // 4. Compute Lineup Logic
  const { formationRows, fixtureData } = useMemo(() => {
    if (!previousFixtures || !clubId)
      return { formationRows: [], fixtureData: null };

    const fixture = previousFixtures.find((f) =>
      f?.lineups?.some((team) => team.team.id === clubId),
    );

    if (!fixture) return { formationRows: [], fixtureData: null };

    const lineup =
      fixture.lineups.find((team) => team.team.id === clubId)?.startXI || [];

    const rows = lineup.reduce((acc, { player }) => {
      const [row] = player.grid ? player.grid.split(":").map(Number) : [0];
      if (!acc[row]) acc[row] = [];
      acc[row].push(player);
      return acc;
    }, {});

    const sortedRows = Object.keys(rows)
      .sort((a, b) => b - a)
      .map((key) => rows[key]);

    return { formationRows: sortedRows, fixtureData: fixture };
  }, [previousFixtures, clubId]);

  // 5. LOADING STATE (Improved)
  // Show Skeleton if either Stats or Fixtures are missing
  const isLoading = !playerStats || !previousFixtures;

  if (isLoading) {
    return (
      <CardContainer elevation={0}>
        {/* Header Skeleton */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Box>
            <Skeleton variant="text" width={140} height={40} sx={{ mb: 0.5 }} />
            <Skeleton variant="text" width={100} height={20} />
          </Box>
          <Skeleton
            variant="rounded"
            width={120}
            height={36}
            sx={{ borderRadius: 2 }}
          />
        </Box>

        {/* Pitch Skeleton */}
        <Skeleton
          variant="rounded"
          height={450}
          width="100%"
          sx={{
            borderRadius: "20px",
            bgcolor: alpha(theme.palette.action.hover, 0.1),
          }}
        />
      </CardContainer>
    );
  }

  // 6. RENDER
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
          <Typography
            variant="h5"
            fontWeight={800}
            sx={{ color: theme.palette.text.primary }}
          >
            Latest XI
          </Typography>
          <Typography
            variant="overline"
            color="primary.main"
            fontWeight={700}
            letterSpacing={1.2}
          >
            Average Ratings
          </Typography>
        </Box>

        <Button
          component={Link}
          to={getPath(`/player-stats`)}
          size="small"
          endIcon={<ArrowForwardIcon />}
          variant="contained"
        >
          View Squad
        </Button>
      </Box>

      {/* Pitch Visual */}
      <PitchContainer>
        {formationRows.length > 0 ? (
          formationRows.map((rowPlayers, rowIndex) => (
            <PlayerRow key={rowIndex}>
              {rowPlayers.map((player) => {
                const stats = playerStats?.[player.id];

                const playerRating =
                  stats?.totalRating && stats?.totalSubmits
                    ? (stats.totalRating / stats.totalSubmits).toFixed(1)
                    : "—";

                return (
                  <RatingLineupPlayer
                    key={player.id}
                    player={player}
                    fixture={fixtureData}
                    playerRating={playerRating}
                    isPitchView={true}
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
              No Lineup Available
            </Typography>
            <Typography variant="caption" color="text.disabled">
              Wait for the next matchday update
            </Typography>
          </Box>
        )}
      </PitchContainer>
    </CardContainer>
  );
}
