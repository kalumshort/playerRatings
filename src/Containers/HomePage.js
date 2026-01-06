import React, { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Stack,
  useTheme,
  Chip,
  IconButton,
  InputBase,
  Button,
  alpha,
  Avatar,
  Fade,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  Bolt,
  Search,
  ArrowForward,
  SportsSoccer,
  Groups,
  BarChart,
  FilterList,
} from "@mui/icons-material";
import LivePulseGraph from "./HomePageComponants/LivePulseGraph";
import { teamList } from "../Hooks/Helper_Functions";

// --- DATA SOURCE ---

const HomePage = () => {
  const theme = useTheme();
  const navigate = useNavigate(); // Hook for navigation
  const [searchTerm, setSearchTerm] = useState("");

  // --- LOGIC: SHOW 4 DEFAULT, OR FILTER ALL ON SEARCH ---
  const displayedTeams =
    searchTerm.length === 0
      ? teamList.slice(0, 4) // Show top 4 if empty
      : teamList.filter((team) =>
          team.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        overflowX: "hidden",
      }}
    >
      {/* --- 1. HERO SECTION --- */}
      <Box sx={{ position: "relative", pt: { xs: 8, md: 12 }, pb: 8 }}>
        <Box
          sx={{
            position: "absolute",
            top: "-20%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "80vw",
            height: "80vh",
            background: `radial-gradient(circle, ${alpha(
              theme.palette.primary.main,
              0.15
            )} 0%, transparent 70%)`,
            filter: "blur(100px)",
            zIndex: 0,
            pointerEvents: "none",
          }}
        />

        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
          <Stack alignItems="center" spacing={3} textAlign="center">
            <Chip
              label="FAN CONSENSUS NETWORK"
              color="primary"
              variant="outlined"
              icon={<Bolt />}
              sx={{
                fontWeight: 700,
                backdropFilter: "blur(10px)",
                bgcolor: alpha(theme.palette.background.paper, 0.5),
              }}
            />

            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: "3rem", md: "6rem" },
                letterSpacing: -2,
                lineHeight: 0.9,
                textTransform: "uppercase",
              }}
            >
              JOIN YOUR <br />
              <Box
                component="span"
                sx={{
                  color: "primary.main",
                  textShadow: `0 0 40px ${theme.palette.primary.main}`,
                }}
              >
                CLUB HUB
              </Box>
            </Typography>

            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ maxWidth: "600px", mx: "auto", lineHeight: 1.6 }}
            >
              The 11Votes network is grouped by club. Select your team to
              predict scores, rate players, and define the official fan
              consensus.
            </Typography>
          </Stack>
        </Container>
      </Box>

      {/* --- 2. CLUB SELECTOR GRID --- */}
      <Container maxWidth="lg" sx={{ pb: 15, position: "relative", zIndex: 2 }}>
        {/* Search Bar */}
        <Paper
          elevation={0}
          sx={{
            p: "2px 4px",
            display: "flex",
            alignItems: "center",
            width: "100%",
            maxWidth: 500,
            mx: "auto",
            mb: 4,
            borderRadius: "50px",
            bgcolor: alpha(theme.palette.background.paper, 0.6),
            backdropFilter: "blur(20px)",
            border: `1px solid ${alpha(theme.palette.text.primary, 0.1)}`,
            transition: "all 0.3s ease",
            "&:focus-within": {
              boxShadow: `0 0 0 2px ${theme.palette.primary.main}`,
              transform: "scale(1.02)",
            },
          }}
        >
          <IconButton sx={{ p: "10px" }} aria-label="search">
            <Search />
          </IconButton>
          <InputBase
            sx={{ ml: 1, flex: 1 }}
            placeholder="Search for your club..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <IconButton
              size="small"
              sx={{ mr: 1 }}
              onClick={() => setSearchTerm("")}
            >
              <Typography variant="caption">CLEAR</Typography>
            </IconButton>
          )}
        </Paper>

        <Typography
          variant="caption"
          display="block"
          align="center"
          color="text.secondary"
          sx={{ mb: 3, letterSpacing: 2, opacity: 0.7 }}
        >
          {searchTerm
            ? `SEARCH RESULTS (${displayedTeams.length})`
            : "TRENDING CLUBS"}
        </Typography>

        {/* The Grid */}
        <Grid container spacing={3} justifyContent="center">
          {displayedTeams.length > 0 ? (
            displayedTeams.map((team) => (
              <Grid item xs={6} sm={4} md={3} key={team.teamId}>
                <Fade in={true} timeout={500}>
                  <div>
                    <ClubCard
                      team={team}
                      // --- NAVIGATION LOGIC HERE ---
                      onClick={() => navigate(`/${team.slug}`)}
                    />
                  </div>
                </Fade>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Stack
                alignItems="center"
                spacing={2}
                sx={{ py: 5, opacity: 0.5 }}
              >
                <FilterList sx={{ fontSize: 40 }} />
                <Typography variant="body1">
                  No clubs found matching "{searchTerm}"
                </Typography>
              </Stack>
            </Grid>
          )}
        </Grid>
      </Container>

      {/* --- 3. VALUE PROP / FOOTER --- */}
      <Box
        sx={{
          py: 10,
          borderTop: `1px solid ${theme.palette.divider}`,
          bgcolor: alpha(theme.palette.background.paper, 0.2),
          backdropFilter: "blur(40px)",
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <ConsensusMiniDemo />
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack spacing={4}>
                <Typography variant="h3" sx={{}}>
                  THE SECOND SCREEN EXPERIENCE
                </Typography>
                <FeatureRow
                  icon={<Groups color="primary" />}
                  title="Crowd Intelligence"
                  desc="We aggregate thousands of fan predictions to generate the most accurate expected outcomes."
                />
                <FeatureRow
                  icon={<BarChart color="primary" />}
                  title="Live Player Ratings"
                  desc="Rate every player, every match. See real-time averages as the game unfolds."
                />
                <FeatureRow
                  icon={<SportsSoccer color="primary" />}
                  title="Squad Selection"
                  desc="Submit your ideal Starting XI before kick-off and compare it with the manager's choice."
                />
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

// --- SUB-COMPONENTS ---

const ClubCard = ({ team, onClick }) => {
  const theme = useTheme();

  return (
    <Paper
      onClick={onClick} // Triggers the navigation
      sx={{
        position: "relative",
        height: "200px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        cursor: "pointer",
        overflow: "hidden",
        transition: "all 0.3s ease",
        bgcolor: alpha(theme.palette.background.paper, 0.4),
        backdropFilter: "blur(12px)",
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,

        "&:hover": {
          transform: "translateY(-5px)",
          bgcolor: alpha(theme.palette.background.paper, 0.6),
          boxShadow: `0 12px 40px -10px ${alpha(team.accent, 0.4)}`,
          borderColor: team.accent,
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: "-50%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "150%",
          height: "150%",
          background: `radial-gradient(circle, ${alpha(
            team.accent,
            0.1
          )} 0%, transparent 70%)`,
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      <Stack spacing={2} alignItems="center" sx={{ zIndex: 1, width: "100%" }}>
        <Avatar
          src={team.logo}
          alt={team.name}
          sx={{
            width: 50,
            height: 50,
            bgcolor: "transparent",
            filter: `drop-shadow(0 4px 6px ${alpha("#000", 0.3)})`,
          }}
          imgProps={{
            style: { objectFit: "contain" },
          }}
        />

        <Typography
          variant="h6"
          align="center"
          sx={{
            lineHeight: 1.1,
            px: 2,
          }}
        >
          {team.name}
        </Typography>

        <Button
          size="small"
          endIcon={<ArrowForward />}
          sx={{
            color: theme.palette.text.secondary,
            fontSize: "0.75rem",
            "&:hover": { color: team.accent, bgcolor: "transparent" },
          }}
        >
          Enter Hub
        </Button>
      </Stack>
    </Paper>
  );
};

const FeatureRow = ({ icon, title, desc }) => (
  <Stack direction="row" spacing={2}>
    <Box
      sx={{
        mt: 0.5,
        p: 1.5,
        borderRadius: "12px",
        bgcolor: "rgba(0,0,0,0.05)",
        height: "fit-content",
      }}
    >
      {icon}
    </Box>
    <Box>
      <Typography variant="h6" sx={{ fontSize: "1.1rem", mb: 0.5 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {desc}
      </Typography>
    </Box>
  </Stack>
);

const ConsensusMiniDemo = () => {
  const theme = useTheme();
  return (
    <Paper
      sx={{
        p: 3,
        transform: { md: "rotate(-2deg)" },
        width: "100%",
        maxWidth: "400px",
        mx: "auto",
        border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
        boxShadow: `0 20px 50px -10px ${alpha(
          theme.palette.primary.main,
          0.15
        )}`,
      }}
    >
      <Stack spacing={2}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="caption" sx={{ letterSpacing: 2 }}>
            LIVE CONSENSUS
          </Typography>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: "error.main",
              boxShadow: "0 0 10px red",
            }}
          />
        </Stack>

        <Box
          sx={{
            height: 120,
            bgcolor: alpha(theme.palette.background.default, 0.5),
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <LivePulseGraph />
        </Box>

        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="h2" sx={{ flex: 1 }}>
            4.2
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ flex: 2, lineHeight: 1.2 }}
          >
            Average Rating: <br />
            <span style={{ color: theme.palette.primary.main }}>
              Marcus Rashford
            </span>
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default HomePage;
