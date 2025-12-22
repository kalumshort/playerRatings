import React from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Avatar,
  Divider,
  useTheme,
} from "@mui/material";
import { BarChart, Equalizer } from "@mui/icons-material";

// --- HELPERS ---
const parseValue = (val) => {
  if (typeof val === "string" && val.includes("%")) {
    return parseFloat(val);
  }
  return val ?? 0;
};

export default function Statistics({ fixture }) {
  const theme = useTheme();

  // --- EMPTY STATE ---
  if (!fixture.statistics || fixture.statistics.length !== 2) {
    return (
      <Paper
        sx={{
          p: 4,
          minHeight: 200,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          borderStyle: "dashed",
          borderColor: "divider",
          bgcolor: "transparent",
        }}
        elevation={0}
        className="containerMargin"
      >
        <Equalizer sx={{ fontSize: 40, color: "text.disabled", mb: 2 }} />
        <Typography variant="body1">
          No match statistics available yet.
        </Typography>
      </Paper>
    );
  }

  const [team1, team2] = fixture.statistics;

  return (
    <Paper
      sx={{
        p: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
      elevation={0}
      className="containerMargin"
    >
      {/* --- HEADER (Fixed) --- */}
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
          <BarChart color="primary" fontSize="small" />
          <Typography variant="caption">MATCH STATS</Typography>
        </Stack>
      </Box>

      {/* --- TEAM LEGEND (Fixed) --- */}
      <Box sx={{ p: 2, pb: 0 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          {/* Home Team */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <Avatar src={team1.team.logo} sx={{ width: 24, height: 24 }} />
            <Typography variant="caption" fontWeight="bold">
              {team1.team.name}
            </Typography>
          </Stack>

          {/* Away Team */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="caption" fontWeight="bold">
              {team2.team.name}
            </Typography>
            <Avatar src={team2.team.logo} sx={{ width: 24, height: 24 }} />
          </Stack>
        </Stack>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* --- SCROLLABLE STATS LIST --- */}
      <Box
        sx={{
          maxHeight: 400, // <--- FIXED HEIGHT
          overflowY: "auto", // <--- ENABLE SCROLL
          px: 3,
          pb: 4,
        }}
      >
        <Stack spacing={3}>
          {team1.statistics.map((stat, index) => {
            const team2Stat = team2.statistics.find(
              (s) => s.type === stat.type
            );
            const val1 = parseValue(stat.value);
            const val2 = parseValue(team2Stat?.value);
            const total = val1 + val2;
            const percent1 = total > 0 ? (val1 / total) * 100 : 50;

            return (
              <StatRow
                key={index}
                label={stat.type}
                value1={stat.value ?? 0}
                value2={team2Stat?.value ?? 0}
                percent1={percent1}
              />
            );
          })}
        </Stack>
      </Box>
    </Paper>
  );
}

// ... StatRow component remains the same ...
const StatRow = ({ label, value1, value2, percent1 }) => {
  const theme = useTheme();
  const val1Num = parseValue(value1);
  const val2Num = parseValue(value2);
  const isHomeWinner = val1Num > val2Num;
  const isAwayWinner = val2Num > val1Num;

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-end"
        sx={{ mb: 0.5 }}
      >
        <Typography
          variant="h5"
          sx={{
            color: isHomeWinner ? "primary.main" : "text.secondary",
          }}
        >
          {value1}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            textTransform: "uppercase",
            opacity: 0.7,
            mb: 0.5,
          }}
        >
          {label}
        </Typography>
        <Typography
          variant="h5"
          sx={{
            lineHeight: 0.8,
            color: isAwayWinner ? "text.primary" : "text.secondary",
          }}
        >
          {value2}
        </Typography>
      </Stack>
      <Box
        sx={{
          height: 6,
          width: "100%",
          bgcolor: theme.palette.divider,
          borderRadius: 4,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${percent1}%`,
            bgcolor: "primary.main",
            borderRight: `2px solid ${theme.palette.background.paper}`,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            left: `${percent1}%`,
            bgcolor: "text.disabled",
            opacity: 0.3,
          }}
        />
      </Box>
    </Box>
  );
};
