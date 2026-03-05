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
        sx={{ pt: { xs: 8, md: 15 }, pb: 8, textAlign: "center" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Stack spacing={4} alignItems="center">
            <Chip
              label="FAN CONSENSUS NETWORK"
              icon={<Bolt />}
              sx={{
                bgcolor: "primary.main",
                color: "white",
                fontWeight: 900,
                px: 2,
                height: 42,
                boxShadow: theme.shadows[4],
              }}
            />
            <Typography
              variant="h1"
              sx={{ fontSize: { xs: "3.2rem", md: "5.5rem" }, lineHeight: 1 }}
            >
              JOIN YOUR <br />
              <Box component="span" sx={{ color: "secondary.main" }}>
                CLUB HUB
              </Box>
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ maxWidth: 600, opacity: 0.8 }}
            >
              Predict scores, rate players, and define the official fan
              consensus for your team.
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
      <Box
        sx={{
          py: 12,
          bgcolor: alpha(theme.palette.primary.main, 0.03),
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            align="center"
            sx={{ mb: 10, fontWeight: 900 }}
          >
            The Second Screen Experience
          </Typography>
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                <Paper
                  elevation={0}
                  sx={{
                    ...theme.clay?.card,
                    height: "100%",
                    p: 4,
                    bgcolor: "background.paper",
                    transition: "transform 0.3s ease",
                    "&:hover": { transform: "translateY(-5px)" },
                  }}
                >
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 3,
                      mb: 3,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{ fontWeight: 800 }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ lineHeight: 1.6 }}
                  >
                    {feature.desc}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}

// --- SUB-COMPONENT: CLUB CARD ---
const ClubCard = ({ team }: { team: any }) => {
  const theme = useTheme() as any;

  return (
    <Link href={`/${team.slug}`} style={{ textDecoration: "none" }}>
      <Paper
        elevation={0}
        sx={{
          ...theme.clay?.card,
          p: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          height: "100%",
          cursor: "pointer",
          border: `1px solid transparent`,
          "&:hover": {
            borderColor: theme.palette.primary.main,
            bgcolor: alpha(theme.palette.primary.main, 0.02),
          },
        }}
      >
        <Avatar
          src={team.logo}
          alt={team.name}
          sx={{
            width: 90,
            height: 90,
            mb: 3,
            bgcolor: "transparent",
            borderRadius: 0,
          }}
          imgProps={{ style: { objectFit: "contain" } }}
        />
        <Typography
          variant="h6"
          sx={{
            mb: 3,
            fontWeight: 800,
            flexGrow: 1,
            minHeight: "3em",
            display: "flex",
            alignItems: "center",
          }}
        >
          {team.name}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          disableElevation
          endIcon={<ArrowForward />}
          sx={{ borderRadius: 4, py: 1, fontWeight: 900 }}
        >
          Enter Hub
        </Button>
      </Paper>
    </Link>
  );
};
