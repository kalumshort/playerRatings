import React, { useState } from "react";
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
  Fade,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
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
import { teamList } from "../Hooks/Helper_Functions";

// --- FEATURE DATA ---
const features = [
  {
    title: "Predictions",
    desc: "Lock in your scorelines and team results before kick-off.",
    icon: <TouchApp color="secondary" />,
  },
  {
    title: "Pre-Match MOTM",
    desc: "Call your 'Man of the Match' before the game starts.",
    icon: <Star sx={{ color: "#FFC8DD" }} />,
  },
  {
    title: "Consensus XI",
    desc: "Build your ideal formation and see the % of fans who agree.",
    icon: <Groups color="primary" />,
  },
  {
    title: "Live Manager",
    desc: "Rate performance in real-time and suggest tactical substitutions.",
    icon: <Psychology />,
  },
  {
    title: "Live Pulse",
    desc: "A real-time 'Mood Graph' visualizing collective fan emotion.",
    icon: <Timeline sx={{ color: "#FFC8DD" }} />,
  },
  {
    title: "Post-Match Ratings",
    desc: "The definitive fan-led rating system to praise or expose players.",
    icon: <AutoGraph color="primary" />,
  },
  {
    title: "Data Analytics",
    desc: "Track form charts and leaderboards across the whole season.",
    icon: <QueryStats color="secondary" />,
  },
];

const HomePage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const displayedTeams =
    searchTerm.length === 0
      ? teamList.slice(0, 4)
      : teamList.filter((t) =>
          t.name.toLowerCase().includes(searchTerm.toLowerCase()),
        );

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh", pb: 10 }}>
      {/* 1. HERO SECTION */}
      <Container
        maxWidth="md"
        sx={{ pt: { xs: 8, md: 12 }, pb: 8, textAlign: "center" }}
      >
        <Stack spacing={3} alignItems="center">
          <Chip
            label="FAN CONSENSUS NETWORK"
            icon={<Bolt />}
            sx={{ bgcolor: "primary.main", fontWeight: 900, px: 2, height: 40 }}
          />
          <Typography
            variant="h1"
            sx={{ fontSize: { xs: "3rem", md: "5rem" } }}
          >
            JOIN YOUR <br />
            <Box component="span" sx={{ color: "secondary.main" }}>
              CLUB HUB
            </Box>
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ maxWidth: 600 }}
          >
            Predict scores, rate players, and define the official fan consensus
            for your team.
          </Typography>
        </Stack>
      </Container>

      {/* 2. CLUB SELECTOR */}
      <Container maxWidth="lg" sx={{ mb: 15 }}>
        <Paper
          sx={{
            p: 1,
            mb: 6,
            mx: "auto",
            maxWidth: 500,
            display: "flex",
            alignItems: "center",
            borderRadius: 10,
          }}
        >
          <IconButton sx={{ ml: 1 }}>
            <Search />
          </IconButton>
          <InputBase
            placeholder="Search for your club..."
            sx={{ flex: 1, ml: 1, fontWeight: 500 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Paper>

        <Grid container spacing={3} justifyContent="center">
          {displayedTeams.map((team) => (
            <Grid item xs={6} sm={4} md={3} key={team.teamId}>
              <Fade in timeout={500}>
                <Box>
                  <ClubCard
                    team={team}
                    onClick={() => navigate(`/${team.slug}`)}
                  />
                </Box>
              </Fade>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* 3. FEATURES SECTION */}
      <Box sx={{ py: 10, bgcolor: "rgba(0,0,0,0.02)" }}>
        <Container maxWidth="lg">
          <Typography variant="h3" align="center" sx={{ mb: 8 }}>
            The Second Screen Experience
          </Typography>
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Paper sx={{ height: "100%", padding: 4 }}>
                  <Box
                    sx={{
                      width: 50,
                      height: 50,
                      borderRadius: 3,
                      mb: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "background.default",
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{ fontWeight: 700 }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ lineHeight: 1.7 }}
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
};

// --- SUB-COMPONENT: CLUB CARD ---
const ClubCard = ({ team, onClick }) => (
  <Paper
    variant="clay"
    onClick={onClick}
    sx={{
      p: 4,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      cursor: "pointer",
      textAlign: "center",
      height: "100%",
    }}
  >
    <Avatar
      src={team.logo}
      alt={team.name}
      sx={{
        width: 80,
        height: 80,
        mb: 2,
        bgcolor: "transparent",
        borderRadius: 0,
      }}
      imgProps={{ style: { objectFit: "contain" } }}
    />
    <Typography variant="h6" sx={{ mb: 2, flexGrow: 1 }}>
      {team.name}
    </Typography>
    <Button
      variant="contained"
      color="primary"
      fullWidth
      endIcon={<ArrowForward />}
    >
      Enter Hub
    </Button>
  </Paper>
);

export default HomePage;
