"use client";

import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Typography,
  Avatar,
  Chip,
  Stack,
  Grid,
  useTheme,
  Paper,
  Divider,
  Skeleton,
} from "@mui/material";
import {
  TrendingUpRounded,
  HistoryRounded,
  SportsSoccerRounded,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";

// CUSTOM IMPORTS
import { RootState, AppDispatch } from "@/lib/redux/store";

import {
  fetchPlayerRatingsAllMatches,
  fetchAllPlayersSeasonOverallRating,
} from "@/lib/redux/actions/ratingsActions";

import PlayerMatchRow from "./PlayerMatchRow";
import PlayerPageSkeleton from "./PlayerPageSkeleton";
import useGroupData from "@/Hooks/useGroupData";
import { selectPreviousFixtures } from "@/lib/redux/selectors/fixturesSelectors";
import { selectPlayerRatingsById } from "@/lib/redux/selectors/ratingsSelectors";
import { selectSeasonSquadData } from "@/lib/redux/selectors/squadSelectors";
import PlayerRatingsLineGraph from "./PlayerPageRatingsGraph";
import { getRatingColor } from "@/lib/utils/football-logic";

export default function PlayerPageClient({ playerId }: { playerId: string }) {
  const theme = useTheme() as any;
  const dispatch = useDispatch<AppDispatch>();

  // 1. DATA SELECTORS
  const squadData = useSelector((state: RootState) =>
    selectSeasonSquadData(state),
  );
  const playerData = squadData?.[playerId];
  const allPlayerRatings = useSelector((state: RootState) =>
    selectPlayerRatingsById(playerId)(state),
  );
  const previousFixtures = useSelector(selectPreviousFixtures);

  const { activeGroup: group } = useGroupData();

  const currentYear = "2025";

  // 2. FETCHING
  useEffect(() => {
    if (playerId && group?.id) {
      dispatch(
        fetchPlayerRatingsAllMatches({
          playerId,
          groupId: group.id,
          currentYear,
        }),
      );
      dispatch(
        fetchAllPlayersSeasonOverallRating({ groupId: group.id, currentYear }),
      );
    }
  }, [dispatch, playerId, group?.id]);

  // 3. CALCS
  const seasonAverage = useMemo(() => {
    const overall = allPlayerRatings?.seasonOverall;
    if (!overall || !overall.totalSubmits) return 0;
    return overall.totalRating / overall.totalSubmits;
  }, [allPlayerRatings]);

  if (!playerData) return <PlayerPageSkeleton />;

  return (
    <Box
      sx={{
        maxWidth: "1200px",
        mx: "auto",
        pb: 10,
        px: { xs: 2, md: 4 },
        pt: 2,
      }}
    >
      <Grid container spacing={4}>
        {/* PROFILE SIDEBAR */}
        <Grid size={{ xs: 12, md: 4, lg: 3 }}>
          <Box sx={{ position: { md: "sticky" }, top: 100 }}>
            <Paper
              elevation={0}
              sx={{
                ...theme.clay?.card,
                p: 3,
                textAlign: "center",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Avatar
                src={playerData.photo}
                sx={{
                  width: 140,
                  height: 140,
                  mx: "auto",
                  mb: 2,
                  border: `6px solid ${theme.palette.background.paper}`,
                  boxShadow: theme.shadows[4],
                }}
              />
              <Typography variant="h5" fontWeight={900}>
                {playerData.name}
              </Typography>
              <Stack direction="row" spacing={1} justifyContent="center" my={2}>
                <Chip
                  icon={<SportsSoccerRounded />}
                  label={playerData.position}
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
                <Chip
                  label={`#${playerData.number}`}
                  variant="outlined"
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Typography
                variant="caption"
                fontWeight={800}
                color="text.secondary"
              >
                SEASON AVG
              </Typography>
              <Typography
                variant="h2"
                sx={{
                  bgcolor: getRatingColor(seasonAverage),
                  px: 1.5,
                  py: 0.5,
                  borderRadius: "8px",
                  fontWeight: 900,
                  maxWidth: "200px",
                  margin: "auto",
                }}
              >
                {seasonAverage.toFixed(1)}
              </Typography>
            </Paper>
          </Box>
        </Grid>

        {/* STATS STREAM */}
        <Grid size={{ xs: 12, md: 8, lg: 9 }}>
          <Stack spacing={4}>
            {/* GRAPH */}
            <Box>
              <SectionHeader
                icon={<TrendingUpRounded />}
                title="Form Trajectory"
              />
              <Paper sx={{ ...theme.clay?.card, p: 3, height: 350 }}>
                <PlayerRatingsLineGraph
                  allPlayerRatings={allPlayerRatings}
                  clubId={group?.groupClubId}
                />
              </Paper>
            </Box>

            {/* MATCH HISTORY */}
            <Box>
              <SectionHeader icon={<HistoryRounded />} title="Match History" />
              <Stack spacing={1.5}>
                <AnimatePresence>
                  {previousFixtures.map((fixture, index) => {
                    const matchRating = allPlayerRatings?.matches?.[fixture.id];
                    if (!matchRating) return null;
                    return (
                      <PlayerMatchRow
                        key={fixture.id}
                        fixture={fixture}
                        ratingData={matchRating}
                        index={index}
                        playerId={playerId}
                        clubId={group?.groupClubId}
                      />
                    );
                  })}
                </AnimatePresence>
              </Stack>
            </Box>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}

const SectionHeader = ({ icon, title }: any) => (
  <Stack direction="row" spacing={1} alignItems="center" mb={2} pl={1}>
    {React.cloneElement(icon, { color: "action" })}
    <Typography variant="h6" fontWeight={800}>
      {title}
    </Typography>
  </Stack>
);
