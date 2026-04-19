"use client";

import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import {
  Paper,
  Typography,
  Avatar,
  Box,
  alpha,
  useTheme,
  Skeleton,
} from "@mui/material";

// CUSTOM IMPORTS
import { AppDispatch, RootState } from "@/lib/redux/store";
import {
  selectAllPlayerOverallRatings,
  selectPlayerRatingsById,
} from "@/lib/redux/selectors/ratingsSelectors";
import { selectSeasonSquadData } from "@/lib/redux/selectors/squadSelectors";
import useGroupData from "@/Hooks/useGroupData";
import { fetchPlayerRatingsAllMatches } from "@/lib/redux/actions/ratingsActions";
import { getRatingColor } from "@/lib/utils/football-logic";

interface PlayerSeasonAverageListItemProps {
  playerId: string;
  clubSlug: any;
  globalRank: number;
}

export default function PlayerSeasonAverageListItem({
  playerId,
  clubSlug,
  globalRank,
}: PlayerSeasonAverageListItemProps) {
  const theme = useTheme() as any;
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const { activeGroup } = useGroupData();

  useEffect(() => {
    if (playerId && activeGroup?.groupId) {
      dispatch(
        fetchPlayerRatingsAllMatches({
          playerId,
          groupId: activeGroup?.groupId,
          currentYear: "2025",
        }),
      );
    }
  }, [dispatch, playerId, activeGroup]);

  // 1. ATOMIC SELECTORS
  // We select the whole maps but immediately pluck the ID to minimize subscription overhead
  const playerStaticData = useSelector(
    (state: RootState) => selectSeasonSquadData(state)[playerId],
  );

  const playerStats = useSelector(
    (state: RootState) => selectAllPlayerOverallRatings(state)[playerId],
  );

  const allPlayerRatingsMatches = useSelector((state: RootState) =>
    selectPlayerRatingsById(playerId)(state),
  );

  // 2. LOGIC
  const rating = useMemo(() => {
    if (!playerStats || playerStats.totalSubmits === 0) return 0;
    return playerStats.totalRating / playerStats.totalSubmits;
  }, [playerStats]);

  const playedMatchesCount = useMemo(() => {
    if (!allPlayerRatingsMatches) return 0;
    return Object.keys(allPlayerRatingsMatches.matches).length;
  }, [allPlayerRatingsMatches]);

  // 3. RENDER GATING (Handle missing data gracefully)
  if (!playerStaticData)
    return (
      <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
    );

  const ratingColor = getRatingColor(rating);

  return (
    <Paper
      elevation={0}
      onClick={() => router.push(`/${clubSlug}/players/${playerId}`)}
      sx={{
        py: { xs: 1.25, sm: 1.5 },
        pl: { xs: 1.25, sm: 1.5 },
        pr: { xs: 2, sm: 2.5 },
        display: "flex",
        alignItems: "center",
        gap: { xs: 1, sm: 1.5 },
        cursor: "pointer",
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        transition: "border-color 120ms, background-color 120ms",
        "&:hover": {
          borderColor: alpha(theme.palette.primary.main, 0.4),
          bgcolor: alpha(theme.palette.primary.main, 0.03),
        },
      }}
    >
      <Typography
        variant="caption"
        sx={{
          width: { xs: 24, sm: 28 },
          fontWeight: 700,
          color: "text.secondary",
          flexShrink: 0,
        }}
      >
        {globalRank}
      </Typography>

      <Avatar
        src={playerStaticData.photo}
        alt={playerStaticData.name}
        sx={{
          width: { xs: 36, sm: 40 },
          height: { xs: 36, sm: 40 },
          flexShrink: 0,
        }}
      />

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600} noWrap>
          {playerStaticData.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {playedMatchesCount} {playedMatchesCount === 1 ? "game" : "games"}
        </Typography>
      </Box>

      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: 700,
          color: rating > 0 ? ratingColor : "text.disabled",
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        {rating > 0 ? rating.toFixed(1) : "-.-"}
      </Typography>
    </Paper>
  );
}
