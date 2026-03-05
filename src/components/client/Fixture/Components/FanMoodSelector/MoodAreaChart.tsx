"use client";

import React, { useMemo, useState } from "react";
import { Box, Typography, Stack, alpha, useTheme } from "@mui/material";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  YAxis,
  XAxis,
  ReferenceLine,
  Tooltip as RechartsTooltip,
} from "recharts";
import { getStatus, MOODS } from "./moodConfig";

interface MoodAreaChartProps {
  matchMoods: Record<string, Record<string, number>>;
}

export default function MoodAreaChart({ matchMoods }: MoodAreaChartProps) {
  const theme = useTheme();
  const [hoveredData, setHoveredData] = useState<any>(null);

  // 1. DATA PROCESSING
  // Converts Firestore { "10": { "happy": 5 } } -> [{ minute: 10, sentiment: 75 }]
  const chartData = useMemo(() => {
    if (!matchMoods) return [];

    return Object.keys(matchMoods)
      .map(Number)
      .filter((n) => !isNaN(n))
      .sort((a, b) => a - b)
      .map((minute) => {
        const bucket = matchMoods[String(minute)];
        let totalScore = 0;
        let totalVotes = 0;

        MOODS.forEach((m) => {
          const count = bucket[m.label] || 0;
          totalScore += count * m.weight;
          totalVotes += count;
        });

        return {
          minute,
          sentiment: totalVotes > 0 ? Math.round(totalScore / totalVotes) : 50,
          totalVotes,
        };
      });
  }, [matchMoods]);

  // Determine current active point (hovered or latest)
  const activePoint = hoveredData ||
    chartData[chartData.length - 1] || { sentiment: 50, minute: 0 };
  const status = getStatus(activePoint.sentiment);

  return (
    <Box sx={{ width: "100%", height: "100%", position: "relative", p: 3 }}>
      {/* --- FLOATING HEADER --- */}
      <Stack
        spacing={0.5}
        sx={{
          position: "absolute",
          top: 25,
          left: 25,
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <Typography
          variant="caption"
          sx={{ letterSpacing: 2, fontWeight: 900, opacity: 0.6 }}
        >
          {hoveredData
            ? `MINUTE ${hoveredData.minute}' REPORT`
            : "STADIUM ATMOSPHERE"}
        </Typography>

        <Stack direction="row" alignItems="baseline" spacing={1.5}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 900,
              color: status.color,
              transition: "color 0.3s ease",
            }}
          >
            {status.label}
          </Typography>
          <Typography
            variant="h5"
            sx={{ fontWeight: 800, color: status.color, opacity: 0.6 }}
          >
            {activePoint.sentiment}%
          </Typography>
        </Stack>
      </Stack>

      {/* --- THE CHART --- */}
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 100, right: 0, left: 0, bottom: 0 }}
          // THE FIX: Explicitly cast 's' to 'any' or check for the property
          onMouseMove={(s: any) => {
            if (s && s.activePayload && s.activePayload.length > 0) {
              const data = s.activePayload[0].payload;

              // Safety check to prevent infinite re-renders
              if (hoveredData?.minute !== data.minute) {
                setHoveredData(data);
              }
            }
          }}
          onMouseLeave={() => setHoveredData(null)}
        >
          <defs>
            <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={status.color} stopOpacity={0.4} />
              <stop offset="95%" stopColor={status.color} stopOpacity={0} />
            </linearGradient>
          </defs>

          <XAxis dataKey="minute" hide />
          <YAxis domain={[0, 100]} hide />

          {/* Neutral Baseline */}
          <ReferenceLine
            y={50}
            stroke={theme.palette.divider}
            strokeDasharray="5 5"
          />

          <Area
            type="monotone"
            dataKey="sentiment"
            stroke={status.color}
            strokeWidth={4}
            fill="url(#moodGradient)"
            animationDuration={1000}
          />

          <RechartsTooltip
            content={<CustomTooltip />}
            cursor={{
              stroke: status.color,
              strokeWidth: 2,
              strokeOpacity: 0.5,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
}

// --- SUB-COMPONENT: TOOLTIP ---
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const mood = getStatus(data.sentiment);

    return (
      <Box
        sx={{
          bgcolor: "background.paper",
          p: 1.5,
          borderRadius: "12px",
          boxShadow: 10,
          border: `2px solid ${mood.color}`,
          minWidth: 120,
        }}
      >
        <Typography
          variant="caption"
          sx={{ fontWeight: 900, display: "block", mb: 0.5 }}
        >
          {data.minute} MINS
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 800, color: mood.color }}>
          {mood.label} ({data.sentiment}%)
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.5 }}>
          {data.totalVotes} reactions
        </Typography>
      </Box>
    );
  }
  return null;
};
