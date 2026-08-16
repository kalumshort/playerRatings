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
import { fetchPlayerRatingsAllMatches } from "@/lib/redux/actions/ratingsActions";
import { getRatingColor } from "@/lib/utils/football-logic";
import { useClubView } from "@/context/ClubViewProvider";
import { withSeasonParam } from "@/lib/config/season";

interface PlayerSeasonAverageListItemProps {
  playerId: string;
  clubSlug: any;
  globalRank: number;
  season?: string;
}

export default function PlayerSeasonAverageListItem({
  playerId,
  clubSlug,
  globalRank,
  season: seasonProp,
}: PlayerSeasonAverageListItemProps) {
  const theme = useTheme() as any;
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  // One scalar subscription instead of useGroupData()'s six — this component
  // renders once per leaderboard row (30+), and only the id is needed.
  const activeGroupId = useSelector((state: RootState) => {
    const id = state.groupData.activeGroupId;
    return id ? state.groupData.byGroupId[id]?.groupId : undefined;
  });

  const { season: contextSeason } = useClubView();
  // Prefer the server-resolved season: the context mirror lags a render, which
  // would fire a wasted current-season fetch on archived pages.
  const currentYear = seasonProp ?? contextSeason;

  // Depend on the id, not the group object. Depending on the object meant any
  // group-doc write changed its identity and re-dispatched this fetch for every
  // row on the leaderboard — 30+ redundant Firestore reads.
  useEffect(() => {
    if (playerId && activeGroupId) {
      dispatch(
        fetchPlayerRatingsAllMatches({
          playerId,
          groupId: activeGroupId,
          currentYear,
        }),
      );
    }
  }, [dispatch, playerId, activeGroupId, currentYear]);

  // 1. ATOMIC SELECTORS
  // We select the whole maps but immediately pluck the ID to minimize subscription overhead
  const playerStaticData = useSelector(
    (state: RootState) => selectSeasonSquadData(state)[playerId],
  );

  const playerStats = useSelector(
    (state: RootState) => selectAllPlayerOverallRatings(state)[playerId],
  );

  const allPlayerRatingsMatches = useSelector((state: RootState) =>
    selectPlayerRatingsById(state, playerId),
  );

  // 2. LOGIC
  const rating = useMemo(() => {
    if (!playerStats || playerStats.totalSubmits === 0) return 0;
    return playerStats.totalRating / playerStats.totalSubmits;
  }, [playerStats]);

  const playedMatchesCount = useMemo(() => {
    if (!allPlayerRatingsMatches) return 0;
    return Object.keys(allPlayerRatingsMatches.matches ?? {}).length;
  }, [allPlayerRatingsMatches]);

  // 3. RENDER GATING (Handle missing data gracefully)
  if (!playerStaticData)
    return (
      <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
    );

  const ratingColor = getRatingColor(rating);

  return (
    <Paper
      // Keyboard-reachable: this row was a Paper with a bare onClick.
      component="button"
      type="button"
      onClick={() =>
        router.push(
          withSeasonParam(`/${clubSlug}/players/${playerId}`, currentYear),
        )
      }
      aria-label={`View ${playerStaticData?.name ?? "player"} season stats`}
      sx={{
        py: { xs: 1.25, sm: 1.5 },
        pl: { xs: 1.25, sm: 1.5 },
        pr: { xs: 2, sm: 2.5 },
        display: "flex",
        alignItems: "center",
        gap: { xs: 1, sm: 1.5 },
        cursor: "pointer",
        // Undo UA button styling so the row renders as before.
        width: "100%",
        textAlign: "left",
        font: "inherit",
        color: "inherit",

        border: `1px solid ${ratingColor}!important`,
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
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        {rating > 0 ? rating.toFixed(1) : "-.-"}
      </Typography>
    </Paper>
  );
}
