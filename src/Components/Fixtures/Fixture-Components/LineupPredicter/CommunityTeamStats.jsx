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
} from "@mui/material";
import { Groups } from "@mui/icons-material";

// --- SELECTORS & HOOKS ---
import { selectPredictionsByMatchId } from "../../../../Selectors/predictionsSelectors";
import { selectSquadDataObject } from "../../../../Selectors/squadDataSelectors";
import useGroupData from "../../../../Hooks/useGroupsData";

export function CommunityTeamStats({ fixture }) {
  const theme = useTheme();

  // Data Selectors
  const matchPredictions = useSelector(selectPredictionsByMatchId(fixture.id));
  const squadData = useSelector(selectSquadDataObject);
  const { activeGroup } = useGroupData();
  const groupColour = activeGroup?.accentColor || "#DA291C";

  // --- DATA PROCESSING ---
  const stats = useMemo(() => {
    if (!matchPredictions?.totalPlayersSubmits) return [];

    const totalVotes = matchPredictions.totalTeamSubmits || 1;

    return Object.entries(matchPredictions.totalPlayersSubmits)
      .map(([playerId, count]) => ({
        id: playerId,
        player: squadData[playerId],
        count,
        percentage: (count / totalVotes) * 100,
      }))
      .sort((a, b) => b.percentage - a.percentage) // Sort highest % first
      .filter((item) => item.player); // Filter out unknown players
  }, [matchPredictions, squadData]);

  if (stats.length === 0) return null;

  return (
    <Paper sx={{ p: 0, mt: 4, overflow: "hidden" }} elevation={0}>
      {/* HEADER */}
      <Box
        sx={{
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.action.hover,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Groups fontSize="small" color="primary" />
          <Typography
            variant="caption"
            sx={{
              fontFamily: "Space Mono",
              fontWeight: "bold",
              letterSpacing: 1,
            }}
          >
            COMMUNITY XI SELECTION
          </Typography>
        </Stack>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontFamily: "Space Mono" }}
        >
          {matchPredictions.totalTeamSubmits} SUBMISSIONS
        </Typography>
      </Box>

      {/* STATS LIST */}
      <Box sx={{ p: 2 }}>
        <Grid container spacing={2}>
          {stats.map((item, index) => (
            <Grid item xs={12} sm={6} key={item.id}>
              <PlayerStatRow
                rank={index + 1}
                player={item.player}
                percentage={item.percentage}
                color={groupColour}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Paper>
  );
}

// --- SUB-COMPONENT: INDIVIDUAL ROW ---
const PlayerStatRow = ({ rank, player, percentage, color }) => {
  const theme = useTheme();

  // Highlight top 11 players (Starters)
  const isStarter = rank <= 11;

  return (
    <Box
      sx={{
        position: "relative",
        p: 1.5,
        borderRadius: 2,
        border: `1px solid ${
          isStarter ? theme.palette.divider : "transparent"
        }`,
        bgcolor: isStarter ? "background.paper" : "transparent",
        display: "flex",
        alignItems: "center",
        gap: 2,
      }}
    >
      {/* 1. Rank & Avatar */}
      <Box sx={{ position: "relative" }}>
        <Avatar
          src={player.photo}
          alt={player.name}
          sx={{
            width: 40,
            height: 40,
            border: `2px solid ${theme.palette.background.paper}`,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            top: -5,
            left: -5,
            width: 20,
            height: 20,
            bgcolor: isStarter ? color : theme.palette.action.disabled,
            color: "#000",
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            fontSize: "0.65rem",
            fontWeight: "bold",
            border: `2px solid ${theme.palette.background.paper}`,
          }}
        >
          {rank}
        </Box>
      </Box>

      {/* 2. Name & Bar */}
      <Box sx={{ flex: 1 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="baseline"
          sx={{ mb: 0.5 }}
        >
          <Typography
            variant="body2"
            fontWeight="bold"
            noWrap
            sx={{ maxWidth: 120 }}
          >
            {player.name}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontFamily: "Space Mono",
              fontWeight: "bold",
              color: isStarter ? color : "text.secondary",
            }}
          >
            {percentage.toFixed(0)}%
          </Typography>
        </Stack>

        <LinearProgress
          variant="determinate"
          value={percentage}
          sx={{
            height: 6,
            borderRadius: 4,
            bgcolor: theme.palette.action.selected,
            "& .MuiLinearProgress-bar": {
              bgcolor: isStarter ? color : theme.palette.text.disabled,
              borderRadius: 4,
            },
          }}
        />
      </Box>
    </Box>
  );
};
