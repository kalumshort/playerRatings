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
import { GroupsRounded } from "@mui/icons-material"; // Rounded icon fits better

// --- SELECTORS & HOOKS ---
import { selectPredictionsByMatchId } from "../../../../Selectors/predictionsSelectors";
import { selectSquadDataObject } from "../../../../Selectors/squadDataSelectors";

export function CommunityTeamStats({ fixture }) {
  const theme = useTheme();

  // Data Selectors
  const matchPredictions = useSelector(selectPredictionsByMatchId(fixture.id));

  const squadData = useSelector((state) => selectSquadDataObject(state));

  const groupColour = theme.palette.primary.main;

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
      .sort((a, b) => b.percentage - a.percentage)
      .filter((item) => item.player);
  }, [matchPredictions, squadData]);

  if (stats.length === 0) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        // The Global "Clay Card" style is assumed on MuiPaper,
        // but we ensure no borders here:
        border: "none",
        background: theme.palette.background.paper,
        borderRadius: "24px",
        p: 3, // More breathing room
        margin: "0px",
      }}
    >
      {/* HEADER */}
      <Box
        sx={{
          mb: 3, // Spacing between header and list
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              p: 1,
              borderRadius: "12px",
              bgcolor: alpha(groupColour, 0.1),
              color: groupColour,
              display: "flex",
            }}
          >
            <GroupsRounded fontSize="small" />
          </Box>
          <Typography variant="h6" fontWeight={800} color="text.primary">
            Community XI
          </Typography>
        </Stack>

        <Box
          sx={{
            px: 2,
            py: 0.5,
            borderRadius: "20px",
            bgcolor: theme.palette.action.hover,
            fontWeight: 700,
            fontSize: "0.75rem",
            color: "text.secondary",
          }}
        >
          {matchPredictions.totalTeamSubmits} VOTES
        </Box>
      </Box>

      {/* STATS LIST */}
      <Box>
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

  // Logic: Top 11 get the "Starters" treatment (High visibility)
  const isStarter = rank <= 11;

  return (
    <Box
      sx={{
        position: "relative",
        p: 1.5,
        borderRadius: "16px",
        // Clay Logic:
        // Starters float (drop shadow), Bench players are flat/inset
        bgcolor: isStarter ? "background.paper" : "transparent",

        transition: "transform 0.2s",
        display: "flex",
        alignItems: "center",
        gap: 2,
        // Opacity drop for bench players to de-emphasize them
      }}
    >
      {/* 1. Rank & Avatar */}
      <Box sx={{ position: "relative" }}>
        <Avatar
          src={player.photo}
          alt={player.name}
          sx={{
            width: 48,
            height: 48,
            // White border makes it pop off the background
            border: `3px solid ${theme.palette.background.paper}`,
            boxShadow: theme.shadows[2],
          }}
        />

        {/* The Rank Badge (Little floating bubble) */}
        <Box
          sx={{
            position: "absolute",
            top: -2,
            left: -2,
            width: 22,
            height: 22,
            bgcolor: isStarter ? color : theme.palette.grey[400],
            color: "#fff", // White text is cleaner
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            fontSize: "0.7rem",
            fontWeight: "900",
            border: `2px solid ${theme.palette.background.paper}`,
            boxShadow: "2px 2px 4px rgba(0,0,0,0.15)",
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
          alignItems="center" // Align center better visually
          sx={{ mb: 0.5 }}
        >
          <Typography
            variant="body2"
            fontWeight={isStarter ? 800 : 600} // Bolder for starters
            noWrap
            sx={{ maxWidth: 120, color: "text.primary" }}
          >
            {player.name}
          </Typography>
          <Typography
            variant="caption"
            fontWeight={700}
            sx={{
              color: isStarter ? color : "text.secondary",
            }}
          >
            {percentage.toFixed(0)}%
          </Typography>
        </Stack>

        {/* The Clay Progress Bar */}
        <LinearProgress
          variant="determinate"
          value={percentage}
          sx={{
            height: 10, // Thicker, friendlier bar
            borderRadius: 5, // Fully rounded
            bgcolor:
              theme.palette.mode === "light" ? "#EEF0F5" : "rgba(0,0,0,0.2)",

            // The "Groove" Effect (Inset Shadow on the track)
            boxShadow:
              "inset 2px 2px 5px rgba(163, 177, 198, 0.4), inset -2px -2px 5px rgba(255, 255, 255, 0.5)",

            "& .MuiLinearProgress-bar": {
              bgcolor: isStarter ? color : theme.palette.grey[400],
              borderRadius: 5, // Round the actual bar too
              // Optional: Add a subtle gloss to the bar itself
              boxShadow: "none",
            },
          }}
        />
      </Box>
    </Box>
  );
};
