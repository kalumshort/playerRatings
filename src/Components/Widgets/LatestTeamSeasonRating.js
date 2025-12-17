import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Paper, Typography, Box, Button } from "@mui/material";
import { styled } from "@mui/material/styles";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward"; // Ensure @mui/icons-material is installed

import { selectPreviousFixtures } from "../../Selectors/fixturesSelectors";
import { selectAllPlayersSeasonOverallRating } from "../../Selectors/selectors";
import { Spinner } from "../../Containers/Helpers";
import useGroupData from "../../Hooks/useGroupsData";
import { RatingLineupPlayer } from "../Fixtures/Fixture-Components/PlayerRatings/RatingLineup";

// --- STYLED COMPONENTS ---

const CardContainer = styled(Paper)(({ theme }) => ({
  padding: "16px",
  marginBottom: "16px", // Spacing between components
  borderRadius: "12px",
  boxShadow: "none",
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
}));

const Header = styled(Box)({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "16px",
});

// A CSS-only Pitch representation
const PitchContainer = styled("div")(({ theme }) => ({
  borderRadius: "12px",
  padding: "20px 10px",
  minHeight: "420px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-around", // Distribute rows evenly
  position: "relative",
  overflow: "hidden",

  boxShadow: "inset 0 0 20px rgba(0,0,0,0.2)", // Inner shadow for depth
}));

const PlayerRow = styled("div")({
  display: "flex",
  justifyContent: "space-around", // Distribute players evenly in the row
  alignItems: "center",
  zIndex: 1, // Sit above pitch markings
});

const EmptyState = styled(Typography)(({ theme }) => ({
  textAlign: "center",
  color: theme.palette.text.secondary,
  padding: "40px 0",
  fontStyle: "italic",
}));

const StyledLink = styled(Link)({
  textDecoration: "none",
});

// --- COMPONENT ---

export default function LatestTeamSeasonRating() {
  const previousFixtures = useSelector(selectPreviousFixtures);
  const playerStats = useSelector(selectAllPlayersSeasonOverallRating);
  const { activeGroup } = useGroupData();

  // 1. MEMOIZATION: Logic to find the lineup and organize rows
  // This prevents recalculating the formation on every re-render/scroll
  const { formationRows, fixtureData } = useMemo(() => {
    if (!previousFixtures || !activeGroup)
      return { formationRows: [], fixtureData: null };

    const clubId = Number(activeGroup.groupClubId);

    // Find fixture
    const fixture = previousFixtures.find((f) =>
      f?.lineups?.some((team) => team.team.id === clubId)
    );

    if (!fixture) return { formationRows: [], fixtureData: null };

    // Get Lineup
    const lineup =
      fixture.lineups.find((team) => team.team.id === clubId)?.startXI || [];

    // Group by Grid Row (Standard format "3:1" -> Row 3, Col 1)
    const rows = lineup.reduce((acc, { player }) => {
      const [row] = player.grid ? player.grid.split(":").map(Number) : [0];
      if (!acc[row]) acc[row] = [];
      acc[row].push(player);
      return acc;
    }, {});

    // Convert object to array and reverse (Usually GK is Row 1, displayed at bottom)
    const sortedRows = Object.values(rows).reverse();

    return { formationRows: sortedRows, fixtureData: fixture };
  }, [previousFixtures, activeGroup]);

  // Loading State
  if (!playerStats && !previousFixtures) {
    return (
      <CardContainer>
        <Spinner />
      </CardContainer>
    );
  }

  return (
    <CardContainer elevation={0}>
      <Header>
        <Typography variant="h6" fontWeight="bold" className="globalHeading">
          Previous XI Avg. Rating
        </Typography>

        <StyledLink to="/season-stats">
          <Button
            size="small"
            endIcon={<ArrowForwardIcon fontSize="small" />}
            sx={{
              textTransform: "none",
              color: "text.secondary",
              fontWeight: 600,
            }}
          >
            Squad
          </Button>
        </StyledLink>
      </Header>

      <PitchContainer>
        {formationRows.length > 0 ? (
          formationRows.map((rowPlayers, rowIndex) => (
            <PlayerRow key={rowIndex}>
              {rowPlayers.map((player) => {
                // Calculate Average Rating safely
                const stats = playerStats?.[player.id];
                const playerRating =
                  stats?.totalRating && stats?.totalSubmits
                    ? stats.totalRating / stats.totalSubmits
                    : null;

                return (
                  // Assuming RatingLineupPlayer handles its own internal styling
                  // We just ensure it receives the correct data
                  <RatingLineupPlayer
                    key={player.id}
                    player={player}
                    fixture={fixtureData}
                    playerRating={playerRating ? playerRating.toFixed(2) : "na"}
                    // You might want to pass a prop to RatingLineupPlayer to style text white
                    // since it is now on a green background
                    isPitchView={true}
                  />
                );
              })}
            </PlayerRow>
          ))
        ) : (
          <EmptyState variant="body2">
            No previous lineup data available yet.
          </EmptyState>
        )}
      </PitchContainer>
    </CardContainer>
  );
}
