import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  Modal,
  Fade,
  IconButton,
  Divider,
  useTheme,
  Avatar,
} from "@mui/material";
import {
  BarChart as BarChartIcon,
  Close,
  SportsSoccer,
  TrendingUp,
} from "@mui/icons-material";
import { useSelector } from "react-redux";
import {
  BarChart,
  Bar,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { selectPredictionsByMatchId } from "../../../Selectors/predictionsSelectors";
import { useIsMobile } from "../../../Hooks/Helper_Functions";

export default function ScorePredictionResults({
  fixture,
  storedUsersPredictedScore,
}) {
  const theme = useTheme();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const matchPredictions = useSelector(selectPredictionsByMatchId(fixture.id));

  if (!matchPredictions) return null;

  // --- DATA PROCESSING ---

  // 1. Score Distribution (Top 6 Scores)
  const processScoreData = (data) => {
    if (!data) return [];
    const totalVotes = Object.values(data).reduce((a, b) => a + b, 0);

    return Object.entries(data)
      .map(([score, count]) => ({
        score,
        count,
        percent: Math.round((count / totalVotes) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  };

  const scoreData = processScoreData(matchPredictions.scorePredictions);

  // 2. Goal Data
  const processGoalData = (data) => {
    if (!data) return [];
    return Object.entries(data)
      .map(([goals, count]) => ({ goals, count }))
      .sort((a, b) => parseInt(a.goals) - parseInt(b.goals));
  };
  const homeGoalData = processGoalData(matchPredictions.homeGoals);
  const awayGoalData = processGoalData(matchPredictions.awayGoals);

  // 3. Consensus Score
  const consensusScore = scoreData[0]?.score || "-";

  // --- STYLES ---
  const glassCardStyles = {
    p: 3,

    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    border: `1px solid ${theme.palette.divider}`,
  };

  const modalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: isMobile ? "95vw" : 650,
    maxHeight: "90vh",
    overflowY: "auto",
    bgcolor: "background.default",

    boxShadow: 24,
    border: `1px solid ${theme.palette.divider}`,
    outline: "none",
  };

  return (
    <>
      {/* --- MAIN DASHBOARD CARD --- */}
      <Paper sx={glassCardStyles} elevation={0}>
        <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 3 }}>
          <SportsSoccer fontSize="small" color="primary" />
          <Typography variant="caption">RESULT COMPARISON</Typography>
        </Stack>

        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          justifyContent="center"
          sx={{ width: "100%" }}
        >
          <BigStatCard
            label="YOU"
            value={storedUsersPredictedScore}
            highlight={true}
          />
          <Typography variant="h6" sx={{ color: "text.disabled" }}>
            VS
          </Typography>
          <BigStatCard label="GROUP" value={consensusScore} highlight={false} />
        </Stack>

        <Button
          onClick={() => setOpen(true)}
          startIcon={<BarChartIcon />}
          variant="outlined"
          size="small"
          sx={{
            mt: 3,
            borderRadius: 8,
            borderColor: theme.palette.divider,
            color: "text.primary",
          }}
        >
          FULL BREAKDOWN
        </Button>
      </Paper>

      {/* --- ANALYTICS MODAL --- */}
      <Modal open={open} onClose={() => setOpen(false)} closeAfterTransition>
        <Fade in={open}>
          <Box sx={modalStyle}>
            {/* Header */}
            <Box
              sx={{
                p: 2,
                borderBottom: `1px solid ${theme.palette.divider}`,
                display: "flex",
                justifyContent: "space-between",
                bgcolor: "background.paper",
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <TrendingUp color="primary" />
                <Typography variant="h6">MATCH ANALYTICS</Typography>
              </Stack>
              <IconButton onClick={() => setOpen(false)} size="small">
                <Close />
              </IconButton>
            </Box>

            <Stack spacing={4} sx={{ p: 3 }}>
              {/* 1. SCORE DISTRIBUTION CHART */}
              <Box>
                <SectionTitle>SCORELINE CONSENSUS</SectionTitle>
                <Box sx={{ height: 200, width: "100%", mt: 2 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={scoreData}
                      layout="horizontal"
                      margin={{ top: 5, right: 5, bottom: 5, left: -20 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke={theme.palette.divider}
                      />
                      <XAxis
                        dataKey="score"
                        tick={{
                          fill: theme.palette.text.secondary,

                          fontSize: 16,
                        }}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                      />
                      <YAxis tick={false} axisLine={false} />
                      <Tooltip
                        cursor={{ fill: theme.palette.action.hover }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <Paper sx={{ p: 1, bgcolor: "background.paper" }}>
                                <Typography variant="caption">
                                  {payload[0].payload.score}:{" "}
                                  {payload[0].payload.percent}%
                                </Typography>
                              </Paper>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {scoreData.map((entry, index) => {
                          const isUserPick =
                            entry.score === storedUsersPredictedScore;
                          return (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                isUserPick
                                  ? theme.palette.secondary.main
                                  : theme.palette.primary.main
                              }
                              opacity={isUserPick ? 1 : 0.6 + index * -0.1}
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
                <Stack
                  direction="row"
                  justifyContent="center"
                  spacing={2}
                  sx={{ mt: 1 }}
                >
                  <LegendItem
                    color={theme.palette.primary.main}
                    label="Group Votes"
                  />
                  <LegendItem
                    color={theme.palette.secondary.main}
                    label="Your Pick"
                  />
                </Stack>
              </Box>

              <Divider />

              {/* 2. GOAL EXPECTANCY (With Team Names/Logos) */}
              <Box>
                <SectionTitle>GOAL EXPECTANCY</SectionTitle>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={3}
                  sx={{ mt: 2 }}
                >
                  {/* HOME TEAM */}
                  <GoalChart
                    data={homeGoalData}
                    color={theme.palette.primary.main}
                    teamName={fixture.teams.home.name}
                    teamLogo={fixture.teams.home.logo}
                  />

                  {/* AWAY TEAM */}
                  <GoalChart
                    data={awayGoalData}
                    color={theme.palette.text.disabled}
                    teamName={fixture.teams.away.name}
                    teamLogo={fixture.teams.away.logo}
                  />
                </Stack>
              </Box>
            </Stack>
          </Box>
        </Fade>
      </Modal>
    </>
  );
}

// --- SUB-COMPONENTS ---

const BigStatCard = ({ label, value, highlight }) => {
  const theme = useTheme();
  return (
    <Paper
      sx={{
        flex: 1,
        textAlign: "center",
        p: 2,
        bgcolor: highlight ? "background.paper" : "transparent",
        border: `1px solid ${
          highlight ? theme.palette.primary.main : theme.palette.divider
        }`,
        borderRadius: 2,
        boxShadow: highlight
          ? `0 4px 15px -5px ${theme.palette.primary.main}40`
          : "none",
      }}
      elevation={0}
    >
      <Typography
        variant="caption"
        sx={{
          display: "block",
          mb: 1,
        }}
      >
        {label}
      </Typography>
      <Typography variant="h3">{value}</Typography>
    </Paper>
  );
};

const GoalChart = ({ data, color, teamName, teamLogo }) => (
  <Box sx={{ flex: 1 }}>
    {/* Team Header */}
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.5}
      sx={{ mb: 2, pb: 1, borderBottom: `1px dashed ${color}40` }}
    >
      <Avatar src={teamLogo} sx={{ width: 24, height: 24 }} />
      <Typography variant="caption" fontWeight="bold" noWrap>
        {teamName}
      </Typography>
    </Stack>

    {/* Chart */}
    <Box sx={{ height: 120, width: "100%" }}>
      <ResponsiveContainer>
        <BarChart data={data}>
          <XAxis
            dataKey="goals"
            tick={{ fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "transparent" }}
            contentStyle={{
              borderRadius: 8,
              border: "none",
              backgroundColor: "#333",
              color: "#fff",
            }}
          />
          <Bar dataKey="count" fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  </Box>
);

const SectionTitle = ({ children }) => (
  <Typography
    variant="caption"
    sx={{
      mb: 0.5,
      display: "block",
    }}
  >
    {children}
  </Typography>
);

const LegendItem = ({ color, label }) => (
  <Stack direction="row" alignItems="center" spacing={0.5}>
    <Box sx={{ width: 10, height: 10, bgcolor: color, borderRadius: 1 }} />
    <Typography variant="caption" sx={{ fontSize: "0.7rem" }}>
      {label}
    </Typography>
  </Stack>
);
