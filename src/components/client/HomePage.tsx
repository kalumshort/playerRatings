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
import { DirectoryClub } from "@/lib/clubDirectory";
import {
  EMPTY_SHOWCASE,
  HomepageShowcase,
  ShowcaseFixture,
  ShowcasePlayer,
} from "@/lib/homepageShowcase";
import AuthDialog from "@/components/client/Auth/AuthDialog";
import DemoFrame from "@/components/client/Home/DemoFrame";
import MoodAreaChart from "@/components/client/Fixture/Components/FanMoodSelector/MoodAreaChart";

// --- FEATURE DATA ---
// Each tile describes something the app actually does today. Keep it that way:
// if a line here can't be pointed at a component, it doesn't belong.
const features = [
  {
    title: "Consensus XI",
    desc: "The crowd's starting XI on a pitch, with the percentage that picked each player for that exact slot.",
    icon: <Groups color="primary" />,
  },
  {
    title: "Your differentials",
    desc: "See where you disagree with the crowd — then how many of the real starters you called once the team sheet drops.",
    icon: <TouchApp color="secondary" />,
  },
  {
    title: "19 formations",
    desc: "From 4-3-3 Holding to a 4-3-2-1 Xmas Tree. Pick the shape, then fill it.",
    icon: <Psychology color="primary" />,
  },
  {
    title: "Live Pulse",
    desc: "Tap your mood as it swings. The whole crowd's emotion becomes one chart, with the goals and cards marked on it.",
    icon: <Timeline color="secondary" />,
  },
  {
    title: "Manager mode",
    desc: "Call players hot or cold while they play. Enough sub requests and the shout shows up on the pitch.",
    icon: <Bolt color="primary" />,
  },
  {
    title: "Ratings open at 80'",
    desc: "Not before. Rate every player who featured, and the votes crown the Fan Man of the Match.",
    icon: <AutoGraph color="secondary" />,
  },
  {
    title: "The whole season",
    desc: "Every fixture, league and cup. A rating leaderboard, per-player form graphs, and head-to-head comparisons.",
    icon: <QueryStats color="primary" />,
  },
];

const whyPoints = [
  {
    title: "Fan-led, not pundit-led",
    desc: "The XI is what fans pick. The Man of the Match is what fans vote. No expert panels, no algorithm deciding who was good.",
    icon: <Groups color="primary" sx={{ fontSize: 32 }} />,
  },
  {
    title: "One club at a time",
    desc: "You follow a single club, and switching is a transfer with a 30-day wait. That's what stops a consensus from being brigaded by people who weren't watching.",
    icon: <Star color="secondary" sx={{ fontSize: 32 }} />,
  },
  {
    title: "Built for the 90 minutes",
    desc: "The app changes as the match does — predictions before kick-off, mood while it's live, ratings once it's nearly done.",
    icon: <Bolt color="primary" sx={{ fontSize: 32 }} />,
  },
];

const scrollToClubs = () => {
  if (typeof window === "undefined") return;
  const el = document.getElementById("clubs");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

export default function HomePage({
  clubs,
  showcase = EMPTY_SHOWCASE,
}: {
  clubs: DirectoryClub[];
  /** Real fixture, squad players and match events for the demo panels. */
  showcase?: HomepageShowcase;
}) {
  const theme = useTheme() as any;
  const [searchTerm, setSearchTerm] = useState("");
  const [authOpen, setAuthOpen] = useState(false);

  // Every club, always. This used to show clubs.slice(0, 4) until you typed,
  // which hid the one genuinely real thing on the page behind a search box.
  const displayedTeams = clubs.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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
                // Fluid below md: a flat 3rem made "CLUB'S PULSE" wider than a
                // 375px screen, and that one line was stretching the whole
                // page's scroll width — every section inherited the overflow.
                fontSize: { xs: "clamp(2.25rem, 11vw, 3rem)", md: "5rem" },
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
              sx={{ maxWidth: 560, fontWeight: 500, lineHeight: 1.5 }}
            >
              Predict the result. Build the XI. Rate the performance. Every vote
              your club casts becomes one matchday consensus — and you find out
              how close you were.
            </Typography>

            <Typography
              variant="body2"
              sx={{ color: "text.secondary", opacity: 0.75, fontWeight: 600 }}
            >
              Premier League clubs — more leagues coming.
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
            mb: 1,
            letterSpacing: 2,
            color: "text.secondary",
            fontWeight: 800,
          }}
        >
          NO ACCOUNT NEEDED TO LOOK AROUND
        </Typography>

        {/* The count comes from the directory, never a literal — the nightly
            reconcile changes which clubs exist when teams go up or down. */}
        <Typography
          align="center"
          sx={{
            mb: 4,
            fontSize: "1.05rem",
            color: "text.secondary",
            maxWidth: 520,
            mx: "auto",
          }}
        >
          {clubs.length > 0 && (
            <Box component="span" sx={{ fontWeight: 800, color: "text.primary" }}>
              All {clubs.length} Premier League clubs.{" "}
            </Box>
          )}
          You follow one club at a time — more leagues coming.
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
          <IconButton sx={{ ml: 1 }} disabled aria-label="Search clubs">
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
                  // Capped so the last club in a 20-card grid doesn't wait a
                  // full second to appear.
                  transition={{ delay: Math.min(index, 8) * 0.04 }}
                >
                  <ClubCard team={team} />
                </motion.div>
              </Grid>
            ))}
          </AnimatePresence>
        </Grid>

        {/* Two different empty states. The directory genuinely can be empty —
            it's rebuilt nightly — and rendering nothing at all looks broken. */}
        {displayedTeams.length === 0 && (
          <Typography
            align="center"
            color="text.secondary"
            sx={{ py: 6, fontSize: "1.05rem" }}
          >
            {clubs.length === 0
              ? "Clubs are being set up for the new season — check back shortly."
              : `No club matches "${searchTerm}".`}
          </Typography>
        )}
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
              body="Lock in your scoreline, name the player you think decides it, and build the XI you'd start. Then see the crowd's XI — and exactly which picks you're backing yourself on."
              demo={
                <Phase1Demo
                  fixture={showcase.fixture}
                  players={showcase.players}
                />
              }
            />
            <JourneyRow
              eyebrow="LIVE"
              title="Feel the pulse"
              body="Tap your mood as the match swings. Every fan's emotion collapses into one chart, minute by minute, with the goals and cards marked on it — so you can see the moment it turned."
              demo={<Phase2Demo events={showcase.events} />}
              reverse
            />
            <JourneyRow
              eyebrow="FULL TIME"
              title="Crown the MOTM"
              body="Ratings open at the 80th minute. Score every player who featured, compare yours against the group average, and the votes crown the Fan Man of the Match."
              demo={<Phase3Demo player={showcase.players[0] ?? null} />}
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
            Pre-match to post-match. Every fixture, league and cup.
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
              Free to join. Pick your club and have your say on the next one.
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
//
// Crests, club names and player names/photos are real, pulled from Firestore by
// getHomepageShowcase(). The split below is illustrative — hence the EXAMPLE
// label from DemoFrame — but it is never presented as a recorded vote count.
// ────────────────────────────────────────────────────────────────────────────
const EXAMPLE_SPLIT = { home: 47, draw: 22, away: 31 };
const EXAMPLE_PLAYER_SHARE = [38, 21, 14];

function Phase1Demo({
  fixture,
  players,
}: {
  fixture: ShowcaseFixture | null;
  players: ShowcasePlayer[];
}) {
  const theme = useTheme() as any;
  const p = EXAMPLE_SPLIT;

  return (
    <DemoFrame>
      <Stack spacing={4}>
      {/* Mini winner predict */}
      <Box>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 1.5, pr: 9 }}
        >
          <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: 2, opacity: 0.6 }}>
            Result prediction
          </Typography>
          {fixture && (
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Avatar
                src={fixture.homeLogo}
                alt={fixture.homeName}
                sx={{ width: 20, height: 20, bgcolor: "transparent" }}
                imgProps={{ style: { objectFit: "contain" } }}
              />
              <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.7 }}>
                v
              </Typography>
              <Avatar
                src={fixture.awayLogo}
                alt={fixture.awayName}
                sx={{ width: 20, height: 20, bgcolor: "transparent" }}
                imgProps={{ style: { objectFit: "contain" } }}
              />
            </Stack>
          )}
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
        <Stack direction="row" justifyContent="space-between" sx={{ mt: 1, gap: 1 }}>
          <Typography variant="caption" noWrap sx={{ fontWeight: 700, maxWidth: "40%" }}>
            {fixture?.homeName?.toUpperCase() || "HOME"}
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.6 }}>DRAW</Typography>
          <Typography variant="caption" noWrap sx={{ fontWeight: 700, maxWidth: "40%" }}>
            {fixture?.awayName?.toUpperCase() || "AWAY"}
          </Typography>
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
        <Stack
          direction="row"
          spacing={{ xs: 1, sm: 2 }}
          alignItems="flex-start"
          justifyContent="center"
        >
          {players.map((pl, i) => {
            const topPick = i === 0;

            return (
              <Box
                key={pl.id}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0.75,
                }}
              >
                <Box sx={{ position: "relative" }}>
                  <Avatar
                    src={pl.photo || undefined}
                    alt={pl.name}
                    sx={{
                      width: { xs: 48, sm: 56 },
                      height: { xs: 48, sm: 56 },
                      fontWeight: 900,
                      bgcolor: topPick
                        ? alpha(theme.palette.primary.main, 0.2)
                        : alpha(theme.palette.text.primary, 0.08),
                      color: topPick ? "primary.main" : "text.primary",
                      border: topPick
                        ? `1px solid ${theme.palette.primary.main}`
                        : "1px solid transparent",
                    }}
                  >
                    {pl.name.charAt(0)}
                  </Avatar>
                  {topPick && (
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
                  noWrap
                  sx={{
                    fontWeight: 700,
                    mt: topPick ? 1 : 0,
                    textAlign: "center",
                    maxWidth: "100%",
                  }}
                >
                  {pl.name}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.6 }}>
                  {EXAMPLE_PLAYER_SHARE[i] ?? 0}%
                </Typography>
              </Box>
            );
          })}

          {/* Squad data can be absent on a cold season — the panel still has
              to stand up, so fall back to describing the feature. */}
          {players.length === 0 && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ py: 3, textAlign: "center" }}
            >
              Pick the player you think decides the match, and see who the rest
              of your club backed.
            </Typography>
          )}
        </Stack>
      </Box>
      </Stack>
    </DemoFrame>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Phase 2 — Live Pulse
//
// This renders the production MoodAreaChart. The events drawn on it are real,
// taken from a real finished fixture by getHomepageShowcase(); the mood curve
// is an illustrative shape, because a chart of the handful of real reactions
// recorded so far would show nothing useful.
//
// Includes every mood the chart knows about (moodConfig.MOODS) — `hopeful` was
// previously missing from every bucket, so that band always rendered flat zero.
// ────────────────────────────────────────────────────────────────────────────
const EXAMPLE_MOOD_ARC: Record<string, Record<string, number>> = {
  "5":  { excited: 12, happy: 28, hopeful: 20, nervous: 15, sad: 2,  angry: 1 },
  "12": { excited: 8,  happy: 24, hopeful: 18, nervous: 22, sad: 6,  angry: 3 },
  "20": { excited: 4,  happy: 14, hopeful: 12, nervous: 30, sad: 14, angry: 8 },
  "28": { excited: 38, happy: 42, hopeful: 16, nervous: 8,  sad: 2,  angry: 1 },
  "36": { excited: 22, happy: 38, hopeful: 19, nervous: 16, sad: 4,  angry: 2 },
  "45": { excited: 14, happy: 28, hopeful: 17, nervous: 24, sad: 10, angry: 5 },
  "52": { excited: 6,  happy: 12, hopeful: 10, nervous: 22, sad: 26, angry: 18 },
  "60": { excited: 4,  happy: 10, hopeful: 9,  nervous: 28, sad: 24, angry: 22 },
  "68": { excited: 8,  happy: 18, hopeful: 21, nervous: 30, sad: 16, angry: 10 },
  "76": { excited: 18, happy: 32, hopeful: 26, nervous: 22, sad: 8,  angry: 4 },
  "84": { excited: 28, happy: 38, hopeful: 22, nervous: 14, sad: 4,  angry: 2 },
  "89": { excited: 56, happy: 30, hopeful: 12, nervous: 6,  sad: 2,  angry: 1 },
  "90": { excited: 62, happy: 28, hopeful: 8,  nervous: 4,  sad: 1,  angry: 1 },
};

function Phase2Demo({ events }: { events: HomepageShowcase["events"] }) {
  return (
    <DemoFrame padded={false}>
      <Box sx={{ height: 320, overflow: "hidden" }}>
        <MoodAreaChart matchMoods={EXAMPLE_MOOD_ARC} events={events} />
      </Box>
    </DemoFrame>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Phase 3 — MOTM crown (static replica of FanMOTMHighlight, no Redux)
//
// The winner is a real player from a real squad. The vote share is illustrative
// — the largest real MOTM result to date is a handful of votes — so the panel
// carries the EXAMPLE label like the others.
// ────────────────────────────────────────────────────────────────────────────
const EXAMPLE_MOTM_SHARE = 38;

function Phase3Demo({ player }: { player: ShowcasePlayer | null }) {
  const theme = useTheme() as any;
  // Mirror FanMOTMHighlight rather than re-inventing its palette: the demo
  // should look like the thing it is demonstrating.
  const goldStart = theme.palette.motm?.goldStart || "#FFE27A";
  const goldEnd = theme.palette.motm?.goldEnd || "#F5B300";
  const trophyColor = theme.palette.motm?.bronze || theme.palette.common.white;

  return (
    <DemoFrame padded={false}>
      <Box
        sx={{
          position: "relative",
          p: { xs: 4, md: 5 },
          pt: 5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          background: `radial-gradient(circle at 50% 0%, ${alpha(
            theme.palette.primary.main,
            0.18,
          )} 0%, ${theme.palette.background.paper} 65%)`,
        }}
      >
      <Chip
        label={`${EXAMPLE_MOTM_SHARE}% OF VOTES`}
        size="small"
        sx={{
          position: "absolute",
          top: 52,
          right: 18,
          fontWeight: 800,
          letterSpacing: 1,
          fontSize: "0.65rem",
        }}
      />

      <Box sx={{ position: "relative", mb: 2 }}>
        <Avatar
          src={player?.photo || undefined}
          alt={player?.name || "Man of the Match"}
          sx={{
            width: 128,
            height: 128,
            bgcolor: alpha(theme.palette.primary.main, 0.18),
            color: "primary.main",
            fontSize: "2.5rem",
            fontWeight: 900,
          }}
        >
          {player?.name?.charAt(0) ?? <Trophy size={44} />}
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
            boxShadow: `0 4px 12px ${alpha(goldEnd, 0.4)}`,
          }}
        >
          <Trophy size={22} color={trophyColor} strokeWidth={2.5} />
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
        {player?.name ?? "Voted by the fans"}
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
            width: `${EXAMPLE_MOTM_SHARE}%`,
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
      </Box>
    </DemoFrame>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// ClubCard — unchanged
// ────────────────────────────────────────────────────────────────────────────
const ClubCard = ({ team }: { team: DirectoryClub }) => {
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
          src={team.logoUrl}
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
