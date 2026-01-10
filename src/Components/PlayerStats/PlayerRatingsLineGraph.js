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
import { Paper, Typography, Box, useTheme } from "@mui/material";
import { styled } from "@mui/material/styles";
import { selectActiveClubFixtures } from "../../Selectors/fixturesSelectors";

// --- STYLED TOOLTIP COMPONENT ---
const TooltipContainer = styled(Paper)(({ theme }) => ({
  backgroundColor: "rgba(33, 33, 33, 0.95)", // Dark semi-transparent
  color: "#fff",
  padding: "12px",
  borderRadius: "12px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
  border: "1px solid rgba(255,255,255,0.1)",
  minWidth: "180px",
  textAlign: "center",
}));

const TooltipScore = styled(Typography)({
  fontWeight: 800,
  fontSize: "1.5rem",
  lineHeight: 1,
  margin: "8px 0",
  color: "#fff",
});

const TooltipDate = styled(Typography)({
  fontSize: "0.75rem",
  color: "rgba(255,255,255,0.7)",
  textTransform: "uppercase",
  fontWeight: 700,
  marginBottom: "8px",
});

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
      .map((entry) => {
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
      .sort((a, b) => a.date - b.date); // Ensure chronological order

    return {
      graphData: data,
      seasonAverage: count > 0 ? totalRating / count : 0,
    };
  }, [allPlayerRatings, allFixtures, clubId]);

  if (graphData.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={graphData}
        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor={theme.palette.primary.main}
              stopOpacity={0.2}
            />
            <stop
              offset="95%"
              stopColor={theme.palette.primary.main}
              stopOpacity={0}
            />
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
          stroke={theme.palette.primary.main}
          strokeWidth={3}
          dot={{ r: 3, fill: theme.palette.primary.main, strokeWidth: 0 }}
          activeDot={{
            r: 6,
            stroke: theme.palette.background.paper,
            strokeWidth: 2,
          }}
          animationDuration={1500}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// --- CUSTOM TOOLTIP RENDERER ---
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const formattedDate = data.date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });

    // Color code the score in tooltip based on rating
    let ratingColor = "#d32f2f"; // Default Red

    if (data.rating >= 8.0) {
      ratingColor = "#1b5e5aff"; // Deep Green
    } else if (data.rating >= 7.0) {
      ratingColor = "#2e7d32"; // Green
    } else if (data.rating >= 6.0) {
      ratingColor = "#ed6c02"; // Orange
    }

    return (
      <TooltipContainer elevation={4}>
        <TooltipDate>{formattedDate}</TooltipDate>

        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          gap={1.5}
          mb={1}
        >
          <Typography variant="body2" fontWeight={700}>
            vs
          </Typography>
          <img
            src={data.opponentLogo}
            alt={data.opponentName}
            style={{ width: 30, height: 30, objectFit: "contain" }}
          />
          <Typography
            variant="body2"
            fontWeight={700}
            noWrap
            sx={{ maxWidth: "100px" }}
          >
            {data.opponentName}
          </Typography>
        </Box>

        <Typography variant="caption" sx={{ opacity: 0.8 }}>
          Result: {data.score}
        </Typography>

        <TooltipScore style={{ color: ratingColor }}>
          {data.rating}
        </TooltipScore>

        <Typography variant="caption" sx={{ letterSpacing: 1, opacity: 0.6 }}>
          RATING
        </Typography>
      </TooltipContainer>
    );
  }

  return null;
};
