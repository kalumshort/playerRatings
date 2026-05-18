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
import { Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { teamList } from "@/lib/utils/teamList";
import AuthDialog from "@/components/client/Auth/AuthDialog";
import MoodAreaChart from "@/components/client/Fixture/Components/FanMoodSelector/MoodAreaChart";

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

const whyPoints = [
  {
    title: "Fan-led, not pundit-led",
    desc: "The XI is what fans pick. The MOTM is what fans vote. No expert panels, no algorithms — just the people who watched.",
    icon: <Groups color="primary" sx={{ fontSize: 32 }} />,
  },
  {
    title: "Built for the 90 minutes",
    desc: "Pre-match predictions, live mood, post-match ratings — every tool is designed around the rhythm of matchday.",
    icon: <Bolt color="secondary" sx={{ fontSize: 32 }} />,
  },
  {
    title: "Your club, your terrace",
    desc: "Every club gets its own consensus space. Your votes, your XI, your verdict — where it actually matters.",
    icon: <Star sx={{ color: "#FFC8DD", fontSize: 32 }} />,
  },
];

const scrollToClubs = () => {
  if (typeof window === "undefined") return;
  const el = document.getElementById("clubs");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

export default function HomePage() {
  const theme = useTheme() as any;
  const [searchTerm, setSearchTerm] = useState("");
  const [authOpen, setAuthOpen] = useState(false);

  const filteredTeams = teamList.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const displayedTeams =
    searchTerm.length === 0 ? teamList.slice(0, 4) : filteredTeams;

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh", pb: 0 }}>
      {/* 1. HERO */}
      <Container
        maxWidth="md"
        sx={{
          pt: { xs: 10, md: 18 },
          pb: { xs: 6, md: 10 },
          textAlign: "center",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <Stack spacing={3} alignItems="center">
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

            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ maxWidth: 540, fontWeight: 500, lineHeight: 1.5 }}
            >
              Predict the result. Build the XI. Rate the performance. 11Votes
              turns thousands of fan voices into one official matchday
              consensus — for every club.
            </Typography>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ pt: 2, width: { xs: "100%", sm: "auto" } }}
            >
              <Button
                onClick={() => setAuthOpen(true)}
                size="large"
                sx={{
                  ...theme.clay?.button,
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  px: 4,
                  py: 1.5,
                  fontSize: "1rem",
                  fontWeight: 900,
                }}
                endIcon={<ArrowForward />}
              >
                Sign up free
              </Button>
              <Button
                onClick={scrollToClubs}
                size="large"
                sx={{
                  ...theme.clay?.button,
                  px: 4,
                  py: 1.5,
                  fontSize: "1rem",
                  fontWeight: 900,
                }}
              >
                Browse clubs
              </Button>
            </Stack>
          </Stack>
        </motion.div>
      </Container>

      {/* 2. CLUB SELECTOR */}
      <Container id="clubs" maxWidth="lg" sx={{ scrollMarginTop: 80, mb: 14 }}>
        <Typography
          align="center"
          variant="overline"
          sx={{
            display: "block",
            mb: 2,
            letterSpacing: 2,
            color: "text.secondary",
            fontWeight: 800,
          }}
        >
          NO ACCOUNT NEEDED TO LOOK AROUND
        </Typography>

        <Paper
          sx={{
            p: 1,
            mb: 6,
            mx: "auto",
            maxWidth: 550,
            display: "flex",
            alignItems: "center",
            borderRadius: "10px",
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

      {/* 3. JOURNEY — Three phases. One consensus. */}
      <Box sx={{ py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Stack spacing={2} alignItems="center" sx={{ mb: { xs: 8, md: 12 } }}>
            <Chip
              label="HOW MATCHDAY WORKS"
              sx={{
                bgcolor: alpha(theme.palette.secondary.main, 0.12),
                color: "secondary.main",
                fontWeight: 800,
                borderRadius: 2,
              }}
            />
            <Typography
              variant="h3"
              align="center"
              sx={{ fontWeight: 900, letterSpacing: -1 }}
            >
              Three phases. One consensus.
            </Typography>
            <Typography
              align="center"
              color="text.secondary"
              sx={{ maxWidth: 560, fontSize: "1.1rem" }}
            >
              From the team-sheet leaks to the final whistle, 11Votes captures
              what the terraces are actually thinking.
            </Typography>
          </Stack>

          <Stack spacing={{ xs: 10, md: 16 }}>
            <JourneyRow
              eyebrow="BEFORE KICKOFF"
              title="Predict together"
              body="Lock in your scoreline, pick your Pre-Match Man of the Match, and build the XI you'd start. Watch the fan consensus form in real-time as votes pour in."
              demo={<Phase1Demo />}
            />
            <JourneyRow
              eyebrow="LIVE"
              title="Feel the pulse"
              body="Tap your mood as the match swings. The Live Pulse aggregates the whole stadium's emotion — goals, shocks, frustration, joy — into one shared chart."
              demo={<Phase2Demo />}
              reverse
            />
            <JourneyRow
              eyebrow="FULL TIME"
              title="Crown the MOTM"
              body="Rate every player. The community's votes crown the official Fan Man of the Match — no pundits, no algorithm, just the consensus of the people who watched."
              demo={<Phase3Demo />}
            />
          </Stack>
        </Container>
      </Box>

      {/* 4. FEATURES GRID */}
      <Box sx={{ py: { xs: 8, md: 10 }, bgcolor: alpha(theme.palette.secondary.main, 0.04) }}>
        <Container maxWidth="lg">
          <Typography
            variant="h4"
            align="center"
            sx={{ fontWeight: 900, mb: 1, letterSpacing: -0.5 }}
          >
            Everything you need on matchday
          </Typography>
          <Typography
            align="center"
            color="text.secondary"
            sx={{ mb: 6, fontSize: "1.05rem" }}
          >
            One app. Pre-match to post-match. Every fixture.
          </Typography>

          <Grid container spacing={3} justifyContent="center">
            {features.map((f, i) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={f.title}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                >
                  <Paper
                    sx={{
                      ...theme.clay?.card,
                      p: 3,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      gap: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        display: "grid",
                        placeItems: "center",
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                      }}
                    >
                      {f.icon}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      {f.title}
                    </Typography>
                    <Typography color="text.secondary" sx={{ fontSize: "0.95rem" }}>
                      {f.desc}
                    </Typography>
                  </Paper>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* 5. WHY 11VOTES STRIP */}
      <Box sx={{ py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Typography
            variant="h4"
            align="center"
            sx={{ fontWeight: 900, mb: 6, letterSpacing: -0.5 }}
          >
            Why 11Votes
          </Typography>
          <Grid container spacing={4}>
            {whyPoints.map((w, i) => (
              <Grid size={{ xs: 12, md: 4 }} key={w.title}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <Paper
                    sx={{
                      ...theme.clay?.card,
                      p: 4,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: "10px",
                        display: "grid",
                        placeItems: "center",
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                      }}
                    >
                      {w.icon}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>
                      {w.title}
                    </Typography>
                    <Typography color="text.secondary" sx={{ fontSize: "1rem", lineHeight: 1.6 }}>
                      {w.desc}
                    </Typography>
                  </Paper>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* 6. FINAL CTA */}
      <Box
        sx={{
          py: { xs: 10, md: 14 },
          bgcolor: alpha(theme.palette.primary.main, 0.08),
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Container maxWidth="sm" sx={{ textAlign: "center" }}>
          <Stack spacing={3} alignItems="center">
            <Typography
              variant="h2"
              sx={{
                fontWeight: 900,
                fontSize: { xs: "2.25rem", md: "3rem" },
                letterSpacing: -1,
                lineHeight: 1.05,
              }}
            >
              Your voice. Your XI. Your verdict.
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: "1.15rem", maxWidth: 440 }}>
              Sign up free. No ads. No nonsense. Just football.
            </Typography>
            <Button
              onClick={() => setAuthOpen(true)}
              size="large"
              sx={{
                ...theme.clay?.button,
                bgcolor: "primary.main",
                color: "primary.contrastText",
                px: 5,
                py: 1.75,
                fontSize: "1.1rem",
                fontWeight: 900,
              }}
              endIcon={<ArrowForward />}
            >
              Create your account
            </Button>
            <Box
              component="button"
              onClick={scrollToClubs}
              sx={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "text.secondary",
                fontWeight: 600,
                fontSize: "0.95rem",
                textDecoration: "underline",
                p: 0,
                "&:hover": { color: "primary.main" },
              }}
            >
              or browse clubs first →
            </Box>
          </Stack>
        </Container>
      </Box>

      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} />
    </Box>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// JourneyRow — alternating copy/demo layout
// ────────────────────────────────────────────────────────────────────────────
function JourneyRow({
  eyebrow,
  title,
  body,
  demo,
  reverse = false,
}: {
  eyebrow: string;
  title: string;
  body: string;
  demo: React.ReactNode;
  reverse?: boolean;
}) {
  const theme = useTheme() as any;
  return (
    <Grid
      container
      spacing={{ xs: 4, md: 8 }}
      alignItems="center"
      direction={reverse ? "row-reverse" : "row"}
    >
      <Grid size={{ xs: 12, md: 6 }}>
        <motion.div
          initial={{ opacity: 0, x: reverse ? 30 : -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <Stack spacing={2}>
            <Typography
              variant="overline"
              sx={{
                color: "primary.main",
                fontWeight: 900,
                letterSpacing: 3,
              }}
            >
              {eyebrow}
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 900,
                fontSize: { xs: "2rem", md: "2.75rem" },
                letterSpacing: -0.5,
                lineHeight: 1.1,
              }}
            >
              {title}
            </Typography>
            <Typography
              color="text.secondary"
              sx={{ fontSize: "1.15rem", lineHeight: 1.6, maxWidth: 480 }}
            >
              {body}
            </Typography>
          </Stack>
        </motion.div>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          {demo}
        </motion.div>
      </Grid>
    </Grid>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Phase 1 — Predict together (mini WinnerPredict + Pre-Match MOTM thumbnails)
// ────────────────────────────────────────────────────────────────────────────
const PHASE1_PREDICTION = { home: 47, draw: 22, away: 31 };
const PHASE1_PLAYERS = [
  { name: "M. Carter", initials: "MC", topPick: true, votes: 38 },
  { name: "J. Silva", initials: "JS", topPick: false, votes: 21 },
  { name: "L. Akande", initials: "LA", topPick: false, votes: 14 },
];

function Phase1Demo() {
  const theme = useTheme() as any;
  const p = PHASE1_PREDICTION;
  return (
    <Paper
      sx={{
        ...theme.clay?.card,
        p: { xs: 3, md: 4 },
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      {/* Mini winner predict */}
      <Box>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="baseline"
          sx={{ mb: 1.5 }}
        >
          <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: 2, opacity: 0.6 }}>
            Result prediction
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.5 }}>
            2,481 votes
          </Typography>
        </Stack>
        <Box
          sx={{
            display: "flex",
            height: 38,
            borderRadius: 2,
            overflow: "hidden",
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box
            sx={{
              width: `${p.home}%`,
              bgcolor: "primary.main",
              display: "grid",
              placeItems: "center",
              color: "primary.contrastText",
              fontWeight: 900,
              fontSize: "0.9rem",
            }}
          >
            {p.home}%
          </Box>
          <Box
            sx={{
              width: `${p.draw}%`,
              bgcolor: alpha(theme.palette.text.primary, 0.15),
              display: "grid",
              placeItems: "center",
              fontWeight: 900,
              fontSize: "0.85rem",
            }}
          >
            {p.draw}%
          </Box>
          <Box
            sx={{
              width: `${p.away}%`,
              bgcolor: "secondary.main",
              display: "grid",
              placeItems: "center",
              color: theme.palette.getContrastText(theme.palette.secondary.main),
              fontWeight: 900,
              fontSize: "0.9rem",
            }}
          >
            {p.away}%
          </Box>
        </Box>
        <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 700 }}>HOME</Typography>
          <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.6 }}>DRAW</Typography>
          <Typography variant="caption" sx={{ fontWeight: 700 }}>AWAY</Typography>
        </Stack>
      </Box>

      {/* Pre-Match MOTM mini */}
      <Box>
        <Typography
          variant="overline"
          sx={{ fontWeight: 800, letterSpacing: 2, opacity: 0.6, display: "block", mb: 1.5 }}
        >
          Player to watch
        </Typography>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          {PHASE1_PLAYERS.map((pl) => (
            <Box
              key={pl.name}
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0.75,
              }}
            >
              <Box sx={{ position: "relative" }}>
                <Avatar
                  sx={{
                    width: 56,
                    height: 56,
                    fontWeight: 900,
                    bgcolor: pl.topPick
                      ? alpha(theme.palette.primary.main, 0.2)
                      : alpha(theme.palette.text.primary, 0.08),
                    color: pl.topPick ? "primary.main" : "text.primary",
                    border: pl.topPick
                      ? `1px solid ${theme.palette.primary.main}`
                      : "1px solid transparent",
                  }}
                >
                  {pl.initials}
                </Avatar>
                {pl.topPick && (
                  <Chip
                    label="TOP"
                    size="small"
                    sx={{
                      position: "absolute",
                      bottom: -8,
                      left: "50%",
                      transform: "translateX(-50%)",
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                      fontWeight: 900,
                      fontSize: "0.6rem",
                      height: 18,
                    }}
                  />
                )}
              </Box>
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, mt: pl.topPick ? 1 : 0, textAlign: "center" }}
              >
                {pl.name}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.6 }}>
                {pl.votes}%
              </Typography>
            </Box>
          ))}
        </Stack>
      </Box>
    </Paper>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Phase 2 — Live Pulse (real MoodAreaChart with mock match-mood data)
// ────────────────────────────────────────────────────────────────────────────
// Format: { [minute]: { excited, happy, nervous, sad, angry } }
const PHASE2_MOODS: Record<string, Record<string, number>> = {
  "5":  { excited: 12, happy: 28, nervous: 15, sad: 2,  angry: 1 },
  "12": { excited: 8,  happy: 24, nervous: 22, sad: 6,  angry: 3 },
  "20": { excited: 4,  happy: 14, nervous: 30, sad: 14, angry: 8 },
  "28": { excited: 38, happy: 42, nervous: 8,  sad: 2,  angry: 1 },  // GOAL
  "36": { excited: 22, happy: 38, nervous: 16, sad: 4,  angry: 2 },
  "45": { excited: 14, happy: 28, nervous: 24, sad: 10, angry: 5 },
  "52": { excited: 6,  happy: 12, nervous: 22, sad: 26, angry: 18 }, // CONCEDED
  "60": { excited: 4,  happy: 10, nervous: 28, sad: 24, angry: 22 },
  "68": { excited: 8,  happy: 18, nervous: 30, sad: 16, angry: 10 },
  "76": { excited: 18, happy: 32, nervous: 22, sad: 8,  angry: 4 },
  "84": { excited: 28, happy: 38, nervous: 14, sad: 4,  angry: 2 },
  "89": { excited: 56, happy: 30, nervous: 6,  sad: 2,  angry: 1 },  // WINNER
  "90": { excited: 62, happy: 28, nervous: 4,  sad: 1,  angry: 1 },
};

function Phase2Demo() {
  const theme = useTheme() as any;
  return (
    <Paper
      sx={{
        ...theme.clay?.card,
        height: 320,
        overflow: "hidden",
      }}
    >
      <MoodAreaChart matchMoods={PHASE2_MOODS} />
    </Paper>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Phase 3 — MOTM crown (static replica of FanMOTMHighlight, no Redux)
// ────────────────────────────────────────────────────────────────────────────
const PHASE3_WINNER = { name: "M. CARTER", percentage: 38, initials: "MC" };

function Phase3Demo() {
  const theme = useTheme() as any;
  const w = PHASE3_WINNER;
  const goldStart = theme.palette.motm?.goldStart || "#FFE27A";
  const goldEnd = theme.palette.motm?.goldEnd || "#F5B300";

  return (
    <Paper
      sx={{
        ...theme.clay?.card,
        position: "relative",
        p: { xs: 4, md: 5 },
        pt: 5,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        overflow: "hidden",
        background: `radial-gradient(circle at 50% 0%, ${alpha(
          theme.palette.primary.main,
          0.18,
        )} 0%, ${theme.palette.background.paper} 65%)`,
      }}
    >
      <Chip
        label={`${w.percentage}% OF VOTES`}
        size="small"
        sx={{
          position: "absolute",
          top: 18,
          right: 18,
          fontWeight: 800,
          letterSpacing: 1,
          fontSize: "0.65rem",
        }}
      />

      <Box sx={{ position: "relative", mb: 2 }}>
        <Avatar
          sx={{
            width: 128,
            height: 128,
            bgcolor: alpha(theme.palette.primary.main, 0.18),
            color: "primary.main",
            fontSize: "2.5rem",
            fontWeight: 900,
          }}
        >
          {w.initials}
        </Avatar>
        <Box
          sx={{
            position: "absolute",
            bottom: -6,
            right: -6,
            width: 44,
            height: 44,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            background: `linear-gradient(145deg, ${goldStart} 0%, ${goldEnd} 100%)`,
            boxShadow: "0 4px 12px rgba(245,179,0,0.4)",
          }}
        >
          <Trophy size={22} color="#fff" strokeWidth={2.5} />
        </Box>
      </Box>

      <Typography
        variant="overline"
        sx={{ color: "primary.main", letterSpacing: 3, mb: 0.5, fontWeight: 900 }}
      >
        Man of the Match
      </Typography>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 900,
          textTransform: "uppercase",
          letterSpacing: -0.5,
          textAlign: "center",
        }}
      >
        {w.name}
      </Typography>

      <Box
        sx={{
          width: "100%",
          maxWidth: 220,
          height: 6,
          mt: 2,
          borderRadius: 999,
          bgcolor: alpha(theme.palette.primary.main, 0.12),
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            height: "100%",
            width: `${w.percentage}%`,
            borderRadius: 999,
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${alpha(
              theme.palette.primary.light,
              0.9,
            )})`,
          }}
        />
      </Box>
      <Typography variant="body2" sx={{ mt: 1.5, opacity: 0.55, letterSpacing: 1 }}>
        The fans have spoken
      </Typography>
    </Paper>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// ClubCard — unchanged
// ────────────────────────────────────────────────────────────────────────────
const ClubCard = ({ team }: { team: any }) => {
  const theme = useTheme() as any;

  return (
    <Link href={`/${team.slug}`} style={{ textDecoration: "none" }}>
      <Paper
        sx={{
          ...theme.clay?.card,
          p: 3,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          height: "100%",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          border: `1px solid transparent`,
          "&:hover": {
            borderColor: theme.palette.primary.main,
            transform: "translateY(-2px)",
            boxShadow: theme.shadows[2],
          },
        }}
      >
        <Avatar
          src={team.logo}
          alt={team.name}
          sx={{
            width: { xs: 64, md: 80 },
            height: { xs: 64, md: 80 },
            mb: 2,
            bgcolor: "transparent",
          }}
          imgProps={{ style: { objectFit: "contain" } }}
        />

        <Typography
          variant="subtitle1"
          sx={{
            mb: 2,
            fontWeight: 900,
            lineHeight: 1.2,
            minHeight: "2.4em",
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
            borderRadius: "8px",
            py: 1,
            fontWeight: 800,
            fontSize: "0.85rem",
          }}
        >
          Enter
        </Button>
      </Paper>
    </Link>
  );
};
