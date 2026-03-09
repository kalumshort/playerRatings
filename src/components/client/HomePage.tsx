"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Stack,
  Chip,
  IconButton,
  InputBase,
  Button,
  Avatar,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Bolt,
  Search,
  ArrowForward,
  Groups,
  Timeline,
  AutoGraph,
  Psychology,
  TouchApp,
  QueryStats,
  Star,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { teamList } from "@/lib/utils/teamList";

// Update this import to point to your new Next.js data location

// --- FEATURE DATA ---
const features = [
  {
    title: "Predictions",
    desc: "Lock in scorelines before kick-off.",
    icon: <TouchApp color="secondary" />,
  },
  {
    title: "Pre-Match MOTM",
    desc: "Call your Man of the Match early.",
    icon: <Star sx={{ color: "#FFC8DD" }} />,
  },
  {
    title: "Consensus XI",
    desc: "Build formations and see fan agreement.",
    icon: <Groups color="primary" />,
  },
  {
    title: "Live Manager",
    desc: "Rate real-time performance and tactics.",
    icon: <Psychology />,
  },
  {
    title: "Live Pulse",
    desc: "Visualize collective fan emotion.",
    icon: <Timeline sx={{ color: "#FFC8DD" }} />,
  },
  {
    title: "Post-Match Ratings",
    desc: "The definitive fan-led rating system.",
    icon: <AutoGraph color="primary" />,
  },
  {
    title: "Data Analytics",
    desc: "Track form charts across the season.",
    icon: <QueryStats color="secondary" />,
  },
];

export default function HomePage() {
  const theme = useTheme() as any;
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTeams = teamList.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const displayedTeams =
    searchTerm.length === 0 ? teamList.slice(0, 4) : filteredTeams;

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh", pb: 10 }}>
      {/* 1. HERO SECTION */}
      <Container
        maxWidth="md"
        sx={{
          pt: { xs: 10, md: 20 },
          pb: { xs: 8, md: 12 },
          textAlign: "center",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <Stack spacing={3} alignItems="center">
            {/* 1. Smaller, sleeker label */}
            <Chip
              label="THE FAN CONSENSUS NETWORK"
              icon={<Bolt sx={{ fontSize: 16 }} />}
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: "primary.main",
                fontWeight: 800,
                borderRadius: 2,
                px: 1,
              }}
            />

            {/* 2. Higher impact, slightly tighter headline */}
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: "3rem", md: "5rem" },
                lineHeight: 0.9,
                letterSpacing: -1,
                fontWeight: 900,
              }}
            >
              OWN YOUR <br />
              <Box component="span" sx={{ color: "secondary.main" }}>
                CLUB'S PULSE
              </Box>
            </Typography>

            {/* 3. Punchier sub-headline */}
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{
                maxWidth: 500,
                fontWeight: 500,
                lineHeight: 1.5,
              }}
            >
              Predict, rate, and define the official consensus. Your voice,
              codified.
            </Typography>
          </Stack>
        </motion.div>
      </Container>

      {/* 2. CLUB SELECTOR */}
      <Container maxWidth="lg" sx={{ mb: 15 }}>
        <Paper
          elevation={0}
          sx={{
            p: 1,
            mb: 8,
            mx: "auto",
            maxWidth: 550,
            display: "flex",
            alignItems: "center",
            borderRadius: 10,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: "blur(10px)",
          }}
        >
          <IconButton sx={{ ml: 1 }} disabled>
            <Search />
          </IconButton>
          <InputBase
            placeholder="Search for your club..."
            sx={{ flex: 1, ml: 1, fontWeight: 600, fontSize: "1.1rem" }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Paper>

        <Grid container spacing={3} justifyContent="center">
          <AnimatePresence mode="popLayout">
            {displayedTeams.map((team, index) => (
              <Grid size={{ xs: 6, sm: 4, md: 3 }} key={team.teamId}>
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ClubCard team={team} />
                </motion.div>
              </Grid>
            ))}
          </AnimatePresence>
        </Grid>
      </Container>

      {/* 3. FEATURES SECTION */}
      <Box sx={{ py: 12 }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            align="center"
            sx={{ mb: 10, fontWeight: 900 }}
          >
            The Ultimate Matchday Companion
          </Typography>

          <Stack spacing={12}>
            {/* Feature 1: The Live Pitch */}
            <Grid container spacing={6} alignItems="center">
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>
                  Real-Time Consensus
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ fontSize: "1.2rem" }}
                >
                  Watch the fan-built lineup shift as the match evolves. See
                  exactly what the community thinks about tactical changes and
                  substitutions in real-time.
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                {/* REPLACE THIS WITH A REAL SCREENSHOT OF YOUR LINEUP COMPONENT */}
                <Paper
                  sx={{
                    ...theme.clay?.card,
                    p: 2,
                    height: 300,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography color="text.disabled">
                    [Screenshot of Lineup.tsx]
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Feature 2: The Fan Mood */}
            <Grid
              container
              spacing={6}
              alignItems="center"
              direction="row-reverse"
            >
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>
                  Visualizing Fan Emotion
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ fontSize: "1.2rem" }}
                >
                  The Pulse tracker aggregates sentiment across thousands of
                  fans. When the stadium goes quiet, our charts tell the story.
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                {/* REPLACE THIS WITH A SCREENSHOT OF MOODSELECTOR/CHART */}
                <Paper
                  sx={{
                    ...theme.clay?.card,
                    p: 2,
                    height: 300,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography color="text.disabled">
                    [Screenshot of MoodAreaChart.tsx]
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}

const ClubCard = ({ team }: { team: any }) => {
  const theme = useTheme() as any;

  return (
    <Link href={`/${team.slug}`} style={{ textDecoration: "none" }}>
      <Paper
        elevation={0}
        sx={{
          ...theme.clay?.card,
          p: 3, // Reduced from 4 for better mobile density
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          height: "100%",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", // Smoother transition
          border: `2px solid transparent`, // Added thickness for clay feel
          "&:hover": {
            borderColor: theme.palette.primary.main,
            transform: "translateY(-4px)", // Add lift on hover
            boxShadow: theme.shadows[4], // Elevated look
          },
        }}
      >
        <Avatar
          src={team.logo}
          alt={team.name}
          sx={{
            width: { xs: 64, md: 80 }, // Dynamic size for mobile
            height: { xs: 64, md: 80 },
            mb: 2,
            bgcolor: "transparent",
          }}
          imgProps={{ style: { objectFit: "contain" } }}
        />

        <Typography
          variant="subtitle1" // Slightly smaller, cleaner text
          sx={{
            mb: 2,
            fontWeight: 900,
            lineHeight: 1.2,
            minHeight: "2.4em", // Ensures alignment even if names are short
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {team.name}
        </Typography>

        <Button
          variant="contained"
          color="primary"
          fullWidth
          disableElevation
          endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
          sx={{
            borderRadius: 3,
            py: 1,
            fontWeight: 900,
            fontSize: "0.85rem", // Compact button text
          }}
        >
          Enter
        </Button>
      </Paper>
    </Link>
  );
};
