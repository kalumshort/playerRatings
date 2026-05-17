"use client";

import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Stack,
  Chip,
  Avatar,
  alpha,
  useTheme,
} from "@mui/material";
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
  events?: any[];
}

const eventEmoji = (event: any) => {
  if (event.type === "Goal") return "⚽";
  if (event.type === "Card")
    return event.detail?.includes("Yellow") ? "🟨" : "🟥";
  if (event.type === "subst") return "🔄";
  return "•";
};

const eventLabel = (event: any) => {
  if (event.type === "Goal") return `GOAL — ${event.player?.name ?? ""}`;
  if (event.type === "Card") {
    const color = event.detail?.includes("Yellow") ? "Yellow" : "Red";
    return `${color} card — ${event.player?.name ?? ""}`;
  }
  if (event.type === "subst")
    return `Sub — ${event.assist?.name ?? ""} on, ${event.player?.name ?? ""} off`;
  return event.detail ?? event.type;
};

export default function MoodAreaChart({
  matchMoods,
  events = [],
}: MoodAreaChartProps) {
  const theme = useTheme();
  const [hoveredData, setHoveredData] = useState<any>(null);

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
        const moodCounts: Record<string, number> = {};

        MOODS.forEach((m) => {
          const count = bucket[m.label] || 0;
          totalScore += count * m.weight;
          totalVotes += count;
          moodCounts[m.label] = count;
        });

        const dominant =
          totalVotes > 0
            ? MOODS.reduce((best, m) =>
                (moodCounts[m.label] || 0) > (moodCounts[best.label] || 0)
                  ? m
                  : best,
              )
            : null;

        return {
          minute,
          sentiment: totalVotes > 0 ? Math.round(totalScore / totalVotes) : 50,
          totalVotes,
          moodCounts,
          dominantEmoji: dominant?.emoji ?? "—",
        };
      });
  }, [matchMoods]);

  const eventMarkers = useMemo(() => {
    if (!events) return [];
    return events
      .filter((e) => e?.time?.elapsed != null)
      .map((e) => ({
        minute: (e.time.elapsed || 0) + (e.time.extra || 0),
        emoji: eventEmoji(e),
        label: eventLabel(e),
        teamLogo: e.team?.logo,
        type: e.type,
      }));
  }, [events]);

  const maxMinute = useMemo(() => {
    const moodMax = chartData.length
      ? chartData[chartData.length - 1].minute
      : 0;
    const eventMax = eventMarkers.length
      ? Math.max(...eventMarkers.map((e) => e.minute))
      : 0;
    return Math.max(90, moodMax, eventMax);
  }, [chartData, eventMarkers]);

  const activePoint =
    hoveredData ||
    chartData[chartData.length - 1] || {
      sentiment: 50,
      minute: 0,
      totalVotes: 0,
      moodCounts: {},
      dominantEmoji: "—",
    };
  const status = getStatus(activePoint.sentiment);

  const nearbyEvent = eventMarkers.find(
    (e) => Math.abs(e.minute - activePoint.minute) <= 1,
  );

  return (
    <Box sx={{ width: "100%", height: "100%", position: "relative", p: 3 }}>
      {/* HEADER */}
      <Stack
        spacing={0.75}
        sx={{
          position: "absolute",
          top: 20,
          left: 25,
          right: 25,
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

        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              fontSize: "2.25rem",
              lineHeight: 1,
              filter: activePoint.totalVotes === 0 ? "grayscale(1)" : "none",
            }}
          >
            {activePoint.dominantEmoji}
          </Box>
          <Stack spacing={0.25}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 900,
                color: status.color,
                lineHeight: 1,
                transition: "color 0.3s ease",
              }}
            >
              {status.label}
            </Typography>
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, color: "text.secondary" }}
            >
              {activePoint.sentiment}% • {activePoint.totalVotes}{" "}
              {activePoint.totalVotes === 1 ? "vote" : "votes"}
            </Typography>
          </Stack>
        </Stack>

        {nearbyEvent && (
          <Chip
            size="small"
            avatar={
              nearbyEvent.teamLogo ? (
                <Avatar src={nearbyEvent.teamLogo} />
              ) : undefined
            }
            label={`${nearbyEvent.emoji} ${nearbyEvent.label}`}
            sx={{
              alignSelf: "flex-start",
              fontWeight: 700,
              bgcolor: alpha(status.color, 0.15),
              border: `1px solid ${alpha(status.color, 0.35)}`,
              maxWidth: "100%",
              "& .MuiChip-label": {
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              },
            }}
          />
        )}
      </Stack>

      {/* MOOD DISTRIBUTION BAR */}
      {activePoint.totalVotes > 0 && (
        <Box
          sx={{
            position: "absolute",
            bottom: 14,
            left: 25,
            right: 25,
            zIndex: 10,
            pointerEvents: "none",
          }}
        >
          <Stack
            direction="row"
            sx={{
              height: 6,
              borderRadius: 3,
              overflow: "hidden",
              border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
            }}
          >
            {MOODS.map((m) => {
              const count = activePoint.moodCounts?.[m.label] || 0;
              const pct = (count / activePoint.totalVotes) * 100;
              if (pct === 0) return null;
              return (
                <Box
                  key={m.label}
                  sx={{
                    width: `${pct}%`,
                    bgcolor: m.color,
                    transition: "width 0.3s ease",
                  }}
                  title={`${m.emoji} ${m.label} ${Math.round(pct)}%`}
                />
              );
            })}
          </Stack>
          <Stack
            direction="row"
            spacing={1}
            justifyContent="center"
            sx={{ mt: 0.5, opacity: 0.8 }}
          >
            {MOODS.map((m) => {
              const count = activePoint.moodCounts?.[m.label] || 0;
              if (count === 0) return null;
              return (
                <Typography
                  key={m.label}
                  variant="caption"
                  sx={{ fontSize: "0.7rem", fontWeight: 700 }}
                >
                  {m.emoji} {count}
                </Typography>
              );
            })}
          </Stack>
        </Box>
      )}

      {/* CHART */}
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 130, right: 12, left: 12, bottom: 48 }}
          onMouseMove={(s: any) => {
            if (s && s.activePayload && s.activePayload.length > 0) {
              const data = s.activePayload[0].payload;
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

          <XAxis
            dataKey="minute"
            type="number"
            domain={[0, maxMinute]}
            hide
          />
          <YAxis domain={[0, 100]} hide />

          {/* Neutral baseline */}
          <ReferenceLine
            y={50}
            stroke={theme.palette.divider}
            strokeDasharray="5 5"
          />

          {/* Half-time marker */}
          {maxMinute >= 45 && (
            <ReferenceLine
              x={45}
              stroke={alpha(theme.palette.text.primary, 0.15)}
              strokeDasharray="3 6"
              label={{
                value: "HT",
                position: "insideTopRight",
                fill: theme.palette.text.secondary,
                fontSize: 9,
                fontWeight: 800,
                offset: 4,
              }}
            />
          )}

          {/* Event markers */}
          {eventMarkers.map((ev, idx) => (
            <ReferenceLine
              key={`ev-${idx}-${ev.minute}-${ev.type}`}
              x={ev.minute}
              stroke={alpha(theme.palette.text.primary, 0.25)}
              strokeDasharray="2 4"
              label={{
                value: ev.emoji,
                position: "top",
                fill: theme.palette.text.primary,
                fontSize: 16,
                offset: 6,
              }}
            />
          ))}

          <Area
            type="monotone"
            dataKey="sentiment"
            stroke={status.color}
            strokeWidth={4}
            fill="url(#moodGradient)"
            animationDuration={1000}
            isAnimationActive
          />

          <RechartsTooltip
            content={<CustomTooltip eventMarkers={eventMarkers} />}
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

const CustomTooltip = ({ active, payload, eventMarkers = [] }: any) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const mood = getStatus(data.sentiment);
  const nearby = eventMarkers.filter(
    (e: any) => Math.abs(e.minute - data.minute) <= 1,
  );

  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        p: 1.5,
        borderRadius: "12px",
        boxShadow: 10,
        border: `2px solid ${mood.color}`,
        minWidth: 160,
      }}
    >
      <Typography
        variant="caption"
        sx={{ fontWeight: 900, display: "block", mb: 0.5, opacity: 0.7 }}
      >
        {data.minute}'
      </Typography>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Box sx={{ fontSize: "1.5rem", lineHeight: 1 }}>
          {data.dominantEmoji}
        </Box>
        <Stack spacing={0}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 800, color: mood.color, lineHeight: 1.2 }}
          >
            {mood.label}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.6 }}>
            {data.sentiment}% • {data.totalVotes}{" "}
            {data.totalVotes === 1 ? "vote" : "votes"}
          </Typography>
        </Stack>
      </Stack>
      {nearby.length > 0 && (
        <Stack spacing={0.25} sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: "divider" }}>
          {nearby.map((ev: any, i: number) => (
            <Typography
              key={i}
              variant="caption"
              sx={{ fontWeight: 700, display: "block" }}
            >
              {ev.emoji} {ev.label}
            </Typography>
          ))}
        </Stack>
      )}
    </Box>
  );
};
