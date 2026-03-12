"use client";

import React, { useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Avatar,
  Divider,
  useTheme,
  alpha,
} from "@mui/material";
import { BarChartRounded, EqualizerRounded } from "@mui/icons-material";

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
const parseValue = (val: string | number | null): number => {
  if (typeof val === "string" && val.includes("%")) {
    return parseFloat(val);
  }
  return Number(val) ?? 0;
};

export default function Statistics({
  fixture,
  groupData,
  isGuestView,
}: {
  fixture: any;
  groupData: any;
  isGuestView: boolean;
}) {
  const theme = useTheme() as any;

  // 1. MEMOIZED DATA PROCESSING
  const categorizedStats = useMemo(() => {
    if (!fixture.statistics || fixture.statistics.length !== 2) return null;
    const [team1Data, team2Data] = fixture.statistics;

    const findStatValue = (statsArray: any[], typeName: string) => {
      const found = statsArray.find((s) => s.type === typeName);
      return found ? found.value : 0;
    };

    const groupedData: Record<string, any[]> = {};

    Object.entries(STAT_GROUPS).forEach(([category, statTypes]) => {
      groupedData[category] = statTypes.map((type) => ({
        label: type,
        val1: findStatValue(team1Data.statistics, type),
        val2: findStatValue(team2Data.statistics, type),
      }));
    });

    return {
      team1: team1Data.team,
      team2: team2Data.team,
      groupedData,
    };
  }, [fixture.statistics]);

  // 2. EMPTY STATE
  if (!categorizedStats) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 6,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          borderRadius: "24px",
        }}
      >
        <EqualizerRounded
          sx={{ fontSize: 48, color: "text.disabled", mb: 2 }}
        />
        <Typography variant="body1" color="text.secondary" fontWeight="bold">
          Stats will appear once the match starts.
        </Typography>
      </Paper>
    );
  }

  const { team1, team2, groupedData } = categorizedStats;

  return (
    <Paper
      elevation={0}
      sx={{
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        borderRadius: "24px",
      }}
    >
      {/* HEADER */}
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
        <Typography variant="h6" fontWeight={900}>
          MATCH ANALYTICS
        </Typography>
      </Box>

      {/* TEAM LEGEND */}
      <Box sx={{ px: 3, pt: 3, pb: 1 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <TeamLabel team={team1} theme={theme} />
          <Typography variant="caption" sx={{ fontWeight: 900, opacity: 0.4 }}>
            VS
          </Typography>
          <TeamLabel team={team2} theme={theme} reversed />
        </Stack>
      </Box>

      {/* STATS LIST */}
      <Box sx={{ flex: 1, px: 3, pb: 4, mt: 1 }}>
        {Object.entries(groupedData).map(([category, stats]) => (
          <Box key={category} sx={{ mb: 4 }}>
            <Box sx={{ position: "relative", my: 3, textAlign: "center" }}>
              <Divider
                sx={{ position: "absolute", width: "100%", top: "50%" }}
              />
              <Typography
                variant="caption"
                sx={{
                  position: "relative",
                  bgcolor: "background.paper",
                  px: 2,
                  fontWeight: 900,
                  color: "text.secondary",
                  textTransform: "uppercase",
                }}
              >
                {category}
              </Typography>
            </Box>

            <Stack spacing={3}>
              {stats.map((stat, index) => (
                <StatRow
                  key={index}
                  label={stat.label}
                  value1={stat.val1}
                  value2={stat.val2}
                />
              ))}
            </Stack>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}

// --- SUB-COMPONENTS ---

const TeamLabel = ({ team, theme, reversed = false }: any) => (
  <Stack
    direction={reversed ? "row-reverse" : "row"}
    alignItems="center"
    spacing={1.5}
  >
    <Avatar
      src={team.logo}
      sx={{
        width: 36,
        height: 36,
        bgcolor: "white",
        p: 0.5,
        boxShadow: theme.clay?.card?.boxShadow,
      }}
    />
    <Typography variant="subtitle2" fontWeight={800}>
      {team.name}
    </Typography>
  </Stack>
);

const StatRow = ({ label, value1, value2 }: any) => {
  const theme = useTheme() as any;
  const val1Num = parseValue(value1);
  const val2Num = parseValue(value2);
  const total = val1Num + val2Num;
  const percent1 = total > 0 ? (val1Num / total) * 100 : 50;

  const isHomeWinner = val1Num > val2Num;
  const isAwayWinner = val2Num > val1Num;

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-end"
        sx={{ mb: 1 }}
      >
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 900,
            color: isHomeWinner ? "primary.main" : "text.disabled",
          }}
        >
          {value1}
        </Typography>
        <Typography
          variant="caption"
          sx={{ fontWeight: 800, color: "text.secondary", opacity: 0.7 }}
        >
          {label.toUpperCase()}
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 900,
            color: isAwayWinner ? "text.primary" : "text.disabled",
          }}
        >
          {value2}
        </Typography>
      </Stack>

      <Box
        sx={{
          ...theme.clay?.box, // Inset shadow
          height: 10,
          width: "100%",
          borderRadius: "10px",
          position: "relative",
          overflow: "hidden",
          bgcolor: alpha(theme.palette.divider, 0.1),
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
            borderRadius: "10px",
            transition: "width 1s ease-in-out",
            borderRight: `2px solid ${theme.palette.background.paper}`,
          }}
        />
      </Box>
    </Box>
  );
};
