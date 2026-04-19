"use client";

import React, { useMemo, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box,
  Typography,
  Avatar,
  Stack,
  Paper,
  useTheme,
  alpha,
  Skeleton,
} from "@mui/material";
import { TrendingUpRounded, TrendingDownRounded } from "@mui/icons-material";
import { useParams, useRouter } from "next/navigation";

import { RootState, AppDispatch } from "@/lib/redux/store";
import { selectPreviousFixtures } from "@/lib/redux/selectors/fixturesSelectors";
import { selectSeasonSquadData } from "@/lib/redux/selectors/squadSelectors";
import { selectAllMatchRatings } from "@/lib/redux/selectors/ratingsSelectors";
import { fetchMatchPlayerRatings } from "@/lib/redux/actions/ratingsActions";
import useGlobalData from "@/Hooks/useGlobalData";
import useGroupData from "@/Hooks/useGroupData";

const RECENT_MATCH_COUNT = 3;

interface PlayerForm {
  playerId: string;
  avgRating: number;
  matchesPlayed: number;
  name: string;
  photo: string;
}

export default function PlayerFormWidgets() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { clubSlug } = useParams();
  const { currentYear } = useGlobalData();
  const { activeGroupId } = useGroupData();

  const previousFixtures = useSelector(selectPreviousFixtures);
  const squadData = useSelector((state: RootState) =>
    selectSeasonSquadData(state),
  );
  const ratingsMap = useSelector(selectAllMatchRatings);

  const recentMatches = useMemo(() => {
    if (!previousFixtures?.length) return [];
    return [...previousFixtures]
      .sort((a, b) => b.fixture.timestamp - a.fixture.timestamp)
      .slice(0, RECENT_MATCH_COUNT);
  }, [previousFixtures]);

  useEffect(() => {
    if (!activeGroupId) return;
    recentMatches.forEach((match) => {
      const mId = String(match.fixture.id);
      if (!ratingsMap[mId]) {
        dispatch(
          fetchMatchPlayerRatings({
            matchId: mId,
            groupId: activeGroupId,
            currentYear,
          }),
        );
      }
    });
  }, [recentMatches, activeGroupId, currentYear, ratingsMap, dispatch]);

  const { hotPlayer, coldPlayer, isLoading } = useMemo(() => {
    if (!squadData || Object.keys(squadData).length === 0) {
      return { isLoading: true };
    }
    if (recentMatches.length === 0) return { isLoading: false };

    const loadedMatches = recentMatches.filter(
      (m) => ratingsMap[String(m.fixture.id)],
    );
    if (loadedMatches.length === 0) return { isLoading: true };

    const totals: Record<string, { total: number; count: number }> = {};

    loadedMatches.forEach((match) => {
      const matchData = ratingsMap[String(match.fixture.id)];
      if (!matchData?.players) return;

      Object.entries(matchData.players).forEach(
        ([playerId, pStats]: [string, any]) => {
          if (!squadData[playerId]) return;

          const totalRating = Number(pStats.totalRating) || 0;
          const totalSubmits = Number(pStats.totalSubmits) || 0;
          if (totalSubmits === 0) return;

          const rating = totalRating / totalSubmits;
          if (rating <= 0) return;

          if (!totals[playerId]) totals[playerId] = { total: 0, count: 0 };
          totals[playerId].total += rating;
          totals[playerId].count += 1;
        },
      );
    });

    // Consistency rule: must have played every recent match we have data for.
    const eligible = Object.entries(totals)
      .filter(([, s]) => s.count === loadedMatches.length)
      .map(([id, s]) => ({
        playerId: id,
        avgRating: s.total / s.count,
        matchesPlayed: s.count,
      }));

    if (eligible.length < 2) return { isLoading: false };

    eligible.sort((a, b) => b.avgRating - a.avgRating);

    const hydrate = (item: {
      playerId: string;
      avgRating: number;
      matchesPlayed: number;
    }): PlayerForm => ({
      ...item,
      name: squadData[item.playerId]?.name || "Unknown",
      photo: squadData[item.playerId]?.photo || "",
    });

    return {
      hotPlayer: hydrate(eligible[0]),
      coldPlayer: hydrate(eligible[eligible.length - 1]),
      isLoading: false,
    };
  }, [recentMatches, ratingsMap, squadData]);

  return (
    <Paper elevation={0} sx={{ p: 2 }}>
      <Typography
        variant="overline"
        sx={{
          display: "block",
          mb: 1.5,
          color: "text.secondary",
          letterSpacing: 1,
          fontWeight: 700,
        }}
      >
        Form · Last {RECENT_MATCH_COUNT} matches
      </Typography>

      {isLoading ? (
        <Stack direction="row" spacing={1.5}>
          <Skeleton variant="rounded" height={44} sx={{ flex: 1 }} />
          <Skeleton variant="rounded" height={44} sx={{ flex: 1 }} />
        </Stack>
      ) : !hotPlayer || !coldPlayer ? (
        <Typography variant="body2" color="text.secondary">
          Not enough recent data yet.
        </Typography>
      ) : (
        <Stack direction="row" spacing={1.5}>
          <FormCard
            variant="hot"
            player={hotPlayer}
            onClick={() =>
              router.push(`/${clubSlug}/players/${hotPlayer.playerId}`)
            }
          />
          <FormCard
            variant="cold"
            player={coldPlayer}
            onClick={() =>
              router.push(`/${clubSlug}/players/${coldPlayer.playerId}`)
            }
          />
        </Stack>
      )}
    </Paper>
  );
}

function FormCard({
  variant,
  player,
  onClick,
}: {
  variant: "hot" | "cold";
  player: PlayerForm;
  onClick: () => void;
}) {
  const theme = useTheme();
  const isHot = variant === "hot";
  const accent = isHot ? theme.palette.success.main : theme.palette.error.main;
  const Icon = isHot ? TrendingUpRounded : TrendingDownRounded;

  const lastName = player.name.split(" ").slice(-1)[0];

  return (
    <Box
      onClick={onClick}
      role="button"
      tabIndex={0}
      sx={{
        flex: 1,
        minWidth: 0,
        cursor: "pointer",
        px: 1,
        py: 0.75,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        borderLeft: `3px solid ${accent}`,
        display: "flex",
        alignItems: "center",
        gap: 1,
        transition: "border-color 120ms, background-color 120ms",
        "&:hover": {
          borderColor: alpha(accent, 0.5),
          borderLeftColor: accent,
          bgcolor: alpha(accent, 0.04),
        },
      }}
    >
      <Icon sx={{ fontSize: 16, color: accent, flexShrink: 0 }} />
      <Avatar
        src={player.photo}
        alt={player.name}
        sx={{ width: 28, height: 28, flexShrink: 0 }}
      />
      <Typography
        variant="body2"
        fontWeight={600}
        noWrap
        sx={{ flex: 1, minWidth: 0, fontSize: "0.8rem", lineHeight: 1.2 }}
      >
        {lastName}
      </Typography>
      <Typography
        sx={{
          fontWeight: 700,
          color: accent,
          lineHeight: 1,
          flexShrink: 0,
          fontSize: "0.95rem",
        }}
      >
        {player.avgRating.toFixed(1)}
      </Typography>
    </Box>
  );
}
