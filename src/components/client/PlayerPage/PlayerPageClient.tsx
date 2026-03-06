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
  alpha,
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
          <Box
            sx={{
              position: { md: "sticky" },
              top: { md: 100, lg: 120 },
              zIndex: 10,
            }}
          >
            <Paper
              elevation={0}
              sx={{
                ...theme.clay?.card, // assuming you still have your clay base
                borderRadius: "28px",
                p: { xs: 3, md: 3.5 },
                textAlign: "center",
                position: "relative",
                overflow: "hidden",
                bgcolor: alpha(theme.palette.background.paper, 0.75),
                backdropFilter: "blur(16px)",
                border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                boxShadow: theme.shadows[6],
                transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                "&:hover": {
                  transform: "translateY(-8px)",
                  boxShadow: `0 24px 48px ${alpha(theme.palette.primary.main, 0.18)}`,
                },
              }}
            >
              {/* Optional subtle background gradient or pattern – can tie to team colors */}
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  background: `radial-gradient(circle at 30% 20%, ${alpha(
                    theme.palette.primary.main,
                    0.08,
                  )}, transparent 60%)`,
                  pointerEvents: "none",
                }}
              />

              <Avatar
                src={playerData.photo}
                sx={{
                  width: { xs: 120, md: 140, lg: 160 },
                  height: { xs: 120, md: 140, lg: 160 },
                  mx: "auto",
                  mb: 2.5,

                  transition: "transform 0.3s ease",
                  "&:hover": { transform: "scale(1.06)" },
                }}
              />

              <Typography
                variant="h4" // slightly bigger for impact
                component="h1"
                fontWeight={900}
                letterSpacing={0.5}
                sx={{
                  mb: 1.5,
                  background: `linear-gradient(90deg, ${theme.palette.text.primary}, ${alpha(
                    theme.palette.primary.main,
                    0.85,
                  )})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  textShadow: `0 2px 8px ${alpha("#000", 0.1)}`,
                }}
              >
                {playerData.name}
              </Typography>

              <Stack
                direction="row"
                spacing={1.5}
                justifyContent="center"
                sx={{ mb: 3, flexWrap: "wrap" }}
              >
                <Chip
                  icon={<SportsSoccerRounded fontSize="small" />}
                  label={playerData.position}
                  size="medium" // bigger touch target
                  color="primary"
                  sx={{
                    fontWeight: 800,
                    px: 2,
                    borderRadius: "16px",
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    color: theme.palette.primary.main,
                    "& .MuiChip-icon": { color: "inherit" },
                  }}
                />
                <Chip
                  label={`#${playerData.number}`}
                  size="medium"
                  variant="outlined"
                  sx={{
                    fontWeight: 800,
                    px: 2,
                    borderRadius: "16px",
                    borderColor: alpha(theme.palette.divider, 0.4),
                    color: theme.palette.text.primary,
                  }}
                />
              </Stack>

              <Divider
                sx={{
                  my: 2.5,
                  borderColor: alpha(theme.palette.divider, 0.18),
                }}
              />

              <Typography
                variant="caption"
                fontWeight={700}
                color="text.secondary"
                letterSpacing={1.2}
                sx={{ textTransform: "uppercase", mb: 1, display: "block" }}
              >
                Season Average Rating
              </Typography>

              <Box
                sx={{
                  position: "relative",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 140,
                  height: 140,
                  borderRadius: "50%",
                  background: `conic-gradient(${getRatingColor(
                    seasonAverage,
                  )} 0deg, ${alpha(getRatingColor(seasonAverage), 0.2)} 360deg)`,
                  p: "6px", // border thickness
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    bgcolor: theme.palette.background.paper,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: `inset 0 4px 12px ${alpha("#000", 0.08)}`,
                  }}
                >
                  <Typography
                    variant="h3"
                    component="div"
                    fontWeight={900}
                    sx={{
                      color: getRatingColor(seasonAverage),
                      lineHeight: 1,
                      textShadow: `0 2px 12px ${alpha(getRatingColor(seasonAverage), 0.4)}`,
                    }}
                  >
                    {seasonAverage.toFixed(1)}
                  </Typography>
                </Box>
              </Box>
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
