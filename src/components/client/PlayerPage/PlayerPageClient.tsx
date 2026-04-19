"use client";

import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Typography,
  Avatar,
  Stack,
  Grid,
  useTheme,
  Paper,
  alpha,
} from "@mui/material";
import { AnimatePresence } from "framer-motion";

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

  const { activeGroup } = useGroupData();

  const currentYear = "2025";

  // 2. FETCHING
  useEffect(() => {
    if (playerId && activeGroup?.groupId) {
      dispatch(
        fetchPlayerRatingsAllMatches({
          playerId,
          groupId: activeGroup?.groupId,
          currentYear,
        }),
      );
      dispatch(
        fetchAllPlayersSeasonOverallRating({
          groupId: activeGroup?.groupId,
          currentYear,
        }),
      );
    }
  }, [dispatch, playerId, activeGroup]);

  // 3. CALCS
  const seasonAverage = useMemo(() => {
    const overall = allPlayerRatings?.seasonOverall;
    if (!overall || !overall.totalSubmits) return 0;
    return overall.totalRating / overall.totalSubmits;
  }, [allPlayerRatings]);

  if (!playerData) return <PlayerPageSkeleton />;

  const ratingColor = getRatingColor(seasonAverage);

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
      <Grid container spacing={{ xs: 2, md: 3 }}>
        {/* PROFILE SIDEBAR */}
        <Grid size={{ xs: 12, md: 4, lg: 3 }}>
          <Box
            sx={{
              position: { md: "sticky" },
              top: { md: 100, lg: 120 },
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, md: 3 },
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                textAlign: "center",
              }}
            >
              <Avatar
                src={playerData.photo}
                alt={playerData.name}
                sx={{
                  width: { xs: 96, md: 112 },
                  height: { xs: 96, md: 112 },
                  mx: "auto",
                  mb: 2,
                }}
              />

              <Typography
                variant="h6"
                component="h1"
                fontWeight={700}
                sx={{ mb: 0.5, lineHeight: 1.2 }}
              >
                {playerData.name}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2.5 }}
              >
                {playerData.position} · #{playerData.number}
              </Typography>

              <Box
                sx={{
                  pt: 2,
                  borderTop: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Typography
                  variant="overline"
                  sx={{
                    display: "block",
                    color: "text.secondary",
                    letterSpacing: 1,
                    fontWeight: 700,
                    mb: 0.5,
                  }}
                >
                  Season rating
                </Typography>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    color: seasonAverage > 0 ? ratingColor : "text.disabled",
                    lineHeight: 1,
                  }}
                >
                  {seasonAverage > 0 ? seasonAverage.toFixed(1) : "-.-"}
                </Typography>
              </Box>
            </Paper>
          </Box>
        </Grid>

        {/* STATS STREAM */}
        <Grid size={{ xs: 12, md: 8, lg: 9 }}>
          <Stack spacing={3}>
            <Box>
              <SectionHeader title="Form trajectory" />
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  height: 320,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                }}
              >
                <PlayerRatingsLineGraph
                  allPlayerRatings={allPlayerRatings}
                  clubId={activeGroup?.groupClubId}
                />
              </Paper>
            </Box>

            <Box>
              <SectionHeader title="Match history" />
              <Stack spacing={1}>
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
                        clubId={activeGroup?.groupClubId}
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

function SectionHeader({ title }: { title: string }) {
  return (
    <Typography
      variant="overline"
      sx={{
        display: "block",
        mb: 1.5,
        pl: 0.5,
        color: "text.secondary",
        letterSpacing: 1,
        fontWeight: 700,
      }}
    >
      {title}
    </Typography>
  );
}
