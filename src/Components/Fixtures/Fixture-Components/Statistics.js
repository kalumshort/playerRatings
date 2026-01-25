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
import { BarChartRounded, EqualizerRounded } from "@mui/icons-material"; // Rounded Icons

// --- CONFIGURATION ---
const STAT_GROUPS = {
  General: ["Ball Possession", "Corner Kicks", "Offsides"],
  Shooting: [
    "Total Shots",
    "Shots on Goal",
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

  // --- DATA PROCESSING ---
  const categorizedStats = useMemo(() => {
    if (!fixture.statistics || fixture.statistics.length !== 2) return null;
    const [team1Data, team2Data] = fixture.statistics;

    const findStatValue = (statsArray, typeName) => {
      const found = statsArray.find((s) => s.type === typeName);
      return found ? found.value : 0;
    };

    const groupedData = {};
    Object.entries(STAT_GROUPS).forEach(([category, statTypes]) => {
      const statsInGroup = statTypes.map((type) => {
        const val1 = findStatValue(team1Data.statistics, type);
        const val2 = findStatValue(team2Data.statistics, type);
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
        elevation={0}
        sx={(theme) => ({
          p: 4,
          minHeight: 200,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        })}
      >
        <EqualizerRounded
          sx={{ fontSize: 48, color: "text.disabled", mb: 2 }}
        />
        <Typography variant="body1" color="text.secondary" fontWeight="bold">
          No stats available yet.
        </Typography>
      </Paper>
    );
  }

  const { team1, team2, groupedData } = categorizedStats;

  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        width: "100%",
      })}
    >
      {/* --- HEADER --- */}
      <Box
        sx={{
          p: 2.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <BarChartRounded color="primary" />
        <Typography variant="h6" fontWeight={800} letterSpacing="-0.5px">
          MATCH STATS
        </Typography>
      </Box>

      {/* --- TEAM LEGEND --- */}
      <Box sx={{ px: 3, pt: 3, pb: 1 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          {/* Home Team */}
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar
              src={team1.logo}
              sx={{
                width: 40,
                height: 40,
                border: `3px solid ${theme.palette.background.default}`,
                boxShadow: theme.clay.card.boxShadow,
              }}
            />
            <Typography variant="subtitle2" fontWeight={800}>
              {team1.name}
            </Typography>
          </Stack>

          {/* Away Team */}
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Typography variant="subtitle2" fontWeight={800}>
              {team2.name}
            </Typography>
            <Avatar
              src={team2.logo}
              sx={{
                width: 40,
                height: 40,
                border: `3px solid ${theme.palette.background.default}`,
                boxShadow: theme.clay.card.boxShadow,
              }}
            />
          </Stack>
        </Stack>
      </Box>

      {/* --- SCROLLABLE STATS --- */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          px: 3,
          pb: 4,
          mt: 1,
        }}
      >
        <Stack spacing={4}>
          {Object.entries(groupedData).map(([category, stats]) => {
            if (stats.length === 0) return null;

            return (
              <Box key={category}>
                {/* CATEGORY TITLE */}
                <Box
                  sx={{ position: "relative", my: 2.5, textAlign: "center" }}
                >
                  <Divider
                    sx={{ position: "absolute", width: "100%", top: "50%" }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      position: "relative",
                      bgcolor: theme.palette.background.default, // Mask line
                      px: 2,
                      fontWeight: 800,
                      letterSpacing: 1.5,
                      color: "text.secondary",
                      textTransform: "uppercase",
                    }}
                  >
                    {category}
                  </Typography>
                </Box>

                {/* STAT ROWS */}
                <Stack spacing={2.5}>
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

// --- ROW COMPONENT (Clay Aesthetic) ---
const StatRow = ({ label, value1, value2, percent1 }) => {
  const theme = useTheme();
  const val1Num = parseValue(value1);
  const val2Num = parseValue(value2);

  const isHomeWinner = val1Num > val2Num;
  const isAwayWinner = val2Num > val1Num;

  return (
    <Box>
      {/* Labels & Numbers */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-end"
        sx={{ mb: 1 }}
      >
        <Typography
          variant="h6" // Standard font, bold
          sx={{
            lineHeight: 1,
            fontWeight: isHomeWinner ? 900 : 500,
            color: isHomeWinner ? "primary.main" : "text.secondary",
            fontSize: isHomeWinner ? "1.1rem" : "1rem",
            transition: "all 0.3s ease",
          }}
        >
          {value1}
        </Typography>

        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            color: "text.secondary",
            letterSpacing: 0.5,
            fontSize: "0.75rem",
          }}
        >
          {label}
        </Typography>

        <Typography
          variant="h6"
          sx={{
            lineHeight: 1,
            fontWeight: isAwayWinner ? 900 : 500,
            color: isAwayWinner ? "text.primary" : "text.secondary",
            fontSize: isAwayWinner ? "1.1rem" : "1rem",
            transition: "all 0.3s ease",
          }}
        >
          {value2}
        </Typography>
      </Stack>

      {/* CLAY PROGRESS BAR (Pressed Groove) */}
      <Box
        sx={(theme) => ({
          ...theme.clay.box, // The "Inset" Shadow
          height: 12, // Thicker bar
          width: "100%",
          borderRadius: "10px",
          position: "relative",
          overflow: "hidden",
          bgcolor: theme.palette.background.default, // Match base
        })}
      >
        {/* Home Team Bar (Left) */}
        <Box
          sx={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${percent1}%`,
            bgcolor: "primary.main", // Matcha Green
            borderRadius: "8px", // Soft pill shape inside
            boxShadow: "2px 0 5px rgba(0,0,0,0.1)", // Slight depth
            transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",

            // Separator Line
            borderRight: `4px solid ${theme.palette.background.default}`,
          }}
        />

        {/* Away Team Bar (Right) */}
        <Box
          sx={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            left: `${percent1}%`,
            bgcolor: theme.palette.mode === "light" ? "#E2E8F0" : "#4A5568", // Neutral Grey
            borderRadius: "8px",
            transition: "left 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </Box>
    </Box>
  );
};
