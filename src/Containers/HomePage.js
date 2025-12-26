import React from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Stack,
  useTheme,
  Chip,
  Divider,
  LinearProgress,
} from "@mui/material";
import { Bolt } from "@mui/icons-material";

import LivePulseGraph from "./HomePageComponants/LivePulseGraph";

import { Sensors, TrendingUp } from "@mui/icons-material";
import Login from "../Components/Auth/Login";
import GoogleSignInButton from "../Components/Auth/SignInMethods/GoogleSignInButton";

const HomePage = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        overflow: "hidden",
      }}
    >
      {/* --- 1. DYNAMIC HERO SECTION --- */}
      <Box sx={{ position: "relative", pt: { xs: 10, md: 15 }, pb: 10 }}>
        {/* Animated Background Blur */}
        <Box
          sx={{
            position: "absolute",
            top: "-10%",
            right: "-5%",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${theme.palette.primary.main}20 0%, transparent 70%)`,
            filter: "blur(80px)",
            zMount: 0,
          }}
        />

        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Stack spacing={3}>
                <Chip
                  label="V0.8 LIVE: AGGREGATED FAN INTELLIGENCE"
                  color="primary"
                  variant="outlined"
                  icon={<Bolt />}
                  sx={{
                    width: "fit-content",
                    fontFamily: "'Space Mono'",
                    fontWeight: 700,
                  }}
                />
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: "3.5rem", md: "5.5rem" },
                    letterSpacing: -2,
                  }}
                >
                  DON'T JUST WATCH.
                  <br />
                  <Box
                    component="span"
                    sx={{
                      color: "primary.main",
                      textShadow: `0 0 30px ${theme.palette.primary.main}60`,
                    }}
                  >
                    COMMAND.
                  </Box>
                </Typography>
                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{ maxWidth: "500px", mb: 2 }}
                >
                  11Votes converts the roar of the crowd into actionable fan
                  data. Predict the XI and score, log the live match-day mood,
                  and rate player performances to define the official community
                  consensus.
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <GoogleSignInButton text="Join Fellow Supporters" />
                </Stack>
              </Stack>
            </Grid>

            {/* Hero Visual: The "Consensus Card" */}
            <Grid item xs={12} md={5} sx={{ display: { md: "block" } }}>
              <ConsensusMiniDemo />
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Box
        sx={{
          py: 15,
          background:
            theme.palette.mode === "dark"
              ? "rgba(255,255,255,0.02)"
              : "rgba(0,0,0,0.02)",
        }}
      >
        <Container maxWidth="md" sx={{ textAlign: "center" }}>
          <Typography variant="h4">READY TO CAST YOUR VOTE?</Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 5, fontSize: "1.2rem" }}
          >
            Join fellow supporters creating the most accurate fan-data in
            football.
          </Typography>
          <Login />
        </Container>
      </Box>
    </Box>
  );
};

const ConsensusMiniDemo = () => {
  return (
    <Paper
      sx={{
        p: { xs: 2.5, sm: 4 }, // Tightened padding for mobile

        position: "relative",
        // Subtle tilt removed on mobile to prevent overflow issues
        transform: { xs: "none", md: "rotate(1.5deg)" },
        width: "100%",
        maxWidth: { xs: "360px", sm: "450px" },
        mx: "auto",
      }}
    >
      <Stack spacing={2.5}>
        {/* Header: Live Stats Ticker */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          spacing={1}
        >
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Sensors sx={{ color: "primary.main", fontSize: 18 }} />
            <Typography
              variant="h6"
              sx={{ fontSize: "1.1rem", fontFamily: "'VT323'" }}
            >
              LIVE CONSENSUS
            </Typography>
          </Stack>
          <Chip
            label="1.2k VOTING"
            size="small"
            sx={{
              height: 20,
              fontSize: "0.6rem",
              fontFamily: "'Space Mono'",
              bgcolor: "primary.main",
              color: "#000",
              fontWeight: 800,
            }}
          />
        </Stack>

        {/* Graph Section: Increased height for mobile legibility */}
        <Box>
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <TrendingUp sx={{ fontSize: 12, opacity: 0.6 }} />
            <Typography
              variant="caption"
              sx={{ letterSpacing: 1, fontSize: "0.65rem" }}
            >
              REAL-TIME FAN MOOD
            </Typography>
          </Stack>
          <Box
            sx={{
              height: { xs: 150 },
              borderRadius: 2,
              bgcolor: "rgba(0,0,0,0.15)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <LivePulseGraph />
          </Box>
        </Box>

        <Divider sx={{ opacity: 0.1 }} />

        {/* Aggregate Stats: Vertical on extra-small, Horizontal on small+ */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5}>
          {/* Item 1: Score */}
          <Box sx={{ flex: 1 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="baseline"
            >
              <Typography variant="caption" color="text.secondary">
                PREDICTED
              </Typography>
              <Typography variant="h4" sx={{ fontFamily: "'VT323'" }}>
                3-1
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={68}
              sx={{
                height: 4,
                borderRadius: 2,
                my: 0.5,
                bgcolor: "rgba(255,255,255,0.05)",
              }}
            />
            <Typography
              variant="caption"
              sx={{ fontSize: "0.6rem", opacity: 0.6 }}
            >
              68% Fan Consensus
            </Typography>
          </Box>

          {/* Item 2: MOTM */}
          <Box sx={{ flex: 1 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="baseline"
            >
              <Typography variant="caption" color="text.secondary">
                MOTM
              </Typography>
              <Typography variant="h5" color="primary">
                Bruno F.
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={82}
              color="primary"
              sx={{
                height: 4,
                borderRadius: 2,
                my: 0.5,
                bgcolor: "rgba(255,255,255,0.05)",
              }}
            />
            <Typography
              variant="caption"
              sx={{ fontSize: "0.6rem", opacity: 0.6 }}
            >
              82% of total votes
            </Typography>
          </Box>
        </Stack>
      </Stack>
    </Paper>
  );
};

// Standard glass effect from our architecture

export default HomePage;
