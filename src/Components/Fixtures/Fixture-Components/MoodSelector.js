import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  IconButton,
  useTheme,
  Grid,
  alpha,
} from "@mui/material";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  YAxis,
  XAxis,
  ReferenceLine,
  Tooltip as RechartsTooltip,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

// Firebase Logics
import {
  firebaseGetDocument,
  handleFixtureMood,
} from "../../../Firebase/Firebase";

/**
 * MOOD CONFIGURATION
 * Weights define how much each emoji contributes to the 0-100 score.
 */
const PALETTE = {
  EXCITED: "#B4E7B4", // Muted Matcha
  HAPPY: "#F9E59B", // Soft Butter
  NERVOUS: "#FFCC99", // Peach Clay
  SAD: "#B8C9F2", // Dusty Periwinkle
  ANGRY: "#F2B1B1", // Blushed Coral
};

const MOODS = [
  { label: "excited", emoji: "🤩", color: PALETTE.EXCITED, weight: 100 },
  { label: "happy", emoji: "😄", color: PALETTE.HAPPY, weight: 75 },
  { label: "nervous", emoji: "😬", color: PALETTE.NERVOUS, weight: 50 },
  { label: "sad", emoji: "😢", color: PALETTE.SAD, weight: 25 },
  { label: "angry", emoji: "😡", color: PALETTE.ANGRY, weight: 0 },
];

const getStatus = (val) => {
  if (val >= 80)
    return {
      label: "ECSTATIC",
      color: PALETTE.EXCITED,
      desc: "The stadium is rocking!",
    };
  if (val >= 60)
    return {
      label: "OPTIMISTIC",
      color: PALETTE.HAPPY,
      desc: "Fans are feeling confident.",
    };
  if (val >= 40)
    return {
      label: "TENSE",
      color: PALETTE.NERVOUS,
      desc: "You can feel the nerves.",
    };
  if (val >= 20)
    return {
      label: "DEFLATED",
      color: PALETTE.SAD,
      desc: "Silence in the stands.",
    };
  return {
    label: "OUTRAGED",
    color: PALETTE.ANGRY,
    desc: "The atmosphere is toxic.",
  };
};

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
          matchId,
        );
        setMatchMoods(data);
      } catch (error) {
        console.error("Error fetching fixture moods:", error);
      }
    };

    fetchMoods();
    if (!matchNotStarted && !matchFinished) {
      intervalId = setInterval(fetchMoods, 10000); // Poll every 10s during live match
    }
    return () => clearInterval(intervalId);
  }, [groupId, currentYear, matchId, matchNotStarted, matchFinished]);

  const handleMoodClick = async (mood, e) => {
    if (matchFinished) return;

    // Create particle effect
    const id = Date.now();
    setParticles((prev) => [
      ...prev,
      { id, emoji: mood.emoji, x: e.clientX, y: e.clientY },
    ]);
    setTimeout(
      () => setParticles((prev) => prev.filter((p) => p.id !== id)),
      1000,
    );

    // Save to Firebase
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
        borderRadius: 4,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      }}
      elevation={0}
    >
      <Grid container>
        {/* LEFT: Visual Analytics */}
        <Grid
          item
          xs={12}
          md={8}
          sx={{
            height: 400,
            position: "relative",
            bgcolor: "rgba(0,0,0,0.15)",
          }}
        >
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
                sx={{ fontFamily: "Space Mono", letterSpacing: 2 }}
              >
                INITIALIZING ATMOSPHERE ENGINE...
              </Typography>
            </Box>
          )}
        </Grid>

        {/* RIGHT: User Interaction */}
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
            bgcolor: alpha(theme.palette.background.paper, 0.5),
          }}
        >
          <Typography
            variant="h6"
            sx={{
              textAlign: "center",
              mb: 0.5,
              fontWeight: 800,
              letterSpacing: 1,
            }}
          >
            VIBE CHECK
          </Typography>
          <Typography
            variant="caption"
            sx={{ textAlign: "center", mb: 4, display: "block", opacity: 0.6 }}
          >
            SHARE YOUR EMOTION TO UPDATE THE PULSE
          </Typography>

          {!matchFinished && !matchNotStarted ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 2,
                justifyItems: "center",
              }}
            >
              {MOODS.map((mood) => (
                <IconButton
                  key={mood.label}
                  component={motion.button}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.85 }}
                  onClick={(e) => handleMoodClick(mood, e)}
                  sx={{
                    fontSize: "2.2rem",
                    background: alpha(mood.color, 0.1),
                    border: `1px solid ${alpha(mood.color, 0.2)}`,
                    width: 72,
                    height: 72,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      background: alpha(mood.color, 0.2),
                      boxShadow: `0 0 25px ${alpha(mood.color, 0.4)}`,
                      borderColor: mood.color,
                    },
                  }}
                >
                  {mood.emoji}
                </IconButton>
              ))}
            </Box>
          ) : (
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                textAlign: "center",
                borderRadius: 3,
                bgcolor: "transparent",
                borderStyle: "dashed",
              }}
            >
              <Typography variant="button" color="text.secondary">
                {matchNotStarted
                  ? "LOBBY OPEN - WAITING FOR KICKOFF"
                  : "MATCH ARCHIVED"}
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
    return Object.keys(matchMoods)
      .map(Number)
      .filter((n) => !isNaN(n))
      .sort((a, b) => a - b)
      .map((minute) => {
        const bucket = matchMoods[minute];
        let totalScore = 0;
        let totalVotes = 0;
        MOODS.forEach((m) => {
          const count = bucket[m.label] || 0;
          totalScore += count * m.weight;
          totalVotes += count;
        });
        return {
          minute,
          sentiment: totalVotes > 0 ? Math.round(totalScore / totalVotes) : 50,
          totalVotes,
        };
      });
  }, [matchMoods]);

  const lastPoint = chartData[chartData.length - 1] || {
    sentiment: 50,
    totalVotes: 0,
  };
  const activePoint = hoveredData || lastPoint;
  const status = getStatus(activePoint.sentiment);

  // Define a fixed gradient so the "feeling" of the Y-axis is consistent
  return (
    <Box sx={{ width: "100%", height: "100%", position: "relative", p: 2 }}>
      <Stack
        spacing={0.5}
        sx={{
          position: "absolute",
          top: 25,
          left: 25,
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <Typography
          variant="caption"
          sx={{ letterSpacing: 2, color: "text.secondary", fontWeight: 700 }}
        >
          {hoveredData ? `MINUTE ${hoveredData.minute}'` : "LIVE STADIUM PULSE"}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5 }}>
          <Typography
            variant="h3"
            sx={{ color: status.color, fontWeight: 900 }}
          >
            {status.label}
          </Typography>
          <Typography variant="h5" sx={{ color: status.color, opacity: 0.7 }}>
            {activePoint.sentiment}%
          </Typography>
        </Box>
      </Stack>

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 120, right: 0, left: 0, bottom: 0 }}
          onMouseMove={(s) =>
            s.activePayload && setHoveredData(s.activePayload[0].payload)
          }
          onMouseLeave={() => setHoveredData(null)}
        >
          <defs>
            {/* This gradient stays fixed: Top is Green/Gold, Bottom is Red/Blue */}
            <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
              {/* Excited - Muted Matcha */}
              <stop offset="0%" stopColor="#B4E7B4" stopOpacity={0.9} />

              {/* Happy - Soft Butter */}
              <stop offset="33%" stopColor="#F9E59B" stopOpacity={0.7} />

              {/* Nervous - Peach Clay */}
              <stop offset="66%" stopColor="#FFCC99" stopOpacity={0.5} />

              {/* Angry - Blushed Coral */}
              <stop offset="100%" stopColor="#F2B1B1" stopOpacity={0.2} />
            </linearGradient>
          </defs>

          <YAxis domain={[0, 100]} hide />
          <XAxis dataKey="minute" hide />
          <ReferenceLine
            y={50}
            stroke="rgba(255,255,255,0.2)"
            strokeDasharray="3 3"
          />

          <Area
            type="monotone"
            dataKey="sentiment"
            stroke={status.color} // The line color still changes to match the current vibe
            strokeWidth={3}
            fill="url(#moodGradient)"
            animationDuration={800}
          />
          <RechartsTooltip
            content={<CustomTooltip />}
            cursor={{ stroke: "#fff", strokeOpacity: 0.2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
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
            y: -180,
            x: (Math.random() - 0.5) * 120,
            rotate: Math.random() * 60 - 30,
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{
            position: "fixed",
            left: p.x,
            top: p.y,
            fontSize: "2.8rem",
            pointerEvents: "none",
            zIndex: 9999,
            filter: "drop-shadow(0 0 12px rgba(255,255,255,0.4))",
          }}
        >
          {p.emoji}
        </motion.div>
      ))}
    </AnimatePresence>
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const info = getStatus(data.sentiment);

    return (
      <Box
        sx={{
          bgcolor: "rgba(10,10,10,0.9)",
          p: 2,
          border: `1px solid ${alpha(info.color, 0.3)}`,
          borderRadius: 2,
          backdropFilter: "blur(12px)",
          boxShadow: "0 15px 35px rgba(0,0,0,0.6)",
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            display: "block",
            mb: 1,
            fontWeight: "bold",
          }}
        >
          MINUTE {data.minute}' REPORT
        </Typography>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              bgcolor: info.color,
              boxShadow: `0 0 10px ${info.color}`,
            }}
          />
          <Typography variant="body1" sx={{ color: "#fff", fontWeight: 800 }}>
            {info.label} ({data.sentiment}%)
          </Typography>
        </Stack>
        <Typography
          variant="caption"
          sx={{ color: alpha("#fff", 0.5), mt: 0.5, display: "block" }}
        >
          BASED ON {data.totalVotes} FAN REACTIONS
        </Typography>
      </Box>
    );
  }
  return null;
};
