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
import { useTheme } from "@mui/material/styles";

import { selectActiveClubFixtures } from "@/lib/redux/selectors/fixturesSelectors";
import { CustomTooltip } from "@/components/ui/CustomTooltip";
import { getRatingColor } from "@/lib/utils/football-logic";
import { Box, Typography } from "@mui/material";

// Helper to get short label for X axis (e.g. "ARS W" or "15/2 L")
const getXAxisTick = (payload: any) => {
  const { opponentName, result, date } = payload.payload || {};
  if (!opponentName) return "";

  const shortOpp =
    opponentName.split(" ").pop()?.slice(0, 3).toUpperCase() || "";
  const shortDate = date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
  const emoji = result === "W" ? "🟢" : result === "L" ? "🔴" : "🟡";

  return `${shortOpp} ${emoji}`;
};

export default function PlayerRatingsLineGraph({ allPlayerRatings, clubId }) {
  const theme = useTheme();

  const allFixtures = useSelector(selectActiveClubFixtures);

  const { graphData, seasonAverage } = useMemo(() => {
    if (!allPlayerRatings?.matches || !allFixtures) {
      return { graphData: [], seasonAverage: 0 };
    }

    let total = 0;
    let count = 0;

    const data = Object.values(allPlayerRatings.matches)
      .map((entry: any) => {
        const fixture = allFixtures.find((f) => f.id === entry.id);
        if (!fixture) return null;

        const rating =
          Number((entry.totalRating / entry.totalSubmits).toFixed(2)) || 0;

        total += rating;
        count++;

        const isHome = fixture.teams.home.id === clubId;
        const opponent = isHome ? fixture.teams.away : fixture.teams.home;

        return {
          id: entry.id,
          rating,
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
      .filter(Boolean)
      .sort((a: any, b: any) => a.date.getTime() - b.date.getTime());

    return {
      graphData: data,
      seasonAverage: count > 0 ? total / count : 0,
    };
  }, [allPlayerRatings, allFixtures, clubId]);

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
      {" "}
      {/* Slightly taller for mobile readability */}
      <ComposedChart
        data={graphData}
        margin={{ top: 16, right: 8, left: -10, bottom: 24 }} // More bottom for ticks
      >
        <defs>
          {/* Area fill gradient – good → bad from top to bottom */}
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4caf50" stopOpacity={0.35} />{" "}
            {/* Green top */}
            <stop offset="40%" stopColor="#ffeb3b" stopOpacity={0.25} />{" "}
            {/* Yellow mid */}
            <stop offset="100%" stopColor="#f44336" stopOpacity={0.15} />{" "}
            {/* Red bottom */}
          </linearGradient>

          {/* Line gradient – stronger colors */}
          <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#66bb6a" /> {/* 10+ green */}
            <stop offset="30%" stopColor="#81c784" />
            <stop offset="40%" stopColor="#ffca28" /> {/* ~7 yellow */}
            <stop offset="70%" stopColor="#ffb74d" />
            <stop offset="100%" stopColor="#ef5350" /> {/* low red */}
          </linearGradient>
        </defs>

        {/* Background performance zones */}
        <ReferenceArea y1={7} y2={10} fill="#4caf50" fillOpacity={0.08} />
        <ReferenceArea y1={5} y2={7} fill="#ffca28" fillOpacity={0.08} />
        <ReferenceArea y1={0} y2={5} fill="#ef5350" fillOpacity={0.08} />

        <CartesianGrid
          strokeDasharray="3 5"
          vertical={false}
          stroke={theme.palette.divider}
          opacity={0.4}
        />

        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tick={({ payload, ...props }) => (
            <g transform={`translate(${props.x},${props.y})`}>
              <text
                x={0}
                y={0}
                dy={16}
                textAnchor="middle"
                fill={theme.palette.text.secondary}
                fontSize={11}
              >
                {getXAxisTick(payload)}
              </text>
            </g>
          )}
          interval="preserveStartEnd" // show first & last
        />

        <YAxis
          domain={[0, 10]}
          tickCount={6}
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
          width={30}
        />

        <Tooltip
          content={<CustomTooltip />}
          cursor={{
            stroke: theme.palette.primary.main,
            strokeWidth: 1,
            strokeDasharray: "4 4",
          }}
        />

        {/* Season average */}
        {seasonAverage > 0 && (
          <ReferenceLine
            y={seasonAverage}
            stroke={theme.palette.warning.main}
            strokeDasharray="6 4"
            strokeWidth={2}
            label={{
              position: "insideTopRight",
              value: `AVG ${seasonAverage.toFixed(1)}`,
              fill: theme.palette.warning.main,
              fontSize: 11,
              fontWeight: 700,
              offset: 8,
            }}
          />
        )}

        {/* Subtle area fill */}
        <Area
          type="monotone"
          dataKey="rating"
          stroke="none"
          fill="url(#areaGradient)"
          fillOpacity={1}
          isAnimationActive={true}
          animationDuration={1200}
        />

        {/* Main line + custom dots */}
        <Line
          type="monotone"
          dataKey="rating"
          stroke="url(#lineGradient)"
          strokeWidth={3}
          dot={(props: any) => {
            const { cx, cy, payload } = props;
            const color = getRatingColor(payload.rating);
            return (
              <g>
                <circle
                  cx={cx}
                  cy={cy}
                  r={5}
                  fill={color}
                  stroke={theme.palette.background.paper}
                  strokeWidth={2}
                  style={{ transition: "all 0.2s" }}
                  className="recharts-dot-hover" // can add CSS :hover { r:7 }
                />
              </g>
            );
          }}
          activeDot={{
            r: 8,
            stroke: theme.palette.primary.main,
            strokeWidth: 3,
            fill: theme.palette.background.paper,
          }}
          animationDuration={1800}
          animationEasing="ease-out"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
