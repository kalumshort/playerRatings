import React from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Paper,
  Stack,
  useTheme,
  Chip,
} from "@mui/material";
import {
  TrendingUp,
  Poll,
  Groups,
  ArrowForward,
  Bolt,
} from "@mui/icons-material";
import LivePulseGraph from "./HomePageComponants/LivePulseGraph";

// We import your custom hook if you want to add a toggle button,
// otherwise we just need the standard MUI hook for palette access.
// import { useTheme as useCustomTheme } from './YourThemePath';

const HomePage = () => {
  const theme = useTheme(); // Access the active theme variables (colors, spacing)

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default", // Uses your "Rich black-gray" or "Soft clean gray-blue"
        color: "text.primary",
        transition: "background-color 0.3s ease",
      }}
    >
      {/* --- HERO SECTION --- */}
      {/* We use the gradient defined in your theme object */}
      <Box
        sx={{
          pt: { xs: 12, md: 20 },
          pb: { xs: 8, md: 12 },
          background: theme.palette.background.gradient,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 2 }}>
          <Stack spacing={4} alignItems="center" textAlign="center">
            {/* Pill Badge */}
            <Chip
              icon={<Bolt />}
              label="Live Fan Intelligence"
              color="primary"
              variant="outlined"
              sx={{
                borderWidth: 2,
              }}
            />

            {/* Main Heading (Triggers VT323 Font) */}
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: "3.5rem", md: "6rem" },
                textShadow:
                  theme.palette.mode === "dark"
                    ? "0 0 20px rgba(255,255,255,0.1)"
                    : "none",
              }}
            >
              YOUR TEAM. <br />
              YOUR{" "}
              <Box component="span" sx={{ color: "primary.main" }}>
                VOICE.
              </Box>
            </Typography>

            {/* Subtitle (Triggers Space Mono) */}
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ maxWidth: "700px", lineHeight: 1.6 }}
            >
              The first app that quantifies the passion of the stands. Predict
              lineups, rate players, and track the{" "}
              <strong>Live Fan Pulse</strong> in real-time.
            </Typography>

            {/* CTA Buttons */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={3}
              sx={{ mt: 4, width: { xs: "100%", sm: "auto" } }}
            >
              <Button
                variant="contained"
                color="primary"
                size="large"
                endIcon={<ArrowForward />}
                fullWidth
              >
                Find My Club
              </Button>
              <Button variant="outlined" color="inherit" size="large" fullWidth>
                See Live Demo
              </Button>
            </Stack>
          </Stack>
        </Container>

        {/* Abstract Background Element (Matches your accent color) */}
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "60vw",
            height: "60vw",
            bgcolor: "primary.main",
            opacity: 0.05,
            filter: "blur(100px)",
            borderRadius: "50%",
            zIndex: 0,
            pointerEvents: "none",
          }}
        />
      </Box>

      {/* --- FEATURES GRID --- */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Grid container spacing={4}>
          {/* Card 1: Pre-Match */}
          <Grid item xs={12} md={4}>
            <FeatureCard
              icon={<Groups fontSize="inherit" />}
              title="The Manager"
              subtitle="Pre-Match"
              desc="Build your predicted Starting XI. Compare your tactical choices with the community consensus before the team sheet drops."
            />
          </Grid>

          {/* Card 2: In-Play (Highlighted) */}
          <Grid item xs={12} md={4}>
            <FeatureCard
              icon={<TrendingUp fontSize="inherit" />}
              title="The Atmosphere"
              subtitle="In-Play"
              desc="Log your mood instantly. Watch the 'Fan Pulse' graph shift from Optimism to Despair in real-time as the match unfolds."
              highlight
            />
          </Grid>

          {/* Card 3: Post-Match */}
          <Grid item xs={12} md={4}>
            <FeatureCard
              icon={<Poll fontSize="inherit" />}
              title="The Verdict"
              subtitle="Post-Match"
              desc="Rate every player out of 10. Decide who was Man of the Match and who went missing when it mattered most."
            />
          </Grid>
        </Grid>
      </Container>

      {/* --- DEEP DIVE SECTION --- */}
      <Box sx={{ borderTop: `1px solid ${theme.palette.divider}`, py: 10 }}>
        <Container maxWidth="lg">
          <Grid container spacing={8} alignItems="center">
            {/* Text Side */}
            <Grid item xs={12} md={6}>
              <Typography
                variant="overline"
                color="primary"
                sx={{ fontWeight: "bold", letterSpacing: 2 }}
              >
                Data Visualization
              </Typography>
              <Typography variant="h2" gutterBottom sx={{ mt: 1 }}>
                FEEL THE PULSE
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Football isn't just about stats; it's about feelings. We
                aggregate thousands of live reactions to generate a real-time
                "Mood Graph" for your club.
              </Typography>

              <Stack spacing={2} sx={{ mt: 4 }}>
                <ListItem text="Track confidence levels minute-by-minute." />
                <ListItem text="Compare your mood vs the global fanbase." />
                <ListItem text="React to VAR decisions instantly." />
              </Stack>
            </Grid>

            {/* Visual Side (Uses your Glass Paper) */}
            <Grid item xs={12} md={6}>
              <Paper
                sx={{
                  height: 350, // Slightly taller to fit the graph nicely
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  // We remove the padding here so the graph touches the edges
                  p: 0,
                  border: `1px solid ${theme.palette.divider}`,
                  overflow: "hidden",
                }}
              >
                {/* IMPORT THE COMPONENT HERE */}
                <LivePulseGraph />
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* --- FOOTER SIMPLIFIED --- */}
      <Box
        sx={{
          borderTop: `1px solid ${theme.palette.divider}`,
          py: 6,
          textAlign: "center",
        }}
      >
        <Typography variant="h4" sx={{ mb: 1 }}>
          11VOTES
        </Typography>
        <Typography variant="caption" color="text.secondary">
          © {new Date().getFullYear()} BUILT FOR THE FANS
        </Typography>
      </Box>
    </Box>
  );
};

// --- SUB-COMPONENTS ---

// A reusable card that strictly follows your ThemeProvider's overrides
const FeatureCard = ({ icon, title, subtitle, desc, highlight }) => {
  const theme = useTheme();

  return (
    <Paper
      sx={{
        p: 4,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        // If highlighted, we add a subtle glow using the primary color
        ...(highlight && {
          borderColor: theme.palette.primary.main,
          boxShadow: `0 0 20px -5px ${theme.palette.primary.main}40`,
        }),
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="start"
        sx={{ mb: 3 }}
      >
        <Box
          sx={{
            color: highlight ? "primary.main" : "text.primary",
            fontSize: 40,
          }}
        >
          {icon}
        </Box>
        <Typography
          variant="caption"
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            px: 1,
            py: 0.5,
            borderRadius: 1,

            textTransform: "uppercase",
          }}
        >
          {subtitle}
        </Typography>
      </Stack>

      <Typography variant="h4" gutterBottom>
        {title}
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ flexGrow: 1 }}>
        {desc}
      </Typography>

      <Box sx={{ mt: 4 }}>
        <Button
          variant={highlight ? "contained" : "text"}
          color={highlight ? "primary" : "inherit"}
          size="small"
          endIcon={<ArrowForward />}
        >
          Try It
        </Button>
      </Box>
    </Paper>
  );
};

const ListItem = ({ text }) => (
  <Stack direction="row" alignItems="center" spacing={2}>
    <Box
      sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "primary.main" }}
    />
    <Typography variant="body1">{text}</Typography>
  </Stack>
);

export default HomePage;
