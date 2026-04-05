"use client";

import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import {
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  ReferenceArea,
  Area,
  ComposedChart,
} from "recharts";
import { useTheme, alpha, Box, Typography } from "@mui/material";

// CUSTOM IMPORTS
import { selectActiveClubFixtures } from "@/lib/redux/selectors/fixturesSelectors";
import { CustomTooltip } from "@/components/ui/CustomTooltip";
import { getRatingColor } from "@/lib/utils/football-logic";

interface PlayerRatingsLineGraphProps {
  allPlayerRatings: {
    matches: Record<
      string,
      { id: string; totalRating: number; totalSubmits: number }
    >;
  };
  clubId: any;
}

export default function PlayerRatingsLineGraph({
  allPlayerRatings,
  clubId,
}: PlayerRatingsLineGraphProps) {
  const theme = useTheme() as any;
  const allFixtures = useSelector(selectActiveClubFixtures);

  // 1. DATA PROCESSING & DYNAMIC DOMAIN CALCULATION
  const { graphData, seasonAverage, yDomain } = useMemo(() => {
    if (!allPlayerRatings?.matches || !allFixtures) {
      return { graphData: [], seasonAverage: 0, yDomain: [0, 10] };
    }

    let totalRatingSum = 0;
    const matchesArray = Object.values(allPlayerRatings.matches);

    const data = matchesArray
      .map((entry: any) => {
        const fixture = allFixtures.find((f) => f.id === entry.id);
        if (!fixture) return null;

        const rating =
          Number((entry.totalRating / entry.totalSubmits).toFixed(2)) || 0;
        totalRatingSum += rating;

        const isHome = fixture.teams.home.id === clubId;
        const opponent = isHome ? fixture.teams.away : fixture.teams.home;

        return {
          id: entry.id,
          rating,
          date: new Date(fixture.fixture.timestamp * 1000),
          opponentName: opponent.name,
          opponentShort:
            opponent.name.split(" ").pop()?.slice(0, 3).toUpperCase() || "",
          opponentLogo: opponent.logo,
          clubId: clubId, // Re-inserted for Tooltip context
          result: isHome
            ? fixture.teams.home.winner
              ? "W"
              : fixture.teams.away.winner
                ? "L"
                : "D"
            : fixture.teams.away.winner
              ? "W"
              : fixture.teams.home.winner
                ? "L"
                : "D",
          score: `${fixture.score.fulltime.home} - ${fixture.score.fulltime.away}`,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => a.date.getTime() - b.date.getTime());

    // CALCULATE DYNAMIC Y-AXIS (Zooming logic for 11votes "Dramatic Form" view)
    let dynamicYDomain: [number, number] = [0, 10];
    if (data.length > 0) {
      const ratings = data.map((d) => d.rating);
      const minVal = Math.min(...ratings);
      const maxVal = Math.max(...ratings);

      // Floor/Ceil with 0.5 buffer to avoid the line touching the chart edges
      const bottom = Math.max(0, Math.floor(minVal - 0.5));
      const top = Math.min(10, Math.ceil(maxVal + 0.5));
      dynamicYDomain = [bottom, top];
    }

    return {
      graphData: data,
      seasonAverage: data.length > 0 ? totalRatingSum / data.length : 0,
      yDomain: dynamicYDomain,
    };
  }, [allPlayerRatings, allFixtures, clubId]);

  // 2. RENDER GATING
  if (graphData.length === 0) {
    return (
      <Box
        sx={{
          height: 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography color="text.secondary">
          No ratings yet this season
        </Typography>
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart
        data={graphData}
        margin={{ top: 16, right: 8, left: -20, bottom: 24 }}
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor={theme.palette.primary.main}
              stopOpacity={0.15}
            />
            <stop
              offset="95%"
              stopColor={theme.palette.primary.main}
              stopOpacity={0.01}
            />
          </linearGradient>
        </defs>

        {/* PERFORMANCE BANDS: Success (7.5+) and Error (<5.5) */}
        <ReferenceArea
          y1={7.5}
          y2={10}
          fill={theme.palette.success.main}
          fillOpacity={0.03}
        />
        <ReferenceArea
          y1={0}
          y2={5.5}
          fill={theme.palette.error.main}
          fillOpacity={0.03}
        />

        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke={alpha(theme.palette.divider, 0.1)}
        />

        <YAxis
          domain={yDomain}
          tickCount={5}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
          width={40}
        />

        <Tooltip
          content={<CustomTooltip clubId={clubId} />}
          cursor={{
            stroke: theme.palette.primary.main,
            strokeWidth: 1,
            strokeDasharray: "4 4",
          }}
        />

        {/* SEASON AVERAGE REFERENCE */}
        {seasonAverage > 0 && (
          <ReferenceLine
            y={seasonAverage}
            stroke={theme.palette.warning.main}
            strokeDasharray="5 5"
            strokeWidth={1.5}
            label={{
              position: "insideTopRight",
              value: `AVG ${seasonAverage.toFixed(1)}`,
              fill: theme.palette.warning.main,
              fontSize: 10,
              fontWeight: 800,
              offset: 10,
            }}
          />
        )}

        <Area
          type="monotone"
          dataKey="rating"
          stroke="none"
          fill="url(#areaGradient)"
          isAnimationActive={true}
          animationDuration={1000}
        />

        <Line
          type="monotone"
          dataKey="rating"
          stroke={theme.palette.primary.main}
          strokeWidth={3}
          dot={(props: any) => {
            const { cx, cy, payload } = props;
            const color = getRatingColor(payload.rating);
            return (
              <circle
                key={payload.id}
                cx={cx}
                cy={cy}
                r={4}
                fill={color}
                stroke={theme.palette.background.paper}
                strokeWidth={2}
              />
            );
          }}
          activeDot={{
            r: 6,
            stroke: theme.palette.primary.main,
            strokeWidth: 2,
            fill: theme.palette.background.paper,
          }}
          animationDuration={1500}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
