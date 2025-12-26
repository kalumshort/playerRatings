import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  IconButton,
  useTheme,
  Grid,
  Fade,
  alpha,
} from "@mui/material";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  YAxis,
  Tooltip as RechartsTooltip,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

// Firebase Logics
import {
  firebaseGetDocument,
  handleFixtureMood,
} from "../../../Firebase/Firebase";

const MOODS = [
  { label: "excited", emoji: "🤩", color: "#FFD700", weight: 100 },
  { label: "happy", emoji: "😄", color: "#4EFF4E", weight: 90 },
  { label: "nervous", emoji: "😬", color: "#FF9100", weight: 50 },
  { label: "sad", emoji: "😢", color: "#1E90FF", weight: 20 },
  { label: "angry", emoji: "😡", color: "#FF4500", weight: 0 },
];

export const MoodSelector = ({ groupId, fixture, currentYear, matchId }) => {
  const theme = useTheme();
  const [matchMoods, setMatchMoods] = useState(null);
  const [particles, setParticles] = useState([]);

  const matchFinished = fixture?.fixture?.status?.long === "Match Finished";
  const matchNotStarted = fixture?.fixture?.status?.short === "NS";
  const timeElapsed = fixture?.fixture?.status?.elapsed || 0;

  useEffect(() => {
    let intervalId;
    const fetchMoods = async () => {
      try {
        const data = await firebaseGetDocument(
          `groups/${groupId}/seasons/${currentYear}/fixtureMoods`,
          matchId
        );
        setMatchMoods(data);
      } catch (error) {
        console.error("Error fetching fixture moods:", error);
      }
    };

    fetchMoods();
    if (!matchNotStarted && !matchFinished) {
      intervalId = setInterval(fetchMoods, 10000);
    }
    return () => clearInterval(intervalId);
  }, [groupId, currentYear, matchId, matchNotStarted, matchFinished]);

  const handleMoodClick = async (mood, e) => {
    if (matchFinished) return;

    const id = Date.now();
    setParticles((prev) => [
      ...prev,
      { id, emoji: mood.emoji, x: e.clientX, y: e.clientY },
    ]);
    setTimeout(
      () => setParticles((prev) => prev.filter((p) => p.id !== id)),
      1000
    );

    await handleFixtureMood({
      groupId,
      currentYear,
      matchId,
      timeElapsed,
      moodKey: mood.label,
    });
  };

  return (
    <Paper
      sx={{
        p: 0,
        mb: 3,
        position: "relative",
        overflow: "hidden",
        backdropFilter: "blur(20px)",
      }}
      elevation={0}
    >
      <Grid container>
        {/* LEFT: Chart Section */}
        <Grid item xs={12} md={8} sx={{ height: 350, position: "relative" }}>
          {matchMoods ? (
            <MoodAreaChart matchMoods={matchMoods} />
          ) : (
            <Box
              sx={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontFamily: "Space Mono" }}
              >
                INITIALIZING PULSE...
              </Typography>
            </Box>
          )}
        </Grid>

        {/* RIGHT: Input Section (Glass Inset) */}
        <Grid
          item
          xs={12}
          md={4}
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            p: 4,
            borderLeft: {
              md: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            },
            bgcolor: alpha(theme.palette.background.default, 0.4),
          }}
        >
          <Typography
            variant="h5"
            sx={{
              textAlign: "center",
              mb: 0.5,
              color: theme.palette.primary.main,
              letterSpacing: 2,
            }}
          >
            ATMOSPHERE
          </Typography>
          <Typography
            variant="caption"
            sx={{ textAlign: "center", mb: 4, display: "block", opacity: 0.7 }}
          >
            LIVE FAN SENTIMENT TRACKER
          </Typography>

          {!matchFinished && !matchNotStarted ? (
            <Box sx={{ textAlign: "center" }}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 2,
                  justifyItems: "center",
                }}
              >
                {MOODS.map((mood) => (
                  <motion.div
                    key={mood.label}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <IconButton
                      onClick={(e) => handleMoodClick(mood, e)}
                      sx={{
                        fontSize: "2rem",
                        background: alpha(mood.color, 0.1),
                        border: `1px solid ${alpha(mood.color, 0.2)}`,
                        width: 64,
                        height: 64,
                        "&:hover": {
                          background: alpha(mood.color, 0.2),
                          boxShadow: `0 0 20px ${alpha(mood.color, 0.4)}`,
                          borderColor: mood.color,
                        },
                      }}
                    >
                      {mood.emoji}
                    </IconButton>
                  </motion.div>
                ))}
              </Box>
            </Box>
          ) : (
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                textAlign: "center",
                bgcolor: alpha(theme.palette.action.disabledBackground, 0.05),
                borderRadius: 2,
              }}
            >
              <Typography variant="button" color="text.secondary">
                {matchNotStarted ? "PRE-MATCH LOBBY" : "MATCH ARCHIVED"}
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
      <ParticleOverlay particles={particles} />
    </Paper>
  );
};

const MoodAreaChart = ({ matchMoods }) => {
  const [hoveredData, setHoveredData] = useState(null);

  const chartData = useMemo(() => {
    if (!matchMoods) return [];
    const data = [];
    const minutes = Object.keys(matchMoods)
      .map(Number)
      .filter((n) => !isNaN(n))
      .sort((a, b) => a - b);

    minutes.forEach((minute) => {
      const bucket = matchMoods[minute];
      let totalScore = 0;
      let totalVotes = 0;
      MOODS.forEach((m) => {
        const count = bucket[m.label] || 0;
        totalScore += count * m.weight;
        totalVotes += count;
      });
      if (totalVotes > 0) {
        data.push({
          minute,
          sentiment: Math.round(totalScore / totalVotes),
          totalVotes,
        });
      }
    });
    return data;
  }, [matchMoods]);

  const lastPoint = chartData[chartData.length - 1] || {
    sentiment: 50,
    totalVotes: 0,
  };
  const activePoint = hoveredData || lastPoint;

  const getStatus = (val) => {
    if (val >= 75) return { label: "ECSTATIC", color: "#4EFF4E" };
    if (val >= 55) return { label: "OPTIMISTIC", color: "#FFD700" };
    if (val >= 35) return { label: "TENSE", color: "#FF9100" };
    if (val >= 15) return { label: "DEFLATED", color: "#1E90FF" };
    return { label: "OUTRAGED", color: "#FF4500" };
  };

  const currentStatus = getStatus(activePoint.sentiment);

  return (
    <Box sx={{ width: "100%", height: "100%", position: "relative" }}>
      <Stack
        sx={{
          position: "absolute",
          top: 30,
          left: 30,
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <Typography
          variant="caption"
          sx={{ letterSpacing: 3, color: "text.secondary" }}
        >
          {hoveredData ? `T + ${hoveredData.minute}'` : "CURRENT PULSE"}
        </Typography>
        <Fade in={true} key={currentStatus.label}>
          <Typography
            variant="h2"
            sx={{
              color: currentStatus.color,
              textShadow: `0 0 30px ${alpha(currentStatus.color, 0.5)}`,
              fontSize: { xs: "2rem", md: "3.5rem" },
            }}
          >
            {currentStatus.label}
          </Typography>
        </Fade>
      </Stack>

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          onMouseMove={(s) =>
            s.activePayload && setHoveredData(s.activePayload[0].payload)
          }
          onMouseLeave={() => setHoveredData(null)}
        >
          <defs>
            <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={currentStatus.color}
                stopOpacity={0.4}
              />
              <stop
                offset="95%"
                stopColor={currentStatus.color}
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <YAxis domain={[0, 100]} hide />
          <RechartsTooltip
            content={<CustomTooltip />}
            cursor={{ stroke: alpha("#fff", 0.2), strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="sentiment"
            stroke={currentStatus.color}
            strokeWidth={4}
            fill="url(#moodGradient)"
            animationDuration={1000}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
};
/**
 * ParticleOverlay handles the visual "pop" of emojis when a user votes.
 * It uses AnimatePresence to handle the exit animations as particles are filtered out.
 */
const ParticleOverlay = ({ particles }) => {
  return (
    <AnimatePresence>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, scale: 0.5, x: 0, y: 0 }}
          animate={{
            opacity: 0,
            y: -150, // Float upwards
            x: (Math.random() - 0.5) * 100, // Slight horizontal drift
            rotate: Math.random() * 50 - 25, // Random tilt
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            position: "fixed",
            left: p.x,
            top: p.y,
            fontSize: "2.5rem",
            pointerEvents: "none",
            zIndex: 9999,
            filter: "drop-shadow(0 0 10px rgba(255,255,255,0.3))",
          }}
        >
          {p.emoji}
        </motion.div>
      ))}
    </AnimatePresence>
  );
};

/**
 * CustomTooltip aligns with the Glassmorphism theme of the site.
 */
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Box
        sx={{
          bgcolor: "rgba(0,0,0,0.85)",
          p: 2,
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 2,
          backdropFilter: "blur(10px)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
        }}
      >
        <Typography
          variant="caption"
          sx={{ color: "rgba(255,255,255,0.5)", display: "block", mb: 0.5 }}
        >
          MATCH MINUTE: {data.minute}'
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: payload[0].color,
              boxShadow: `0 0 10px ${payload[0].color}`,
            }}
          />
          <Typography
            variant="body2"
            sx={{ color: "#fff", fontWeight: "bold" }}
          >
            SENTIMENT: {data.sentiment}%
          </Typography>
        </Stack>
        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)" }}>
          {data.totalVotes} VOTES RECORDED
        </Typography>
      </Box>
    );
  }
  return null;
};
