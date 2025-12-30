import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom"; // Added useParams
import { Paper, Typography, Box, Button, useTheme } from "@mui/material";
import { styled, alpha } from "@mui/material/styles";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import { selectPreviousFixtures } from "../../Selectors/fixturesSelectors";
import {
  selectAllPlayersSeasonOverallRating,
  selectPlayerRatingsLoad,
} from "../../Selectors/selectors";
import { Spinner } from "../../Containers/Helpers";
import { RatingLineupPlayer } from "../Fixtures/Fixture-Components/PlayerRatings/RatingLineup";
import { useAppPaths } from "../../Hooks/Helper_Functions";

import useGlobalData from "../../Hooks/useGlobalData";
import { fetchAllPlayersSeasonOverallRating } from "../../Hooks/Fixtures_Hooks";
import useGroupData from "../../Hooks/useGroupsData";

// --- STYLED COMPONENTS ---
const CardContainer = styled(Paper)(({ theme }) => ({
  padding: "20px",
}));

const PitchContainer = styled(Box)(({ theme }) => {
  const accent = theme.palette.primary.main;
  return {
    borderRadius: "16px",
    padding: "40px 10px",
    minHeight: "450px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    position: "relative",
    overflow: "hidden",
    background:
      theme.palette.mode === "dark"
        ? `linear-gradient(180deg, ${alpha("#0a2a12", 0.4)} 0%, ${alpha(
            "#051a0b",
            0.6
          )} 100%)`
        : `linear-gradient(180deg, ${alpha(accent, 0.1)} 0%, ${alpha(
            accent,
            0.05
          )} 100%)`,
    border: `1px solid ${alpha(accent, 0.2)}`,
    "&::before": {
      content: '""',
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: "120px",
      height: "120px",
      border: `1px solid ${alpha(accent, 0.3)}`,
      borderRadius: "50%",
      pointerEvents: "none",
    },
    "&::after": {
      content: '""',
      position: "absolute",
      top: "50%",
      left: 0,
      right: 0,
      height: "1px",
      backgroundColor: alpha(accent, 0.3),
      pointerEvents: "none",
    },
  };
});

const PlayerRow = styled(Box)({
  display: "flex",
  justifyContent: "space-around",
  alignItems: "center",
  zIndex: 2,
});

export default function LatestTeamSeasonRating() {
  const theme = useTheme();

  const previousFixtures = useSelector(selectPreviousFixtures);
  const playerStats = useSelector(selectAllPlayersSeasonOverallRating);
  const { getPath } = useAppPaths();
  const dispatch = useDispatch();

  const { currentGroup } = useGroupData();

  const globalData = useGlobalData();
  // 1. Identify current club from Slug

  const groupId = currentGroup?.groupClubId;

  const { playerSeasonOverallRatingsLoaded } = useSelector(
    selectPlayerRatingsLoad
  );

  useEffect(() => {
    if (!playerSeasonOverallRatingsLoaded) {
      dispatch(
        fetchAllPlayersSeasonOverallRating({
          groupId: groupId,
          currentYear: globalData.currentYear,
        })
      );
    }
  }, [
    dispatch,
    playerSeasonOverallRatingsLoaded,
    groupId,
    globalData.currentYear,
  ]);

  const { formationRows, fixtureData } = useMemo(() => {
    if (!previousFixtures || !groupId)
      return { formationRows: [], fixtureData: null };

    const clubId = Number(groupId);

    // Find the most recent fixture where this club had a lineup recorded
    const fixture = previousFixtures.find((f) =>
      f?.lineups?.some((team) => team.team.id === clubId)
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
  }, [previousFixtures, groupId]);

  if (!playerStats && !previousFixtures) {
    return (
      <CardContainer>
        <Spinner text="Loading Lineup..." />
      </CardContainer>
    );
  }

  return (
    <CardContainer elevation={0}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h5" sx={{ color: theme.palette.text.primary }}>
          Latest XI{" "}
          <span style={{ color: theme.palette.primary.main }}>Consensus</span>
        </Typography>

        <Button
          component={Link}
          to={getPath(`/season-stats`)} // Context-aware link
          size="small"
          endIcon={<ArrowForwardIcon />}
          sx={{
            color: "primary.main",
            "&:hover": {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
            },
          }}
        >
          Full Squad
        </Button>
      </Box>

      <PitchContainer>
        {formationRows.length > 0 ? (
          formationRows.map((rowPlayers, rowIndex) => (
            <PlayerRow key={rowIndex}>
              {rowPlayers.map((player) => {
                const stats = playerStats?.[player.id];
                const playerRating =
                  stats?.totalRating && stats?.totalSubmits
                    ? (stats.totalRating / stats.totalSubmits).toFixed(1)
                    : "N/A";

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
          <Typography
            variant="body2"
            sx={{ textAlign: "center", mt: 10, opacity: 0.6 }}
          >
            Waiting for matchday data...
          </Typography>
        )}
      </PitchContainer>
    </CardContainer>
  );
}
