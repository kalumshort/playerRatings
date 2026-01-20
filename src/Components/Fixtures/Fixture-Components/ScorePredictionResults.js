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
  alpha,
} from "@mui/material";
import {
  BarChartRounded,
  CloseRounded,
  SportsSoccerRounded,
  TrendingUpRounded,
  QueryStatsRounded,
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

  // --- DATA PROCESSING ---
  const processScoreData = (data) => {
    if (!data || Object.keys(data).length === 0) return [];
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

  const scoreData = processScoreData(matchPredictions?.scorePredictions);

  const processGoalData = (data) => {
    if (!data || Object.keys(data).length === 0) return [];
    return Object.entries(data)
      .map(([goals, count]) => ({ goals, count }))
      .sort((a, b) => parseInt(a.goals) - parseInt(b.goals));
  };

  const homeGoalData = processGoalData(matchPredictions?.homeGoals);
  const awayGoalData = processGoalData(matchPredictions?.awayGoals);

  const hasData = scoreData.length > 0;
  const consensusScore = hasData ? scoreData[0]?.score : "-";

  return (
    <>
      {/* --- MAIN DASHBOARD CARD --- */}
      <Paper
        elevation={0}
        sx={(theme) => ({
          p: 3,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: "220px",
        })}
      >
        <Stack
          direction="row"
          alignItems="center"
          gap={1}
          sx={{ mb: 3, opacity: 0.8 }}
        >
          <SportsSoccerRounded fontSize="small" color="primary" />
          <Typography
            variant="caption"
            sx={{ letterSpacing: 1, fontWeight: 800, fontSize: "0.7rem" }}
          >
            RESULT COMPARISON
          </Typography>
        </Stack>

        {hasData || storedUsersPredictedScore ? (
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            justifyContent="center"
            sx={{ width: "100%", mb: 3 }}
          >
            {storedUsersPredictedScore && (
              <BigStatCard
                label="YOU"
                value={storedUsersPredictedScore}
                highlight={true}
              />
            )}
            {storedUsersPredictedScore && hasData && (
              <Typography
                variant="h6"
                sx={{ color: "text.disabled", fontWeight: 300 }}
              >
                VS
              </Typography>
            )}
            {hasData && (
              <BigStatCard
                label="GROUP"
                value={consensusScore}
                highlight={false}
              />
            )}
          </Stack>
        ) : (
          /* EMPTY STATE */
          <Stack alignItems="center" spacing={1} sx={{ py: 2, opacity: 0.5 }}>
            <QueryStatsRounded sx={{ fontSize: 40 }} />
            <Typography
              variant="caption"
              sx={{ textAlign: "center", fontWeight: 700 }}
            >
              AWAITING FIRST PREDICTIONS
            </Typography>
          </Stack>
        )}

        <Button
          onClick={() => setOpen(true)}
          disabled={!hasData}
          startIcon={<BarChartRounded />}
          sx={(theme) => ({
            ...theme.clay.button,
            bgcolor: "background.paper",
            color: "text.primary",
            fontWeight: 700,
            width: "100%",
          })}
        >
          {hasData ? "FULL BREAKDOWN" : "NO ANALYTICS YET"}
        </Button>
      </Paper>

      {/* --- ANALYTICS MODAL --- */}
      <Modal open={open} onClose={() => setOpen(false)} closeAfterTransition>
        <Fade in={open}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: isMobile ? "95vw" : 650,
              maxHeight: "90vh",
              overflowY: "auto",
              // Clay Modal Style
              ...theme.clay.card,
              borderRadius: "24px",
              p: 0,
              outline: "none",
            }}
          >
            {/* Header */}
            <Box
              sx={{
                p: 2,
                borderBottom: `1px solid ${theme.palette.divider}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <TrendingUpRounded color="primary" />
                <Typography variant="h6" fontWeight={800}>
                  MATCH ANALYTICS
                </Typography>
              </Stack>
              <IconButton onClick={() => setOpen(false)} size="small">
                <CloseRounded />
              </IconButton>
            </Box>

            <Stack spacing={4} sx={{ p: 3 }}>
              {/* 1. SCORE DISTRIBUTION CHART */}
              <Box>
                <SectionTitle>SCORELINE CONSENSUS</SectionTitle>
                <Box
                  sx={{
                    height: 220,
                    width: "100%",
                    mt: 2,
                    // Chart Container Well
                    ...theme.clay.box,
                    bgcolor: "background.paper",
                    p: 1,
                  }}
                >
                  <ResponsiveContainer>
                    <BarChart
                      data={scoreData}
                      layout="horizontal"
                      margin={{ top: 10, right: 10, bottom: 0, left: -20 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke={theme.palette.divider}
                        opacity={0.5}
                      />
                      <XAxis
                        dataKey="score"
                        tick={{
                          fill: theme.palette.text.secondary,
                          fontSize: 12,
                          fontWeight: 700,
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
                              <Paper
                                sx={{
                                  p: 1,
                                  bgcolor: "background.default",
                                  border: `1px solid ${theme.palette.divider}`,
                                  borderRadius: 2,
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{ fontWeight: 700 }}
                                >
                                  {payload[0].payload.score}:{" "}
                                  {payload[0].payload.percent}%
                                </Typography>
                              </Paper>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
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
                              opacity={isUserPick ? 1 : 0.8}
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
                  spacing={3}
                  sx={{ mt: 2 }}
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

              {/* 2. GOAL EXPECTANCY */}
              <Box>
                <SectionTitle>GOAL EXPECTANCY</SectionTitle>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={3}
                  sx={{ mt: 2 }}
                >
                  <GoalChart
                    data={homeGoalData}
                    color={theme.palette.primary.main}
                    teamName={fixture.teams.home.name}
                    teamLogo={fixture.teams.home.logo}
                  />

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
  return (
    <Box
      sx={(theme) => ({
        // Pressed Well Logic
        ...theme.clay.box,
        flex: 1,
        textAlign: "center",
        p: 2,
        borderRadius: "16px",
        bgcolor: highlight
          ? alpha(theme.palette.primary.main, 0.1)
          : "background.default",
        border: highlight
          ? `2px solid ${theme.palette.primary.main}`
          : `1px solid ${theme.palette.divider}`,
      })}
    >
      <Typography
        variant="caption"
        sx={{
          display: "block",
          mb: 0.5,
          fontWeight: 800,
          opacity: 0.6,
          color: highlight ? "primary.main" : "text.secondary",
        }}
      >
        {label}
      </Typography>
      <Typography variant="h3" sx={{ fontWeight: 900, color: "text.primary" }}>
        {value}
      </Typography>
    </Box>
  );
};

const GoalChart = ({ data, color, teamName, teamLogo }) => {
  const theme = useTheme();
  const hasGoalData = data && data.length > 0;

  return (
    <Box sx={{ flex: 1 }}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{ mb: 2, pb: 1, borderBottom: `1px dashed ${alpha(color, 0.4)}` }}
      >
        <Avatar src={teamLogo} sx={{ width: 28, height: 28 }} />
        <Typography variant="caption" fontWeight="800" noWrap>
          {teamName}
        </Typography>
      </Stack>

      <Box
        sx={{
          height: 120,
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          // Well style
          ...theme.clay.box,
          bgcolor: "background.paper",
          borderRadius: "12px",
          p: 1,
        }}
      >
        {hasGoalData ? (
          <ResponsiveContainer>
            <BarChart data={data}>
              <XAxis
                dataKey="goals"
                tick={{ fontSize: 10, fontWeight: 700 }}
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
                  fontSize: "10px",
                  fontWeight: "bold",
                }}
              />
              <Bar dataKey="count" fill={color} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Typography variant="caption" sx={{ opacity: 0.4, fontWeight: 600 }}>
            No Goal Data
          </Typography>
        )}
      </Box>
    </Box>
  );
};

const SectionTitle = ({ children }) => (
  <Typography
    variant="caption"
    sx={{
      mb: 0.5,
      display: "block",
      fontWeight: 900,
      letterSpacing: 1,
      color: "text.secondary",
    }}
  >
    {children}
  </Typography>
);

const LegendItem = ({ color, label }) => (
  <Stack direction="row" alignItems="center" spacing={1}>
    <Box sx={{ width: 12, height: 12, bgcolor: color, borderRadius: "4px" }} />
    <Typography variant="caption" sx={{ fontSize: "0.75rem", fontWeight: 700 }}>
      {label}
    </Typography>
  </Stack>
);
