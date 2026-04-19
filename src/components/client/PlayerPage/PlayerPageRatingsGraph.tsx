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
  LineChart,
} from "recharts";
import { useTheme, Box, Typography } from "@mui/material";

import { selectActiveClubFixtures } from "@/lib/redux/selectors/fixturesSelectors";
import { CustomTooltip } from "@/components/ui/CustomTooltip";
import { getRatingColor } from "@/lib/utils/football-logic";

const MIN_Y_RANGE = 3;
const CHART_HEIGHT = 320;

interface MatchRatingEntry {
  id: string;
  totalRating: number;
  totalSubmits: number;
}

interface ComparePlayerInfo {
  id: string;
  name: string;
  photo?: string;
}

interface PlayerRatingsLineGraphProps {
  allPlayerRatings: {
    matches: Record<string, MatchRatingEntry>;
  };
  clubId: any;
  comparePlayerRatings?: {
    matches: Record<string, MatchRatingEntry>;
  } | null;
  comparePlayer?: ComparePlayerInfo | null;
  playerName?: string;
}

function shortCode(name: string) {
  return name.split(" ")[0]?.slice(0, 3).toUpperCase() ?? "";
}

function ratingFromEntry(entry?: MatchRatingEntry | null) {
  if (!entry || !entry.totalSubmits) return null;
  return Math.round((entry.totalRating / entry.totalSubmits) * 100) / 100;
}

export default function PlayerRatingsLineGraph({
  allPlayerRatings,
  clubId,
  comparePlayerRatings,
  comparePlayer,
  playerName,
}: PlayerRatingsLineGraphProps) {
  const theme = useTheme();
  const allFixtures = useSelector(selectActiveClubFixtures);

  const fixturesById = useMemo(() => {
    const map = new Map<string, any>();
    (allFixtures || []).forEach((f: any) => map.set(f.id, f));
    return map;
  }, [allFixtures]);

  const compareColor = (theme.palette as any).secondary?.main ?? "#ff9800";

  const { graphData, seasonAverage, compareAverage, yDomain } = useMemo(() => {
    if (!allPlayerRatings?.matches || !allFixtures) {
      return {
        graphData: [] as any[],
        seasonAverage: 0,
        compareAverage: 0,
        yDomain: [0, 10] as [number, number],
      };
    }

    const data = Object.values(allPlayerRatings.matches)
      .map((entry) => {
        const fixture = fixturesById.get(entry.id);
        const rating = ratingFromEntry(entry);
        if (!fixture || rating == null) return null;

        const isHome = fixture.teams.home.id === clubId;
        const opponent = isHome ? fixture.teams.away : fixture.teams.home;

        const homeWin = fixture.teams.home.winner;
        const awayWin = fixture.teams.away.winner;
        const result = isHome
          ? homeWin
            ? "W"
            : awayWin
              ? "L"
              : "D"
          : awayWin
            ? "W"
            : homeWin
              ? "L"
              : "D";

        const compareRating = ratingFromEntry(
          comparePlayerRatings?.matches?.[entry.id],
        );

        return {
          id: entry.id,
          rating,
          compareRating,
          date: new Date(fixture.fixture.timestamp * 1000),
          opponentName: opponent.name,
          opponentShort: shortCode(opponent.name),
          opponentLogo: opponent.logo,
          clubId,
          result,
          score: `${fixture.score.fulltime.home} - ${fixture.score.fulltime.away}`,
          playerName,
          compareName: comparePlayer?.name,
        };
      })
      .filter((d): d is NonNullable<typeof d> => d !== null)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (data.length === 0) {
      return {
        graphData: [],
        seasonAverage: 0,
        compareAverage: 0,
        yDomain: [0, 10] as [number, number],
      };
    }

    const ratings = data.map((d) => d.rating);
    const compareRatings = data
      .map((d) => d.compareRating)
      .filter((r): r is number => r != null);

    const allVals = [...ratings, ...compareRatings];
    const minVal = Math.min(...allVals);
    const maxVal = Math.max(...allVals);

    let bottom = Math.max(0, Math.floor(minVal - 0.5));
    let top = Math.min(10, Math.ceil(maxVal + 0.5));
    if (top - bottom < MIN_Y_RANGE) {
      const mid = (top + bottom) / 2;
      bottom = Math.max(0, Math.floor(mid - MIN_Y_RANGE / 2));
      top = Math.min(10, bottom + MIN_Y_RANGE);
      if (top - bottom < MIN_Y_RANGE) bottom = Math.max(0, top - MIN_Y_RANGE);
    }

    const avg = ratings.reduce((s, r) => s + r, 0) / ratings.length;
    const compareAvg = compareRatings.length
      ? compareRatings.reduce((s, r) => s + r, 0) / compareRatings.length
      : 0;

    return {
      graphData: data,
      seasonAverage: avg,
      compareAverage: compareAvg,
      yDomain: [bottom, top] as [number, number],
    };
  }, [
    allPlayerRatings,
    comparePlayerRatings,
    fixturesById,
    allFixtures,
    clubId,
    comparePlayer,
    playerName,
  ]);

  if (graphData.length === 0) {
    return (
      <Box
        sx={{
          height: CHART_HEIGHT,
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
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <LineChart
        data={graphData}
        margin={{ top: 16, right: 12, left: -16, bottom: 8 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke={theme.palette.divider}
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
          content={
            <CustomTooltip
              clubId={clubId}
              compareColor={compareColor}
              primaryColor={theme.palette.primary.main}
            />
          }
          cursor={{
            stroke: theme.palette.text.secondary,
            strokeWidth: 1,
            strokeDasharray: "4 4",
          }}
        />

        {seasonAverage > 0 && !comparePlayer && (
          <ReferenceLine
            y={seasonAverage}
            stroke={theme.palette.text.secondary}
            strokeDasharray="4 4"
            strokeWidth={1}
            label={{
              position: "insideTopRight",
              value: `Avg ${seasonAverage.toFixed(1)}`,
              fill: theme.palette.text.secondary,
              fontSize: 10,
              fontWeight: 600,
              offset: 8,
            }}
          />
        )}

        {comparePlayer && (
          <Line
            type="monotone"
            dataKey="compareRating"
            stroke={compareColor}
            strokeWidth={2}
            strokeDasharray="5 4"
            connectNulls={false}
            dot={{
              r: 3,
              fill: compareColor,
              stroke: theme.palette.background.paper,
              strokeWidth: 2,
            }}
            activeDot={{
              r: 6,
              stroke: compareColor,
              strokeWidth: 2,
              fill: theme.palette.background.paper,
            }}
            animationDuration={500}
          />
        )}

        <Line
          type="monotone"
          dataKey="rating"
          stroke={theme.palette.primary.main}
          strokeWidth={2}
          dot={(props: any) => {
            const { cx, cy, payload } = props;
            return (
              <circle
                key={payload.id}
                cx={cx}
                cy={cy}
                r={4}
                fill={getRatingColor(payload.rating)}
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
          animationDuration={500}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
