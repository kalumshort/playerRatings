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
  Area,
  ComposedChart,
} from "recharts";
import { useTheme } from "@mui/material";

import { selectActiveClubFixtures } from "@/lib/redux/selectors/fixturesSelectors";
import { CustomTooltip } from "@/components/ui/CustomTooltip";
import { getRatingColor } from "@/lib/utils/football-logic";

// --- MAIN COMPONENT ---
export default function PlayerRatingsLineGraph({ allPlayerRatings, clubId }) {
  const theme = useTheme();

  // 1. Get Fixtures from Redux to Hydrate the Graph
  const allFixtures = useSelector(selectActiveClubFixtures);

  // 2. Prepare Data (Memoized for performance)
  const { graphData, seasonAverage } = useMemo(() => {
    if (!allPlayerRatings?.matches || !allFixtures)
      return { graphData: [], seasonAverage: 0 };

    let totalRating = 0;
    let count = 0;

    const data = Object.values(allPlayerRatings.matches)
      // Sort by ID is okay, but ideally we sort by Timestamp if available in ratings
      // Assuming ratings follow insertion order or we can find fixture timestamp
      .map((entry: any) => {
        const fixture = allFixtures.find((f) => f.id === entry.id);
        if (!fixture) return null;

        const rating = +(entry.totalRating / entry.totalSubmits).toFixed(2);

        // Accumulate for average
        totalRating += rating;
        count++;

        // Determine Opponent info
        const isHome = fixture.teams.home.id === clubId;
        const opponent = isHome ? fixture.teams.away : fixture.teams.home;

        return {
          id: entry.id,
          rating: rating,
          date: new Date(fixture.fixture.timestamp * 1000),
          opponentName: opponent.name,
          opponentLogo: opponent.logo,
          score: `${fixture.score.fulltime.home} - ${fixture.score.fulltime.away}`,
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
        };
      })
      .filter(Boolean) // Remove nulls
      .sort((a: any, b: any) => a.date - b.date); // Ensure chronological order

    return {
      graphData: data,
      seasonAverage: count > 0 ? totalRating / count : 0,
    };
  }, [allPlayerRatings, allFixtures, clubId]);

  if (graphData.length === 0) return null;
  const yAxisMax = 10;
  const yAxisMin = 0;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={graphData}
        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
      >
        <defs>
          <linearGradient
            id="lineGradient"
            x1="0"
            y1="0"
            x2="0"
            y2="100%"
            gradientUnits="userSpaceOnUse" // <--- THE KEY FIX
          >
            {/* In userSpaceOnUse with y2="100%", 0% is the TOP (Rating 10) 
        and 100% is the BOTTOM (Rating 0). 
        So we reverse the logic:
    */}
            <stop offset="0%" stopColor="#A0E8AF" /> {/* Matcha at 10.0 */}
            <stop offset="25%" stopColor="#A0E8AF" /> {/* Matcha down to 7.5 */}
            <stop offset="25%" stopColor="#FFD6A5" />{" "}
            {/* Apricot starts at 7.5 */}
            <stop offset="60%" stopColor="#FFD6A5" />{" "}
            {/* Apricot down to 4.0 */}
            <stop offset="60%" stopColor="#FFADAD" />{" "}
            {/* Coral starts at 4.0 */}
            <stop offset="100%" stopColor="#FFADAD" /> {/* Coral at 0.0 */}
          </linearGradient>
        </defs>

        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke={theme.palette.divider}
        />

        <XAxis
          dataKey="date"
          tick={false} // Hide X-Axis text to keep it clean
          axisLine={false}
        />

        <YAxis
          domain={[0, 10]}
          tickCount={6}
          axisLine={false}
          tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
        />

        <Tooltip
          content={<CustomTooltip />}
          cursor={{
            stroke: theme.palette.text.secondary,
            strokeWidth: 1,
            strokeDasharray: "4 4",
          }}
        />

        {/* Season Average Line */}
        {seasonAverage > 0 && (
          <ReferenceLine
            y={seasonAverage}
            stroke={theme.palette.warning.main}
            strokeDasharray="3 3"
            label={{
              position: "insideTopRight",
              value: "AVG",
              fill: theme.palette.warning.main,
              fontSize: 10,
              fontWeight: 800,
            }}
          />
        )}

        {/* The Area Fill (Subtle) */}
        <Area
          type="monotone"
          dataKey="rating"
          stroke="none"
          fillOpacity={1}
          fill="url(#colorRating)"
        />

        {/* The Main Line */}
        <Line
          type="monotone"
          dataKey="rating"
          stroke="url(#lineGradient)"
          strokeWidth={3}
          // CUSTOM DOT RENDERER
          dot={(props: any) => {
            const { cx, cy, payload } = props;
            const dotColor = getRatingColor(payload.rating);
            return (
              <svg key={`dot-${payload.id}`}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill={dotColor}
                  stroke={theme.palette.background.paper}
                  strokeWidth={1}
                />
              </svg>
            );
          }}
          activeDot={{
            r: 6,
            stroke: theme.palette.background.paper,
            strokeWidth: 2,
            // You can also make the active dot dynamic:
            fill: theme.palette.primary.main,
          }}
          animationDuration={1500}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
