import React, { useState, useEffect } from "react";
import { AreaChart, Area, ResponsiveContainer, YAxis } from "recharts";
import { Box, Typography, Stack, Fade } from "@mui/material";
import { useTheme } from "@mui/material/styles";

// Generates fake mood data
const generateInitialData = () => {
  const data = [];
  let mood = 50;
  for (let i = 0; i < 20; i++) {
    // Random walk to simulate mood swings
    mood = Math.min(100, Math.max(0, mood + (Math.random() - 0.5) * 30));
    data.push({ time: i, mood: Math.round(mood) });
  }
  return data;
};

const LivePulseGraph = () => {
  const theme = useTheme();
  const [data, setData] = useState(generateInitialData());
  const [currentMood, setCurrentMood] = useState(50);

  // Simulate "Live" updates
  useEffect(() => {
    const interval = setInterval(() => {
      setData((prevData) => {
        // Calculate new mood point
        const lastMood = prevData[prevData.length - 1].mood;
        const volatility = 20; // How crazy the fans are reacting
        let newMood = lastMood + (Math.random() - 0.5) * volatility;

        // Keep within 0-100 bounds
        newMood = Math.max(10, Math.min(90, newMood));

        const newData = [
          ...prevData.slice(1),
          { time: Date.now(), mood: newMood },
        ];
        setCurrentMood(newMood);
        return newData;
      });
    }, 1000); // Updates every second

    return () => clearInterval(interval);
  }, []);

  // Determine mood color and label
  const getMoodStatus = (value) => {
    if (value > 75) return { label: "ECSTATIC", color: "#00FF87" }; // Bright Green
    if (value > 45) return { label: "OPTIMISTIC", color: "#FFD700" }; // Gold
    return { label: "FRUSTRATED", color: "#FF4D4D" }; // Red
  };

  const status = getMoodStatus(currentMood);

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* 1. The Header Overlay */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{
          position: "absolute",
          top: 20,
          left: 24,
          right: 24,
          zIndex: 10,
        }}
      >
        <Box>
          <Typography variant="caption">LIVE SENTIMENT</Typography>
          <Fade in={true} key={status.label}>
            <Typography
              variant="h5"
              sx={{
                color: status.color,
                fontWeight: "bold",
                textShadow: `0 0 15px ${status.color}50`,
              }}
            >
              {status.label}
            </Typography>
          </Fade>
        </Box>

        <Box sx={{ textAlign: "right" }}>
          <Typography variant="caption">VOTES/MIN</Typography>
          <Typography variant="h6">
            {Math.floor(Math.random() * 50) + 800}
          </Typography>
        </Box>
      </Stack>

      {/* 2. The Chart */}
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={theme.palette.primary.main}
                stopOpacity={0.4}
              />
              <stop
                offset="95%"
                stopColor={theme.palette.primary.main}
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <YAxis domain={[0, 100]} hide />
          <Area
            type="monotone"
            dataKey="mood"
            stroke={theme.palette.primary.main}
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorMood)"
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* 3. Contextual Event Markers (Fake "Goals/Cards") */}
      <Box
        sx={{
          position: "absolute",
          bottom: 20,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 3,
        }}
      >
        <ChipLabel label="12' GOAL" color="#00FF87" />
        <ChipLabel label="45' HT" color="#888" />
        <ChipLabel label="67' VAR" color="#FFD700" />
      </Box>
    </Box>
  );
};

// Small helper for the timeline markers
const ChipLabel = ({ label, color }) => (
  <Box
    sx={{
      bgcolor: "background.paper",
      border: `1px solid ${color}`,
      color: color,
      px: 1,
      borderRadius: 1,

      fontWeight: "bold",
    }}
  >
    {label}
  </Box>
);

export default LivePulseGraph;
