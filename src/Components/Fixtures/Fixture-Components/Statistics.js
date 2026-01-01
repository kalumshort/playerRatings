import React, { useMemo } from "react";
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

// --- CONFIGURATION: Define Categories ---
const STAT_GROUPS = {
  General: ["Ball Possession", "Corner Kicks", "Offsides"],
  Shooting: [
    "Total Shots",
    "Shots on Goal",
    "Shots off Goal",
    "Blocked Shots",
    "Shots insidebox",
    "Shots outsidebox",
  ],
  Distribution: ["Total passes", "Passes accurate", "Passes %"],
  Defense: ["Goalkeeper Saves"],
  Discipline: ["Fouls", "Yellow Cards", "Red Cards"],
};

// --- HELPERS ---
const parseValue = (val) => {
  if (typeof val === "string" && val.includes("%")) {
    return parseFloat(val);
  }
  return val ?? 0;
};

export default function Statistics({ fixture }) {
  const theme = useTheme();

  // --- 1. MEMOIZED DATA PROCESSING ---
  const categorizedStats = useMemo(() => {
    if (!fixture.statistics || fixture.statistics.length !== 2) return null;

    const [team1Data, team2Data] = fixture.statistics;

    // Helper to find value by type name in a team's stats array
    const findStatValue = (statsArray, typeName) => {
      const found = statsArray.find((s) => s.type === typeName);
      return found ? found.value : 0;
    };

    // Build the object structure: { "Shooting": [{ label, val1, val2 }, ...], ... }
    const groupedData = {};

    Object.entries(STAT_GROUPS).forEach(([category, statTypes]) => {
      const statsInGroup = statTypes.map((type) => {
        // Check if this stat exists in the API response (some leagues omit data)
        const val1 = findStatValue(team1Data.statistics, type);
        const val2 = findStatValue(team2Data.statistics, type);

        // Only include if at least one team has data (prevents rows of 0 vs 0 if data missing)
        // However, for standard stats like Cards/Goals, 0 vs 0 is valid.
        // We'll include it to keep the UI consistent.
        return { label: type, val1, val2 };
      });

      groupedData[category] = statsInGroup;
    });

    return {
      team1: team1Data.team,
      team2: team2Data.team,
      groupedData,
    };
  }, [fixture.statistics]);

  // --- EMPTY STATE ---
  if (!categorizedStats) {
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
        <Typography variant="body1" color="text.secondary">
          No match statistics available yet.
        </Typography>
      </Paper>
    );
  }

  const { team1, team2, groupedData } = categorizedStats;

  return (
    <Paper
      sx={{
        p: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        // Glass effect handled by ThemeContext generally, but ensuring it here:
        background: theme.palette.background.paper,
        backdropFilter: "blur(20px)",
      }}
      elevation={0}
      className="containerMargin"
    >
      {/* --- HEADER --- */}
      <Box
        sx={{
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor:
            theme.palette.mode === "dark"
              ? "rgba(255,255,255,0.03)"
              : "rgba(0,0,0,0.02)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <BarChart color="primary" fontSize="small" />
          <Typography
            variant="h6"
            sx={{ fontSize: "0.9rem", letterSpacing: "1px" }}
          >
            MATCH STATS
          </Typography>
        </Stack>
      </Box>

      {/* --- TEAM LEGEND --- */}
      <Box sx={{ p: 2, pb: 0 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          {/* Home Team */}
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar src={team1.logo} sx={{ width: 32, height: 32 }} />
            <Typography variant="button" fontWeight="bold">
              {team1.name}
            </Typography>
          </Stack>

          {/* Away Team */}
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Typography variant="button" fontWeight="bold">
              {team2.name}
            </Typography>
            <Avatar src={team2.logo} sx={{ width: 32, height: 32 }} />
          </Stack>
        </Stack>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* --- SCROLLABLE STATS LIST --- */}
      <Box
        sx={{
          maxHeight: 500,
          overflowY: "auto",
          px: 3,
          pb: 4,
          // Custom scrollbar styling if needed
          "&::-webkit-scrollbar": { width: "4px" },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: theme.palette.divider,
            borderRadius: "4px",
          },
        }}
      >
        <Stack spacing={4}>
          {Object.entries(groupedData).map(([category, stats]) => {
            // Filter out empty groups if needed, usually we keep them for structure
            if (stats.length === 0) return null;

            return (
              <Box key={category}>
                {/* CATEGORY HEADER */}
                <Divider textAlign="center" sx={{ mb: 2, opacity: 0.6 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      textTransform: "uppercase",

                      letterSpacing: "0.1em",
                    }}
                  >
                    {category}
                  </Typography>
                </Divider>

                {/* STAT ROWS */}
                <Stack spacing={2}>
                  {stats.map((stat, index) => {
                    const val1Num = parseValue(stat.val1);
                    const val2Num = parseValue(stat.val2);
                    const total = val1Num + val2Num;
                    const percent1 = total > 0 ? (val1Num / total) * 100 : 50;

                    return (
                      <StatRow
                        key={`${category}-${index}`}
                        label={stat.label}
                        value1={stat.val1 ?? 0}
                        value2={stat.val2 ?? 0}
                        percent1={percent1}
                      />
                    );
                  })}
                </Stack>
              </Box>
            );
          })}
        </Stack>
      </Box>
    </Paper>
  );
}

// --- ROW COMPONENT (Unchanged logic, slight visual tweaks) ---
const StatRow = ({ label, value1, value2, percent1 }) => {
  const theme = useTheme();
  const val1Num = parseValue(value1);
  const val2Num = parseValue(value2);

  // Logic to highlight the "winner" of the stat
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
          variant="h5" // Using h5 (VT323 font from theme) for numbers
          sx={{
            color: isHomeWinner ? "primary.main" : "text.secondary",
            fontWeight: isHomeWinner ? 700 : 400,
            transition: "color 0.3s ease",
          }}
        >
          {value1}
        </Typography>

        <Typography
          variant="caption"
          sx={{
            textTransform: "uppercase",
            color: "text.secondary",
            fontSize: "0.7rem",
            mb: 0.5,
          }}
        >
          {label}
        </Typography>

        <Typography
          variant="h5"
          sx={{
            color: isAwayWinner ? "text.primary" : "text.secondary",
            fontWeight: isAwayWinner ? 700 : 400,
            transition: "color 0.3s ease",
          }}
        >
          {value2}
        </Typography>
      </Stack>

      {/* Progress Bar Container */}
      <Box
        sx={{
          height: 6,
          width: "100%",
          bgcolor: theme.palette.action.selected, // Slightly visible background
          borderRadius: 4,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Home Team Bar (Left) */}
        <Box
          sx={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${percent1}%`,
            bgcolor: "primary.main",
            boxShadow: `0 0 10px ${theme.palette.primary.main}`, // Add subtle neon glow
            borderRight: `2px solid ${theme.palette.background.paper}`,
            transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)", // Smooth animation on load
          }}
        />

        {/* Away Team Bar (Right - distinct color or faded primary) */}
        <Box
          sx={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            left: `${percent1}%`,
            bgcolor: theme.palette.mode === "dark" ? "#ffffff" : "#000000",
            opacity: 0.15,
            transition: "left 1s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </Box>
    </Box>
  );
};
