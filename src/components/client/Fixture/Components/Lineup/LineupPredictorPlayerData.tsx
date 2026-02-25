"use client";

import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Avatar,
  LinearProgress,
  useTheme,
  Grid,
  alpha,
} from "@mui/material";
import { GroupsRounded } from "@mui/icons-material";

// --- SELECTORS ---
import { RootState } from "@/lib/redux/store";
import { selectActiveSquadMapped } from "@/lib/redux/selectors/squadSelectors";

interface CommunityTeamStatsProps {
  fixture: any;
  groupData: any;
}

export function CommunityTeamStats({
  fixture,
  groupId,
  currentYear,
  groupData,
}: CommunityTeamStatsProps & { groupId: string; currentYear: string }) {
  const theme = useTheme() as any;

  const matchId = String(fixture.id);

  // 1. SELECTORS
  const matchPredictions = useSelector(
    (state: RootState) => state.predictions.byGroupId[groupId]?.[matchId],
  );

  const squadData = useSelector((state: RootState) =>
    selectActiveSquadMapped(state, groupData.groupClubId, currentYear),
  );

  const groupColour = theme.palette.primary.main;

  // 2. DATA PROCESSING
  const stats = useMemo(() => {
    const submits = matchPredictions?.totalPlayersSubmits;
    if (!submits) return [];

    const totalVotes = matchPredictions.totalTeamSubmits || 1;

    return Object.entries(submits)
      .map(([playerId, count]: [string, any]) => ({
        id: playerId,
        player: squadData[playerId],
        count,
        percentage: (count / totalVotes) * 100,
      }))
      .filter((item) => item.player) // Remove players not in current squad
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 18); // Show starters + main bench options
  }, [matchPredictions, squadData]);

  if (stats.length === 0) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        border: "none",
        borderRadius: "28px",
        p: { xs: 2, md: 3 },
        ...theme.clay?.card, // Apply global clay aesthetics
      }}
    >
      {/* HEADER */}
      <Box
        sx={{
          mb: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box
            sx={{
              p: 1.2,
              borderRadius: "14px",
              bgcolor: alpha(groupColour, 0.1),
              color: groupColour,
              display: "flex",
              boxShadow: `inset 0 0 0 1px ${alpha(groupColour, 0.2)}`,
            }}
          >
            <GroupsRounded />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={900} sx={{ lineHeight: 1.2 }}>
              Community XI
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={700}
            >
              Based on {matchPredictions.totalTeamSubmits} fan predictions
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* STATS LIST */}
      <Grid container spacing={1.5}>
        {stats.map((item, index) => (
          <Grid size={{ xs: 12, sm: 6 }} key={item.id}>
            <PlayerStatRow
              rank={index + 1}
              player={item.player}
              percentage={item.percentage}
              color={groupColour}
            />
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}

// --- SUB-COMPONENT: INDIVIDUAL ROW ---
const PlayerStatRow = ({ rank, player, percentage, color }: any) => {
  const theme = useTheme() as any;
  const isStarter = rank <= 11;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        p: 1.5,
        borderRadius: "20px",
        transition: "all 0.2s ease-in-out",
        bgcolor: isStarter ? alpha(color, 0.03) : "transparent",
        border: isStarter
          ? `1px solid ${alpha(color, 0.08)}`
          : "1px solid transparent",
        "&:hover": {
          bgcolor: alpha(color, 0.05),
          transform: "translateX(4px)",
        },
      }}
    >
      {/* 1. Avatar & Rank Badge */}
      <Box sx={{ position: "relative" }}>
        <Avatar
          src={player.photo}
          sx={{
            width: 44,
            height: 44,
            border: `2px solid ${theme.palette.background.paper}`,
            boxShadow: theme.shadows[1],
          }}
        />
        <Box
          sx={{
            position: "absolute",
            top: -4,
            left: -4,
            minWidth: 20,
            height: 20,
            px: 0.5,
            bgcolor: isStarter ? color : "grey.400",
            color: "#fff",
            borderRadius: "10px",
            display: "grid",
            placeItems: "center",
            fontSize: "0.65rem",
            fontWeight: 900,
            border: `2px solid ${theme.palette.background.paper}`,
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          {rank}
        </Box>
      </Box>

      {/* 2. Name & Progress */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-end"
          sx={{ mb: 0.5 }}
        >
          <Typography
            variant="body2"
            fontWeight={800}
            noWrap
            sx={{ color: "text.primary", fontSize: "0.85rem" }}
          >
            {player.name}
          </Typography>
          <Typography
            variant="caption"
            fontWeight={900}
            sx={{
              color: isStarter ? color : "text.secondary",
              fontSize: "0.75rem",
            }}
          >
            {Math.round(percentage)}%
          </Typography>
        </Stack>

        <LinearProgress
          variant="determinate"
          value={percentage}
          sx={{
            height: 6,
            borderRadius: 3,
            bgcolor: alpha(theme.palette.divider, 0.1),
            "& .MuiLinearProgress-bar": {
              borderRadius: 3,
              bgcolor: isStarter ? color : "grey.300",
            },
          }}
        />
      </Box>
    </Box>
  );
};
