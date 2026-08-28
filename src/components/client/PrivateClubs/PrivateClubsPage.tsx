"use client";

import React from "react";
import Link from "next/link";
import {
  Box,
  Button,
  Chip,
  Container,
  Grid,
  Paper,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { motion } from "framer-motion";
import {
  Lock,
  Users,
  Trophy,
  Link2,
  EyeOff,
  BarChart3,
  ArrowRight,
  Clock,
  Activity,
  Star,
  CalendarRange,
} from "lucide-react";

import { CONTACT_EMAIL } from "@/lib/config/brand";

/**
 * The private-club pitch, aimed at any community that follows one Premier
 * League side — a channel, a podcast, a forum, a Discord, a supporters' club.
 *
 * ON THE WORD "CLUB". This page never uses "club" to mean a Premier League
 * team; it says "side" or "team" instead. That is not fussiness — the whole
 * proposition is "your community gets a club of its own", and a page that also
 * calls Arsenal a club makes the reader do disambiguation work on every
 * sentence. The rest of the app still says "club hub" for the public pages,
 * where there is no competing meaning in play.
 *
 * Same rule as the homepage: every claim points at something the app actually
 * does. The privacy claims map to the server gates in [clubSlug]/page.tsx,
 * /fans, /schedule and /fixture/[matchId]; the invite claims map to
 * GroupInviteGenerator's real options; the "not indexed" claim maps to
 * sitemap.ts, which only ever submits `isPublic == true`.
 *
 * The CTA is "request", not "create". There is no self-serve creation in the
 * app — these are provisioned by hand — so a "Create your club" button would be
 * a promise the product cannot keep.
 */

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <Box
    sx={(t) => ({
      alignSelf: "flex-start",
      px: 1.25,
      py: 0.5,
      borderRadius: 2,
      bgcolor: alpha(t.palette.primary.main, 0.14),
      color: "text.primary",
      fontSize: "0.7rem",
      fontWeight: 900,
      letterSpacing: 2,
      lineHeight: 1.4,
    })}
  >
    {children}
  </Box>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <Typography
    variant="h3"
    sx={{
      fontWeight: 900,
      fontSize: { xs: "1.85rem", md: "2.4rem" },
      letterSpacing: -0.5,
      lineHeight: 1.15,
    }}
  >
    {children}
  </Typography>
);

const InfoCard = ({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) => (
  <Paper sx={{ p: 3, height: "100%" }}>
    <Stack spacing={1.5}>
      <Box sx={{ color: "primary.main", display: "flex" }}>{icon}</Box>
      <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: -0.2 }}>
        {title}
      </Typography>
      <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
        {body}
      </Typography>
    </Stack>
  </Paper>
);

/**
 * Who this is for, named explicitly.
 *
 * The page used to open "FOR CREATORS" and talk about "your audience" and
 * "your channel" throughout, which quietly excluded most of the communities it
 * suits — a supporters' club committee does not have an audience, and a
 * forum's moderators do not think of themselves as creators. Naming the shapes
 * costs one row and lets each of them recognise itself.
 */
const COMMUNITY_TYPES = [
  "YouTube channels",
  "Podcasts",
  "Fan forums",
  "Discord servers",
  "Supporters' clubs",
  "WhatsApp & group chats",
  "Fantasy leagues",
  "Matchday meetups",
];

/**
 * The matchday content loop.
 *
 * This is the section that has to do the persuading: nobody wants a feature
 * list, they want to know what their community does together on Saturday.
 * Every `segments` line is a real output of a real feature — the consensus XI
 * and its hit/miss score, the minute-by-minute mood curve, sub shouts with
 * timestamps, ratings that open at 80', the Fan MOTM, season averages, and the
 * two leaderboards (XP and "Sharpest predictors"). Nothing here is aspirational.
 */
const CONTENT_ARC = [
  {
    icon: <Clock size={24} />,
    phase: "BEFORE KICKOFF",
    title: "The XI your members would pick",
    body: "Your community picks a formation and fills eleven shirts. One consensus XI comes out the other side — and when the real teamsheet drops, a hit/miss score against it.",
    segments: [
      "The XI your members chose, in the shape they voted for",
      "Your club's XI vs the manager's, scored out of eleven",
      "The scoreline your members actually expect",
      "Their player to watch, named before a ball is kicked",
    ],
  },
  {
    icon: <Activity size={24} />,
    phase: "LIVE",
    title: "A record of what your members felt, minute by minute",
    body: "Moods, hot and cold calls and substitution shouts are all timestamped against the match clock. After full time that's a curve you can scrub back through.",
    segments: [
      "The mood graph across all 90 — where it turned",
      "“At 62' most of you wanted him off”",
      "Which player ran hottest, and which went cold",
      "Reactions landing live on goals, cards and subs",
    ],
  },
  {
    icon: <Star size={24} />,
    phase: "FULL TIME",
    title: "Player ratings with only your members' names on them",
    body: "Your club runs its own ratings, scored by your members and nobody else. They open at the 80th minute, never before, so nobody scores a player they haven't watched.",
    segments: [
      "Every player who featured, rated 1.0 to 10.0",
      "A full ratings card that belongs to your community",
      "The Fan Man of the Match your members crowned",
      "A shareable graphic for the post or the thumbnail",
    ],
  },
  {
    icon: <CalendarRange size={24} />,
    phase: "ALL SEASON",
    title: "A season-long record only your club holds",
    body: "Every match compounds. By spring your club is holding its own player-of-the-season race, its sharpest predictors, and a leaderboard with your members' names on it.",
    segments: [
      "Season rating averages — your club's player of the season",
      "Form swings: who your members have turned on",
      "“Sharpest predictors” — the ones calling it right",
      "XP, levels and streaks for turning up every week",
    ],
  },
];

/** Everything a member of a private club gets. Each maps to a live feature. */
const MEMBER_FEATURES = [
  "Winner & scoreline predictions",
  "Player to watch",
  "19 formations",
  "Consensus XI",
  "Hit / miss scoring",
  "Live mood, minute by minute",
  "🔥 hot / ❄️ cold calls",
  "Sub shouts",
  "11 match reactions",
  "Player ratings from 80'",
  "Fan Man of the Match",
  "Season player averages",
  "XP, levels & streaks",
  "Fan leaderboard",
  "Shareable graphics",
];

export default function PrivateClubsPage() {
  const theme = useTheme() as any;

  return (
    <Box sx={{ bgcolor: "background.default" }}>
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ pt: { xs: 6, md: 12 }, pb: { xs: 8, md: 12 } }}>
        <Grid container spacing={{ xs: 4, md: 8 }} alignItems="center">
          <Grid size={{ xs: 12, md: 7 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Stack spacing={3}>
                <Eyebrow>FOR FOOTBALL COMMUNITIES</Eyebrow>

                <Typography
                  variant="h1"
                  sx={{
                    fontWeight: 900,
                    fontSize: { xs: "2.4rem", md: "3.6rem" },
                    letterSpacing: -1.5,
                    lineHeight: 1.03,
                  }}
                >
                  Give your community a club of its own
                </Typography>

                <Typography
                  color="text.secondary"
                  sx={{ fontSize: "1.15rem", lineHeight: 1.65, maxWidth: 560 }}
                >
                  We&apos;ll set your community up with a private club on
                  11Votes, following whichever Premier League side you follow.
                  Your members predict, pick the XI, call players hot or cold
                  and rate every performance — behind a door only they have the
                  key to.
                </Typography>

                <Typography
                  color="text.secondary"
                  sx={{ fontSize: "1.05rem", lineHeight: 1.65, maxWidth: 560 }}
                >
                  Player ratings are the heart of it, and yours are your
                  own — scored by your members, counted for your club alone, and
                  never mixed in with the wider fanbase. A poll gives you one
                  number and it&apos;s gone by Tuesday. This gives your
                  community a ratings card, a consensus XI, a mood curve and a
                  season-long table, every week, from the same people.
                </Typography>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  sx={{ pt: 1 }}
                >
                  <Button
                    component={Link}
                    href="/contact"
                    size="large"
                    endIcon={<ArrowRight size={18} />}
                    sx={{
                      ...theme.clay?.button,
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                      px: 4,
                      py: 1.5,
                      fontSize: "1rem",
                      fontWeight: 900,
                    }}
                  >
                    Request a private club
                  </Button>

                  <Button
                    component={Link}
                    href="/"
                    size="large"
                    sx={{
                      ...theme.clay?.button,
                      px: 4,
                      py: 1.5,
                      fontSize: "1rem",
                      fontWeight: 800,
                    }}
                  >
                    See how it works
                  </Button>
                </Stack>
              </Stack>
            </motion.div>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Paper sx={{ p: { xs: 3, md: 4 } }}>
                <Stack spacing={2.5}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Lock size={20} color={theme.palette.primary.main} />
                    <Typography sx={{ fontWeight: 900, letterSpacing: -0.2 }}>
                      Members only
                    </Typography>
                  </Stack>
                  <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    Every page of a private club — the match, the schedule, the
                    ratings, the leaderboard — is closed to anyone without an
                    invite. Visitors see the club&apos;s name and nothing else.
                  </Typography>

                  <Box
                    sx={(t) => ({
                      p: 2,
                      borderRadius: 2,
                      bgcolor: alpha(t.palette.primary.main, 0.06),
                      border: `1px solid ${t.palette.divider}`,
                    })}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 900,
                        letterSpacing: 1,
                        color: "text.secondary",
                      }}
                    >
                      ALSO TRUE
                    </Typography>
                    <Stack spacing={1} sx={{ mt: 1.5 }}>
                      {[
                        "Never submitted to search engines",
                        "Invite links you can expire or revoke",
                        "You choose who becomes an admin",
                      ].map((line) => (
                        <Typography
                          key={line}
                          variant="body2"
                          color="text.secondary"
                        >
                          — {line}
                        </Typography>
                      ))}
                    </Stack>
                  </Box>
                </Stack>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>
      </Container>

      {/* ── WHO IT'S FOR ─────────────────────────────────────────────── */}
      <Box
        sx={(t) => ({
          py: { xs: 5, md: 6 },
          borderTop: `1px solid ${t.palette.divider}`,
          borderBottom: `1px solid ${t.palette.divider}`,
          bgcolor: alpha(t.palette.primary.main, 0.03),
        })}
      >
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={{ xs: 2, md: 5 }}
            alignItems={{ xs: "flex-start", md: "center" }}
          >
            <Typography
              sx={{
                fontWeight: 900,
                letterSpacing: -0.2,
                fontSize: "1.05rem",
                flexShrink: 0,
              }}
            >
              Built for any group that
              <br />
              follows one team together
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {COMMUNITY_TYPES.map((type) => (
                <Chip
                  key={type}
                  label={type}
                  size="small"
                  sx={(t) => ({
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    border: `1px solid ${t.palette.divider}`,
                    bgcolor: "background.paper",
                  })}
                />
              ))}
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* ── THE CONTENT LOOP ─────────────────────────────────────────── */}
      <Box sx={{ py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Stack spacing={2} sx={{ mb: { xs: 5, md: 7 }, maxWidth: 680 }}>
            <Eyebrow>WHAT YOUR CLUB DOES ALL SEASON</Eyebrow>
            <SectionTitle>
              Every match gives your community something to argue about
            </SectionTitle>
            <Typography
              color="text.secondary"
              sx={{ fontSize: "1.1rem", lineHeight: 1.6 }}
            >
              The point isn&apos;t the votes — it&apos;s what they leave behind.
              One fixture produces a team-news debate, a live talking point, a
              ratings breakdown and another week of your season table. If you
              make content, that&apos;s four segments handed to you. If you
              don&apos;t, it&apos;s four reasons your members come back.
            </Typography>
          </Stack>

          <Grid container spacing={3}>
            {CONTENT_ARC.map((phase) => (
              <Grid size={{ xs: 12, md: 6 }} key={phase.phase}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5 }}
                  style={{ height: "100%" }}
                >
                  <Paper sx={{ p: { xs: 3, md: 3.5 }, height: "100%" }}>
                    <Stack spacing={2}>
                      <Stack
                        direction="row"
                        spacing={1.5}
                        alignItems="center"
                      >
                        <Box sx={{ color: "primary.main", display: "flex" }}>
                          {phase.icon}
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 900,
                            letterSpacing: 1.5,
                            color: "text.secondary",
                          }}
                        >
                          {phase.phase}
                        </Typography>
                      </Stack>

                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 900,
                          letterSpacing: -0.3,
                          fontSize: { xs: "1.15rem", md: "1.3rem" },
                          lineHeight: 1.25,
                        }}
                      >
                        {phase.title}
                      </Typography>

                      <Typography
                        color="text.secondary"
                        sx={{ lineHeight: 1.6 }}
                      >
                        {phase.body}
                      </Typography>

                      <Box
                        sx={(t) => ({
                          mt: 1,
                          pt: 2,
                          borderTop: `1px solid ${t.palette.divider}`,
                        })}
                      >
                        <Stack spacing={1.25}>
                          {phase.segments.map((segment) => (
                            <Stack
                              key={segment}
                              direction="row"
                              spacing={1.25}
                              alignItems="flex-start"
                            >
                              <Box
                                sx={(t) => ({
                                  mt: "7px",
                                  width: 5,
                                  height: 5,
                                  borderRadius: "50%",
                                  flexShrink: 0,
                                  bgcolor: t.palette.primary.main,
                                })}
                              />
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ lineHeight: 1.55 }}
                              >
                                {segment}
                              </Typography>
                            </Stack>
                          ))}
                        </Stack>
                      </Box>
                    </Stack>
                  </Paper>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── WHY IT MATTERS ───────────────────────────────────────────── */}
      <Box
        sx={(t) => ({
          py: { xs: 8, md: 12 },
          bgcolor: alpha(t.palette.secondary.main, 0.05),
          borderTop: `1px solid ${t.palette.divider}`,
          borderBottom: `1px solid ${t.palette.divider}`,
        })}
      >
        <Container maxWidth="lg">
          <Stack spacing={2} sx={{ mb: { xs: 4, md: 6 }, maxWidth: 640 }}>
            <Eyebrow>WHY A CLUB OF YOUR OWN</Eyebrow>
            <SectionTitle>
              &quot;Our lot said&quot; — and you can prove it
            </SectionTitle>
            <Typography
              color="text.secondary"
              sx={{ fontSize: "1.1rem", lineHeight: 1.6 }}
            >
              On a public hub your community&apos;s votes are diluted into the
              whole fanbase, and any number you quote is one anybody else can
              quote back. In a private club the sample is your people and only
              your people. That&apos;s the difference between repeating a
              statistic and owning one.
            </Typography>
          </Stack>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <InfoCard
                icon={<Star size={26} />}
                title="Player ratings that are yours"
                body="Your club scores its own ratings. Every rating, average and Man of the Match is counted for your members alone — never merged into the wider fanbase, and never visible to it."
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <InfoCard
                icon={<Trophy size={26} />}
                title="A reason to come back on Saturday"
                body="Levels, streaks and two leaderboards mean your members lose something by missing a match. Turning up stops being passive."
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <InfoCard
                icon={<BarChart3 size={26} />}
                title="Never short of a fixture"
                body="Your club follows one Premier League side across the league, the cups and Europe — every match it plays, so there is always something on."
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── RUNNING IT ───────────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Grid container spacing={{ xs: 4, md: 8 }} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <Stack spacing={2.5}>
              <Eyebrow>RUNNING IT</Eyebrow>
              <SectionTitle>Invites on your terms</SectionTitle>
              <Typography
                color="text.secondary"
                sx={{ fontSize: "1.1rem", lineHeight: 1.6, maxWidth: 480 }}
              >
                Generate a link, label it so you know where it went, and set how
                long it lasts and how many people can use it. Revoke any code
                without touching the rest, and see exactly who redeemed what.
              </Typography>

              <Typography
                color="text.secondary"
                sx={{ fontSize: "1.1rem", lineHeight: 1.6, maxWidth: 480 }}
              >
                Which means you decide what membership is worth. Post one link
                publicly and let anyone in, or keep it behind your membership
                tier — a capped, labelled code per drop, so a place in the club
                is something your community earns rather than stumbles into.
              </Typography>

              <Stack spacing={1.5} sx={{ pt: 1 }}>
                {[
                  {
                    icon: <Link2 size={18} />,
                    text: "Expires after 24 hours, 7 days, 30 days — or never",
                  },
                  {
                    icon: <Users size={18} />,
                    text: "Capped at 1, 5 or 25 uses, or left unlimited",
                  },
                  {
                    icon: <Lock size={18} />,
                    text: "Issued as member or admin, and revocable at any time",
                  },
                  {
                    icon: <EyeOff size={18} />,
                    text: "Open the club to the public later if you ever want to",
                  },
                ].map((row) => (
                  <Stack
                    key={row.text}
                    direction="row"
                    spacing={1.5}
                    alignItems="flex-start"
                  >
                    <Box sx={{ color: "primary.main", mt: "2px" }}>
                      {row.icon}
                    </Box>
                    <Typography color="text.secondary">{row.text}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: { xs: 3, md: 4 } }}>
              <Stack spacing={2}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 900,
                    letterSpacing: 1.5,
                    color: "text.secondary",
                  }}
                >
                  WHAT YOUR MEMBERS GET
                </Typography>
                <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  Everything on a public club hub, unchanged — your club is
                  private, not stripped back.
                </Typography>
                <Box
                  sx={{ display: "flex", flexWrap: "wrap", gap: 1, pt: 0.5 }}
                >
                  {MEMBER_FEATURES.map((feature) => (
                    <Chip
                      key={feature}
                      label={feature}
                      size="small"
                      variant="outlined"
                      sx={(t) => ({
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        borderColor: t.palette.divider,
                        color: "text.secondary",
                        bgcolor: "transparent",
                      })}
                    />
                  ))}
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <Box
        sx={(t) => ({
          py: { xs: 10, md: 14 },
          bgcolor: alpha(t.palette.primary.main, 0.08),
          borderTop: `1px solid ${t.palette.divider}`,
        })}
      >
        <Container maxWidth="sm" sx={{ textAlign: "center" }}>
          <Stack spacing={3} alignItems="center">
            <Typography
              variant="h2"
              sx={{
                fontWeight: 900,
                fontSize: { xs: "2rem", md: "2.75rem" },
                letterSpacing: -1,
                lineHeight: 1.08,
              }}
            >
              Open the doors and see what your lot say
            </Typography>

            <Typography
              color="text.secondary"
              sx={{ fontSize: "1.05rem", lineHeight: 1.6 }}
            >
              Private clubs are set up by hand, so tell us which side you follow
              and roughly how many people you expect. We&apos;ll come back with
              your club and an invite link — and by the next fixture you&apos;ll
              have your first consensus XI and your first ratings card.
            </Typography>

            <Button
              component={Link}
              href="/contact"
              size="large"
              endIcon={<ArrowRight size={18} />}
              sx={{
                ...theme.clay?.button,
                bgcolor: "primary.main",
                color: "primary.contrastText",
                px: 5,
                py: 1.75,
                fontSize: "1.1rem",
                fontWeight: 900,
              }}
            >
              Request a private club
            </Button>

            <Typography variant="body2" color="text.secondary">
              or email{" "}
              <Box
                component="a"
                href={`mailto:${CONTACT_EMAIL}`}
                sx={{
                  color: "primary.main",
                  fontWeight: 700,
                  textDecoration: "none",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                {CONTACT_EMAIL}
              </Box>
            </Typography>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
