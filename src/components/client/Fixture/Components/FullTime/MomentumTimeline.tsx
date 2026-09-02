"use client";

import React, { useMemo } from "react";
import { Box, Stack, Typography, alpha, useTheme } from "@mui/material";
import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { buildMomentumSeries, type MomentumPoint } from "@/lib/live/matchStory";
import type { LiveStatsDoc } from "@/lib/live/heat";

/** Same vocabulary the mood chart uses, so the two read as one page. */
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

interface MomentumTimelineProps {
  liveStats: LiveStatsDoc;
  events: any[];
  finalMinute?: number;
}

/**
 * The match as the crowd felt it, minute by minute.
 *
 * The line is a running total of hot-minus-cold across the whole squad, with
 * the real events laid over it — so a dip that starts two minutes before a
 * goal against reads as the crowd seeing it coming.
 */
export default function MomentumTimeline({
  liveStats,
  events,
  finalMinute,
}: MomentumTimelineProps) {
  const theme = useTheme();
  const { heat } = theme.palette;

  const series = useMemo(
    () => buildMomentumSeries(liveStats, finalMinute),
    [liveStats, finalMinute],
  );

  const marked = useMemo(
    () =>
      (events ?? []).filter(
        (e) => e?.time?.elapsed != null && ["Goal", "Card", "subst"].includes(e.type),
      ),
    [events],
  );

  if (series.length === 0) return null;

  const peak = series.reduce((best, p) =>
    Math.abs(p.cumulative) > Math.abs(best.cumulative) ? p : best,
  );
  const ended = series[series.length - 1];
  const positive = ended.cumulative >= 0;

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="baseline"
        sx={{ mb: 1 }}
      >
        <Typography variant="subtitle2" fontWeight={900}>
          Fan momentum
        </Typography>
        <Typography
          variant="caption"
          fontWeight={800}
          sx={{ color: positive ? heat.hotSolid : heat.coldSolid }}
        >
          {peak.cumulative >= 0 ? "Peaked" : "Bottomed out"} at {peak.minute}&apos;
        </Typography>
      </Stack>

      <Box sx={{ width: "100%", height: 190 }}>
        <ResponsiveContainer>
          <AreaChart
            data={series}
            margin={{ top: 18, right: 8, bottom: 0, left: -28 }}
          >
            <defs>
              <linearGradient id="momentumFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={heat.hotSolid} stopOpacity={0.35} />
                <stop offset="100%" stopColor={heat.hotSolid} stopOpacity={0} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="minute"
              tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
              tickFormatter={(m) => `${m}'`}
              interval="preserveStartEnd"
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
              axisLine={false}
              tickLine={false}
              width={40}
            />

            {/* Neutral. Above it the crowd were net positive on their players. */}
            <ReferenceLine
              y={0}
              stroke={alpha(theme.palette.text.primary, 0.25)}
              strokeDasharray="3 3"
            />

            {marked.map((event, i) => (
              <ReferenceLine
                key={`${event.type}-${event.time.elapsed}-${i}`}
                x={event.time.elapsed}
                stroke={alpha(theme.palette.text.primary, 0.22)}
                strokeWidth={1}
                label={{
                  value: eventEmoji(event),
                  position: "top",
                  fontSize: 12,
                }}
              />
            ))}

            <RechartsTooltip
              contentStyle={{
                background: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 10,
                fontSize: 12,
              }}
              labelFormatter={(m) => {
                const here = marked.filter((e) => e.time.elapsed === m);
                return here.length
                  ? `${m}' — ${here.map(eventLabel).join(" · ")}`
                  : `${m}'`;
              }}
              formatter={(value: any, _name, entry: any) => {
                const point = entry?.payload as MomentumPoint;
                return [
                  `${value > 0 ? "+" : ""}${value}`,
                  point?.hot || point?.cold
                    ? `running total (${point.hot} hot, ${point.cold} cold this minute)`
                    : "running total",
                ];
              }}
            />

            <Area
              type="monotone"
              dataKey="cumulative"
              stroke={positive ? heat.hotSolid : heat.coldSolid}
              strokeWidth={2.5}
              fill="url(#momentumFill)"
              isAnimationActive={false}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}
