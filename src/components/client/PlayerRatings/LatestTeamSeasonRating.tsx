"use client";

import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import Link from "next/link";
import { Paper, Typography, Box, Button, Skeleton } from "@mui/material";
import { styled, alpha } from "@mui/material/styles";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import { selectActiveClubFixtures } from "@/lib/redux/selectors/fixturesSelectors";
import { selectAllPlayerOverallRatings } from "@/lib/redux/selectors/ratingsSelectors";
import { RootState } from "@/lib/redux/store";
import RatingLineupPlayer from "./RatingLineupPlayer";

const CardContainer = styled(Paper)(({ theme }) => ({
  padding: 24,
  borderRadius: 24,
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  overflow: "hidden",
}));

const PitchContainer = styled(Box)(({ theme }) => {
  const accent = theme.palette.primary.main;
  return {
    borderRadius: 20,
    padding: "40px 10px",
    minHeight: 450,
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
      width: 120,
      height: 120,
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
      height: 2,
      backgroundColor: alpha(accent, 0.1),
      pointerEvents: "none",
    },
  };
});

const PlayerRow = styled(Box)({
  display: "flex",
  justifyContent: "space-around",
  alignItems: "center",
  position: "relative",
  zIndex: 2,
});

const formatRating = (totalRating?: number, totalSubmits?: number) =>
  totalRating && totalSubmits
    ? (totalRating / totalSubmits).toFixed(1)
    : "—";

const buildFormationRows = (players: any[]) => {
  const rows = players.reduce<Record<number, any[]>>((acc, { player }) => {
    const [row] = player.grid ? player.grid.split(":").map(Number) : [0];
    (acc[row] ||= []).push(player);
    return acc;
  }, {});

  return Object.keys(rows)
    .sort((a, b) => Number(b) - Number(a))
    .map((key) => rows[Number(key)]);
};

function LoadingSkeleton() {
  return (
    <CardContainer elevation={0}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Skeleton variant="text" width={140} height={40} />
          <Skeleton variant="text" width={100} height={20} />
        </Box>
        <Skeleton variant="rounded" width={120} height={36} />
      </Box>
      <Skeleton variant="rounded" height={450} width="100%" sx={{ borderRadius: "20px" }} />
    </CardContainer>
  );
}

function EmptyPitch() {
  return (
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
  );
}

export default function LatestTeamSeasonRating() {
  const activeGroup = useSelector((state: RootState) => {
    const id = state.groupData.activeGroupId;
    return id ? state.groupData.byGroupId[id] : null;
  });
  const clubId = Number(activeGroup?.groupClubId);

  const allFixtures = useSelector(selectActiveClubFixtures);
  const playerStats = useSelector(selectAllPlayerOverallRatings);

  const formationRows = useMemo(() => {
    if (!allFixtures || !clubId) return [];

    const fixture = allFixtures.find((f: any) =>
      f.lineups?.some((l: any) => l.team.id === clubId),
    );
    const startXI =
      fixture?.lineups.find((l: any) => l.team.id === clubId)?.startXI ?? [];

    return buildFormationRows(startXI);
  }, [allFixtures, clubId]);

  if (!allFixtures) return <LoadingSkeleton />;

  return (
    <CardContainer elevation={0}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
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

      <PitchContainer>
        {formationRows.length === 0 ? (
          <EmptyPitch />
        ) : (
          formationRows.map((rowPlayers, rowIndex) => (
            <PlayerRow key={`row-${rowIndex}`}>
              {rowPlayers.map((player: any) => {
                const stats = playerStats?.[player.id];
                return (
                  <RatingLineupPlayer
                    key={player.id}
                    player={player}
                    playerRating={formatRating(stats?.totalRating, stats?.totalSubmits)}
                  />
                );
              })}
            </PlayerRow>
          ))
        )}
      </PitchContainer>
    </CardContainer>
  );
}
