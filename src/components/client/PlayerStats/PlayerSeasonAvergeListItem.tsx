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

  return (
    <Paper
      onClick={() => router.push(`/${clubSlug}/players/${playerId}`)}
      sx={{
        p: 2,
        ...theme.clay?.card,
        display: "flex",
        alignItems: "center",
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: theme.shadows[4],
          bgcolor: alpha(theme.palette.primary.main, 0.02),
        },
      }}
    >
      {/* RANK */}
      <Typography
        variant="h6"
        sx={{
          width: 40,
          fontWeight: 900,
          color: "text.disabled",
        }}
      >
        #{globalRank}
      </Typography>

      {/* AVATAR */}
      <Avatar
        src={playerStaticData.photo}
        alt={playerStaticData.name}
        sx={{
          width: 48,
          height: 48,
          mr: 2,
          border: `2px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      />

      {/* INFO */}
      <Box flexGrow={1}>
        <Typography variant="subtitle1" fontWeight={700}>
          {playerStaticData.name}
        </Typography>

        <Typography variant="caption" color="text.secondary">
          Games Played: {playedMatchesCount}
        </Typography>
      </Box>

      {/* RATING BADGE */}
      <Box
        sx={{
          px: 1.5,
          py: 0.5,
          borderRadius: "8px",
          bgcolor: alpha(getRatingColor(rating), 0.1),
          color: getRatingColor(rating),
          border: `1px solid ${alpha(getRatingColor(rating), 0.2)}`,
          minWidth: "45px",
          textAlign: "center",
        }}
      >
        <Typography variant="subtitle2" fontWeight={800}>
          {rating > 0 ? rating.toFixed(1) : "-.-"}
        </Typography>
      </Box>
    </Paper>
  );
}
