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
} from "@mui/material";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  YAxis,
  Tooltip as RechartsTooltip,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

// Import your existing Firebase logic
import {
  firebaseGetDocument,
  handleFixtureMood,
} from "../../../Firebase/Firebase";

// --- CONSTANTS ---
// Updated Constants
const MOODS = [
  { label: "happy", emoji: "😄", color: "#4EFF4E", weight: 90 }, // Neon Green
  { label: "excited", emoji: "🤩", color: "#FFD700", weight: 100 }, // Gold
  { label: "nervous", emoji: "😬", color: "#FF9100", weight: 50 }, // Deep Orange (Changed from Pink)
  { label: "sad", emoji: "😢", color: "#1E90FF", weight: 20 }, // Dodger Blue
  { label: "angry", emoji: "😡", color: "#FF4500", weight: 0 }, // Red
];

const MoodSelector = ({ groupId, fixture, currentYear, matchId }) => {
  const theme = useTheme();
  const [matchMoods, setMatchMoods] = useState(null);
  const [particles, setParticles] = useState([]);

  const matchFinished = fixture?.fixture?.status?.long === "Match Finished";
  const matchNotStated = fixture?.fixture?.status?.short === "NS";
  const timeElapsed = fixture?.fixture?.status?.elapsed || 0;

  // --- DATA FETCHING ---
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

    if (!matchNotStated && !matchFinished) {
      intervalId = setInterval(fetchMoods, 10000);
    }
    return () => clearInterval(intervalId);
  }, [groupId, currentYear, matchId, matchNotStated, matchFinished]);

  // --- HANDLERS ---
  const handleMoodClick = async (mood, e) => {
    if (matchFinished) return;

    // 1. Create Particle Effect
    const id = Date.now();
    setParticles((prev) => [
      ...prev,
      { id, emoji: mood.emoji, x: e.clientX, y: e.clientY },
    ]);

    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== id));
    }, 1000);

    // 2. Send Data
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
        bgcolor: theme.palette.mode === "dark" ? "#0a0a0a" : "#fff",
        border: `1px solid ${theme.palette.divider}`,
      }}
      elevation={0}
      className="containerMargin"
    >
      <Grid container>
        {/* LEFT: Chart Section */}
        <Grid item xs={12} md={8} sx={{ height: 300, position: "relative" }}>
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
              <Typography variant="body2" color="text.secondary">
                Waiting for match data...
              </Typography>
            </Box>
          )}
        </Grid>

        {/* RIGHT: Input Section */}
        <Grid
          item
          xs={12}
          md={4}
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            p: 3,
            borderLeft: { md: `1px solid ${theme.palette.divider}` },
            borderTop: { xs: `1px solid ${theme.palette.divider}`, md: "none" },
            backdropFilter: "blur(20px)",
            bgcolor: "background.paper",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              textTransform: "uppercase",
              textAlign: "center",
              mb: 1,
            }}
          >
            FAN ATMOSPHERE
          </Typography>

          {!matchFinished && !matchNotStated ? (
            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="body2"
                sx={{
                  mb: 3,

                  fontSize: "0.8rem",
                }}
              >
                Tap to influence the pulse
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1.5,
                  justifyContent: "center",
                }}
              >
                {MOODS.map((mood) => (
                  <motion.div
                    key={mood.label}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <IconButton
                      onClick={(e) => handleMoodClick(mood, e)}
                      sx={{
                        fontSize: "1.8rem",
                        background: `${mood.color}15`,
                        border: `1px solid ${mood.color}30`,
                        width: 50,
                        height: 50,
                        transition: "all 0.2s",
                        "&:hover": {
                          background: `${mood.color}30`,
                          boxShadow: `0 0 15px ${mood.color}50`,
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
            <Box sx={{ textAlign: "center", p: 2 }}>
              <Typography variant="caption">
                {matchNotStated ? "Match Start Pending" : "Voting Closed"}
              </Typography>
            </Box>
          )}
        </Grid>
      </Grid>

      {/* GLOBAL PARTICLE OVERLAY */}
      <ParticleOverlay particles={particles} />
    </Paper>
  );
};

// --- SUB-COMPONENT: LIVE PULSE GRAPH ---
const MoodAreaChart = ({ matchMoods }) => {
  // State to track user interaction
  const [hoveredData, setHoveredData] = useState(null);

  // Transform Data
  const chartData = useMemo(() => {
    if (!matchMoods) return [];

    const data = [];
    const minutes = Object.keys(matchMoods)
      .map(Number)
      .filter((n) => !isNaN(n))
      .sort((a, b) => a - b);

    minutes.forEach((minute) => {
      const bucket = matchMoods[minute];
      if (!bucket) return;

      let totalScore = 0;
      let totalVotes = 0;

      MOODS.forEach((m) => {
        const count = bucket[m.label] || 0;
        totalScore += count * m.weight;
        totalVotes += count;
      });

      if (totalVotes > 0) {
        const sentiment = totalScore / totalVotes;
        data.push({
          minute,
          sentiment: Math.round(sentiment),
          totalVotes,
        });
      }
    });

    return data;
  }, [matchMoods]);

  // Determine current status based on interaction or live data
  const lastPoint =
    chartData.length > 0
      ? chartData[chartData.length - 1]
      : { sentiment: 50, totalVotes: 0 };

  // If user is hovering, use that point. Otherwise, use the latest live point.
  const activePoint = hoveredData || lastPoint;

  const getStatus = (val) => {
    if (val >= 75) return { label: "ECSTATIC", color: "#00FF87" }; // Green
    if (val >= 55) return { label: "OPTIMISTIC", color: "#FFD700" }; // Gold

    // Orange Bridge (54 - 30)
    if (val >= 30) return { label: "NERVOUS", color: "#FF9100" };

    // Blue Zone (29 - 10)
    if (val >= 10) return { label: "DISAPPOINTED", color: "#1E90FF" };

    // Red Zone (9 - 0)
    return { label: "FRUSTRATED", color: "#FF4500" };
  };
  const currentStatus = getStatus(activePoint.sentiment);
  const activeColor = currentStatus.color;

  return (
    <Box sx={{ width: "100%", height: "100%", position: "relative" }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        sx={{
          position: "absolute",
          top: 20,
          left: 24,
          right: 24,
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <Box>
          <Typography
            variant="caption"
            sx={{
              fontWeight: "bold",
            }}
          >
            {hoveredData ? `MINUTE ${hoveredData.minute}` : "LIVE SENTIMENT"}
          </Typography>
          <Fade in={true} key={currentStatus.label}>
            <Typography
              variant="h4"
              sx={{
                color: activeColor,

                lineHeight: 0.8,
                textShadow: `0 0 20px ${activeColor}40`,
                transition: "color 0.3s ease", // Smooth color transition text
              }}
            >
              {currentStatus.label}
            </Typography>
          </Fade>
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Typography variant="caption">INTENSITY</Typography>
          <Typography
            variant="h5"
            sx={{
              lineHeight: 0.8,
            }}
          >
            {activePoint.totalVotes || 0}
          </Typography>
        </Box>
      </Stack>

      {/* 2. THE AREA CHART */}
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
          onMouseMove={(state) => {
            if (
              state.isTooltipActive &&
              state.activePayload &&
              state.activePayload.length > 0
            ) {
              setHoveredData(state.activePayload[0].payload);
            }
          }}
          onMouseLeave={() => setHoveredData(null)}
        >
          <defs>
            {/* Dynamic Gradient based on Active Color */}
            <linearGradient id="colorSentiment" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={activeColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={activeColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis domain={[0, 100]} hide />
          <RechartsTooltip
            content={<CustomTooltip />}
            cursor={{ stroke: "rgba(255,255,255,0.2)", strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="sentiment"
            stroke={activeColor}
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorSentiment)"
            isAnimationActive={false}
            // Smoothly transition the color properties using CSS transition if Recharts supports style here,
            // otherwise React re-render handles it.
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Box
        sx={{
          bgcolor: "rgba(0,0,0,0.8)",
          p: 1.5,
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 2,
          backdropFilter: "blur(4px)",
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: "#aaa",
          }}
        >
          MINUTE {data.minute}
        </Typography>
        <Typography variant="body2" sx={{ color: "#fff", fontWeight: "bold" }}>
          Sentiment: {data.sentiment}%
        </Typography>
      </Box>
    );
  }
  return null;
};

const ParticleOverlay = ({ particles }) => {
  return (
    <AnimatePresence>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, scale: 0.5, x: 0, y: 0 }}
          animate={{
            opacity: 0,
            y: -150,
            x: (Math.random() - 0.5) * 100,
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            position: "fixed",
            left: p.x,
            top: p.y,
            fontSize: "2rem",
            pointerEvents: "none",
            zIndex: 9999,
          }}
        >
          {p.emoji}
        </motion.div>
      ))}
    </AnimatePresence>
  );
};

export default MoodSelector;
