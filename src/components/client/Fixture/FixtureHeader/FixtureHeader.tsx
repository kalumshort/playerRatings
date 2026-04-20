"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Avatar,
  Grid,
  alpha,
  Skeleton,
  useTheme,
  Chip,
} from "@mui/material";
import {
  StadiumRounded,
  SportsRounded,
  SportsSoccerRounded,
  CalendarMonthRounded,
} from "@mui/icons-material";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const calculateTimeLeft = (targetTime: number) => {
  const difference = +new Date(targetTime * 1000) - +new Date();
  if (difference <= 0) return null;
  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
};

// ─── Animated score number — counts up from 0 to target ───────────────────────

const AnimatedScore = ({ value }: { value: number }) => {
  const [displayed, setDisplayed] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current || value === 0) {
      setDisplayed(value);
      return;
    }
    hasAnimated.current = true;
    let current = 0;
    const steps = value;
    const duration = 600;
    const stepTime = Math.floor(duration / steps);
    const timer = setInterval(() => {
      current += 1;
      setDisplayed(current);
      if (current >= value) clearInterval(timer);
    }, stepTime);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <Typography
      variant="h2"
      sx={{
        fontWeight: 800,
        lineHeight: 1,
        fontSize: { xs: "2.5rem", sm: "3rem", md: "3.75rem" },
      }}
    >
      {displayed}
    </Typography>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export const FixtureHeaderSkeleton = ({
  className,
}: {
  className?: string;
}) => (
  <Paper
    elevation={0}
    className={className}
    sx={{
      p: 0,
      overflow: "hidden",
      minHeight: 200,
      bgcolor: "background.paper",
    }}
  >
    <Box sx={{ px: 2, pt: 2.5, pb: 2 }}>
      <Grid container alignItems="center" spacing={1}>
        <Grid size={{ xs: 3.5 }}>
          <Stack alignItems="center" spacing={1.2}>
            <Skeleton variant="circular" width={72} height={72} />
            <Skeleton variant="text" width={70} height={20} />
          </Stack>
        </Grid>
        <Grid size={{ xs: 5 }}>
          <Stack alignItems="center" spacing={1}>
            <Skeleton variant="text" width={90} height={16} />
            <Skeleton
              variant="rounded"
              width={130}
              height={56}
              sx={{ borderRadius: 2 }}
            />
            <Skeleton
              variant="rounded"
              width={100}
              height={20}
              sx={{ borderRadius: 10 }}
            />
            <Skeleton
              variant="rounded"
              width={110}
              height={26}
              sx={{ borderRadius: 13 }}
            />
          </Stack>
        </Grid>
        <Grid size={{ xs: 3.5 }}>
          <Stack alignItems="center" spacing={1.2}>
            <Skeleton variant="circular" width={72} height={72} />
            <Skeleton variant="text" width={70} height={20} />
          </Stack>
        </Grid>
      </Grid>
    </Box>
  </Paper>
);

// ─── Props ────────────────────────────────────────────────────────────────────

interface FixtureHeaderProps {
  fixture: any;
  onClick?: (id: string | number) => void;
  showDetails?: boolean;
  showScorers?: boolean;
  addClass?: string;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FixtureHeader({
  fixture,
  onClick,
  showDetails = false,
  showScorers = false,
  addClass,
}: FixtureHeaderProps) {
  const theme = useTheme();
  const [mounted, setMounted] = useState(false);

  // Trigger entrance animation after first paint
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!fixture) return <FixtureHeaderSkeleton className={addClass} />;

  const {
    teams,
    fixture: fixData,
    goals,
    score,
    events,
    league,
    statistics,
  } = fixture;

  const status = fixData.status.short;
  const isLive = ["1H", "2H", "HT", "ET", "P", "BT"].includes(status);
  const isFinished = ["FT", "AET", "PEN"].includes(status);
  const isScheduled = ["NS", "TBD"].includes(status);

  const matchDate = new Date(fixData.timestamp * 1000);
  const dayMonth = matchDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
  const time = matchDate.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const homeEvents = (events ?? []).filter(
    (e: any) =>
      e.team.id === teams.home.id && (e.type === "Goal" || e.type === "Card"),
  );
  const awayEvents = (events ?? []).filter(
    (e: any) =>
      e.team.id === teams.away.id && (e.type === "Goal" || e.type === "Card"),
  );
  const hasEvents = homeEvents.length > 0 || awayEvents.length > 0;

  const homePossession = statistics?.[0]?.statistics?.find(
    (s: any) => s.type === "Ball Possession",
  )?.value as string | undefined;
  const awayPossession = statistics?.[1]?.statistics?.find(
    (s: any) => s.type === "Ball Possession",
  )?.value as string | undefined;

  const showPossession = !isScheduled && homePossession && awayPossession;

  const getScorers = (teamId: number) =>
    (events ?? [])
      .filter((e: any) => e.team.id === teamId && e.type === "Goal")
      .reduce((acc: any[], curr: any) => {
        const timeStr = `${curr.time.elapsed}${curr.time.extra ? `+${curr.time.extra}` : ""}'`;
        const existing = acc.find((p: any) => p.name === curr.player.name);
        if (existing) existing.times.push(timeStr);
        else acc.push({ name: curr.player.name, times: [timeStr] });
        return acc;
      }, []);

  // Shared entrance transition factory
  const entrance = (delayMs: number) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0)" : "translateY(10px)",
    transition: `opacity 0.4s ease ${delayMs}ms, transform 0.4s ease ${delayMs}ms`,
  });

  return (
    <Paper
      onClick={() => onClick?.(fixData.id)}
      className={addClass}
      elevation={0}
      sx={{
        p: 0,
        overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
        "&:hover": onClick
          ? { transform: "translateY(-2px)", boxShadow: theme.shadows[4] }
          : undefined,
        // Live glow — animates on/off via keyframes
        ...(isLive && {
          animation: "liveGlow 2.5s ease-in-out infinite",
          "@keyframes liveGlow": {
            "0%,100%": {
              boxShadow: `0 0 0 0 ${alpha(theme.palette.error.main, 0)}`,
            },
            "50%": {
              boxShadow: `0 0 18px 4px ${alpha(theme.palette.error.main, 0.18)}`,
            },
          },
        }),
      }}
    >
      {/* ── Teams + Score ── */}
      <Box sx={{ px: { xs: 1.5, sm: 2 }, pt: 2.5, pb: hasEvents ? 1 : 2.5 }}>
        <Grid container alignItems="center" spacing={1}>
          {/* Home team — slides in from left */}
          <Grid size={{ xs: 3.5 }}>
            <Box sx={{ ...entrance(0) }}>
              <TeamColumn team={teams.home} />
            </Box>
          </Grid>

          {/* Score centre — fades in slightly later */}
          <Grid size={{ xs: 5 }}>
            <Box sx={{ ...entrance(80) }}>
              <Stack alignItems="center" spacing={0.75}>
                {/* League label */}
                {league && (
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    {league.logo && (
                      <Box
                        component="img"
                        src={league.logo}
                        alt={league.name}
                        sx={{
                          width: 14,
                          height: 14,
                          objectFit: "contain",
                          opacity: 0.7,
                        }}
                        onError={(e: any) => {
                          e.target.style.display = "none";
                        }}
                      />
                    )}
                    <Typography
                      sx={{
                        fontSize: {
                          xs: "0.68rem",
                          sm: "0.75rem",
                          md: "0.82rem",
                        },
                        color: "text.disabled",
                        fontWeight: 500,
                      }}
                    >
                      {league.name}
                      {league.round
                        ? ` · ${league.round.replace("Regular Season - ", "R")}`
                        : ""}
                    </Typography>
                  </Stack>
                )}

                {/* Score or countdown */}
                {isScheduled ? (
                  <CountdownDisplay targetTime={fixData.timestamp} />
                ) : (
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={{ xs: 2, sm: 3 }}
                  >
                    <AnimatedScore value={goals?.home ?? 0} />
                    <Typography
                      sx={{
                        fontWeight: 300,
                        color: "text.disabled",
                        fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem" },
                      }}
                    >
                      –
                    </Typography>
                    <AnimatedScore value={goals?.away ?? 0} />
                  </Stack>
                )}

                {/* HT + status */}
                {!isScheduled && (
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {score?.halftime?.home !== null && (
                      <Typography
                        sx={{
                          fontSize: {
                            xs: "0.72rem",
                            sm: "0.8rem",
                            md: "0.88rem",
                          },
                          color: "text.disabled",
                        }}
                      >
                        HT {score.halftime.home}–{score.halftime.away}
                      </Typography>
                    )}
                    {score?.halftime?.home !== null && (
                      <Typography
                        sx={{ fontSize: "0.72rem", color: "text.disabled" }}
                      >
                        ·
                      </Typography>
                    )}
                    {isLive ? (
                      <LiveBadge elapsed={fixData.status.elapsed} />
                    ) : (
                      <Chip
                        label={isFinished ? "Full time" : status}
                        size="small"
                        color={isFinished ? "success" : "default"}
                        sx={{
                          height: 20,
                          fontSize: {
                            xs: "0.68rem",
                            sm: "0.75rem",
                            md: "0.8rem",
                          },
                          fontWeight: 600,
                          "& .MuiChip-label": { px: 1 },
                        }}
                      />
                    )}
                  </Stack>
                )}

                {/* Scheduled date */}
                {isScheduled && (
                  <Typography
                    sx={{
                      fontSize: { xs: "0.75rem", sm: "0.85rem", md: "0.95rem" },
                      color: "text.secondary",
                      fontWeight: 500,
                    }}
                  >
                    {dayMonth} · {time}
                  </Typography>
                )}

                {/* Possession pill */}
                {showPossession && showDetails && (
                  <Stack direction="row" alignItems="center" sx={{ mt: 0.5 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        borderRadius: 20,
                        overflow: "hidden",
                        border: `0.5px solid ${alpha(theme.palette.divider, 0.6)}`,
                      }}
                    >
                      <Box
                        sx={{
                          px: 1.25,
                          py: 0.4,
                          bgcolor: alpha(theme.palette.primary.main, 0.12),
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            color: "primary.main",
                          }}
                        >
                          {homePossession}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          px: 1,
                          py: 0.4,
                          bgcolor: alpha(theme.palette.text.primary, 0.04),
                        }}
                      >
                        <Typography
                          sx={{ fontSize: "0.65rem", color: "text.disabled" }}
                        >
                          poss
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          px: 1.25,
                          py: 0.4,
                          bgcolor: alpha(theme.palette.text.primary, 0.04),
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            color: "text.secondary",
                          }}
                        >
                          {awayPossession}
                        </Typography>
                      </Box>
                    </Box>
                  </Stack>
                )}

                {/* Pen score */}
                {score?.penalty?.home !== null && (
                  <Chip
                    label={`PEN ${score.penalty.home}–${score.penalty.away}`}
                    size="small"
                    color="error"
                    sx={{
                      height: 20,
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      "& .MuiChip-label": { px: 1 },
                    }}
                  />
                )}
              </Stack>
            </Box>
          </Grid>

          {/* Away team — slides in from right */}
          <Grid size={{ xs: 3.5 }}>
            <Box sx={{ ...entrance(0) }}>
              <TeamColumn team={teams.away} />
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* ── Scorers ── */}
      {showScorers && !isScheduled && (
        <Box
          sx={{
            px: { xs: 1.5, sm: 2 },
            pb: 2,
            pt: 0.5,
            borderTop: `0.5px solid ${theme.palette.divider}`,
            ...entrance(200),
          }}
        >
          <Grid container spacing={2} sx={{ mt: 0 }} justifyContent="center">
            <Grid size={{ xs: 5 }}>
              <Stack alignItems="flex-end">
                {getScorers(teams.home.id).map((s: any, i: number) => (
                  <ScorerRow key={i} scorer={s} align="right" />
                ))}
              </Stack>
            </Grid>
            <Grid size={{ xs: 5 }}>
              <Stack alignItems="flex-start">
                {getScorers(teams.away.id).map((s: any, i: number) => (
                  <ScorerRow key={i} scorer={s} align="left" />
                ))}
              </Stack>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* ── Details footer ── */}
      {showDetails && (
        <Box
          sx={{
            px: { xs: 1.5, sm: 2 },
            py: 1.25,
            bgcolor: alpha(theme.palette.text.primary, 0.03),
            borderTop: `0.5px solid ${theme.palette.divider}`,
            ...entrance(220),
          }}
        >
          <Stack
            direction="row"
            spacing={2}
            justifyContent="center"
            flexWrap="wrap"
            useFlexGap
            sx={{ opacity: 0.7, rowGap: 0.75 }}
          >
            <Stack direction="row" spacing={0.75} alignItems="center">
              <CalendarMonthRounded sx={{ fontSize: 13 }} />
              <Typography variant="caption" fontWeight={600}>
                {dayMonth} · {time}
              </Typography>
            </Stack>
            {fixData.venue?.name && (
              <Stack direction="row" spacing={0.75} alignItems="center">
                <StadiumRounded sx={{ fontSize: 13 }} />
                <Typography variant="caption" fontWeight={600}>
                  {fixData.venue.name}
                </Typography>
              </Stack>
            )}
            {fixData.referee && (
              <Stack direction="row" spacing={0.75} alignItems="center">
                <SportsRounded sx={{ fontSize: 13 }} />
                <Typography variant="caption" fontWeight={600}>
                  {fixData.referee.split(",")[0]}
                </Typography>
              </Stack>
            )}
          </Stack>
        </Box>
      )}
    </Paper>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const TeamColumn = ({ team }: { team: any }) => (
  <Stack alignItems="center" spacing={1} sx={{ width: "100%" }}>
    <Avatar
      src={team.logo}
      variant="square"
      sx={{
        width: { xs: 64, sm: 72, md: 80 },
        height: { xs: 64, sm: 72, md: 80 },
        bgcolor: "transparent",
        boxShadow: "none",
        borderRadius: 0,
        "& img": { objectFit: "contain" },
      }}
    />
    <Typography
      align="center"
      sx={{
        fontWeight: 700,
        fontSize: { xs: "0.82rem", sm: "0.95rem", md: "1.1rem" },
        lineHeight: 1.2,
        maxWidth: 110,
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }}
    >
      {team.name}
    </Typography>
  </Stack>
);

const EventItem = ({
  event,
  align,
}: {
  event: any;
  align: "left" | "right";
}) => {
  const isGoal = event.type === "Goal";
  const isCard = event.type === "Card";
  const isYellow = isCard && event.detail?.toLowerCase().includes("yellow");
  const isRed = isCard && event.detail?.toLowerCase().includes("red");
  const timeStr = `${event.time.elapsed}${event.time.extra ? `+${event.time.extra}` : ""}'`;

  return (
    <Stack
      direction={align === "right" ? "row-reverse" : "row"}
      alignItems="center"
      spacing={0.5}
    >
      <Typography
        sx={{
          fontSize: { xs: "0.9rem", sm: "1rem", md: "1.1rem" },
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        {isGoal ? "⚽" : isYellow ? "🟨" : isRed ? "🟥" : ""}
      </Typography>
      <Typography
        sx={{
          fontSize: { xs: "0.72rem", sm: "0.8rem", md: "0.88rem" },
          color: "text.secondary",
          lineHeight: 1.3,
        }}
      >
        {event.player.name}
      </Typography>
      <Typography
        sx={{
          fontSize: { xs: "0.65rem", sm: "0.72rem", md: "0.8rem" },
          color: "text.disabled",
          flexShrink: 0,
        }}
      >
        {timeStr}
      </Typography>
    </Stack>
  );
};

const ScorerRow = ({
  scorer,
  align,
}: {
  scorer: any;
  align: "left" | "right";
}) => (
  <Stack
    direction={align === "right" ? "row-reverse" : "row"}
    alignItems="center"
    spacing={0.75}
    sx={{ mb: 0.5 }}
  >
    <SportsSoccerRounded sx={{ fontSize: 11, opacity: 0.4 }} />
    <Typography
      sx={{
        fontSize: { xs: "0.75rem", sm: "0.82rem", md: "0.9rem" },
        fontWeight: 600,
        color: "text.secondary",
      }}
    >
      {scorer.name}
      <Typography
        component="span"
        sx={{
          ml: 0.5,
          fontSize: "0.75rem",
          color: "primary.main",
          fontWeight: 700,
        }}
      >
        {scorer.times.join(", ")}
      </Typography>
    </Typography>
  </Stack>
);

const LiveBadge = ({ elapsed }: { elapsed: number }) => (
  <Stack direction="row" alignItems="center" spacing={0.75}>
    <Box
      sx={{
        width: 7,
        height: 7,
        borderRadius: "50%",
        bgcolor: "error.main",
        animation: "livePulse 1.4s ease-in-out infinite",
        "@keyframes livePulse": {
          "0%,100%": { opacity: 1, transform: "scale(1)" },
          "50%": { opacity: 0.3, transform: "scale(0.75)" },
        },
      }}
    />
    <Typography
      sx={{
        fontSize: { xs: "0.72rem", sm: "0.8rem", md: "0.9rem" },
        fontWeight: 800,
        color: "error.main",
      }}
    >
      {elapsed}'
    </Typography>
  </Stack>
);

const CountdownDisplay = ({ targetTime }: { targetTime: number }) => {
  const theme = useTheme();
  const [timeLeft, setTimeLeft] =
    useState<ReturnType<typeof calculateTimeLeft>>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTimeLeft(calculateTimeLeft(targetTime));
    const timer = setInterval(
      () => setTimeLeft(calculateTimeLeft(targetTime)),
      1000,
    );
    return () => clearInterval(timer);
  }, [targetTime]);

  if (!mounted || !timeLeft) {
    return (
      <Typography
        sx={{ fontSize: "0.85rem", fontWeight: 600, color: "text.secondary" }}
      >
        Match starting soon
      </Typography>
    );
  }

  const segments: { val: number; label: string; pulse?: boolean }[] = [];
  if (timeLeft.days > 0)
    segments.push({ val: timeLeft.days, label: "days" });
  segments.push({ val: timeLeft.hours, label: "hrs" });
  segments.push({ val: timeLeft.minutes, label: "min" });
  segments.push({ val: timeLeft.seconds, label: "sec", pulse: true });

  return (
    <Stack alignItems="center" spacing={0.5}>
      <Typography
        sx={{
          fontSize: { xs: "0.6rem", sm: "0.65rem" },
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "text.disabled",
        }}
      >
        Kicks off in
      </Typography>
      <Stack
        direction="row"
        alignItems="flex-end"
        spacing={{ xs: 0.75, sm: 1 }}
        sx={{ fontVariantNumeric: "tabular-nums" }}
      >
        {segments.map((seg, i) => (
          <React.Fragment key={seg.label}>
            <Stack alignItems="center" spacing={0.25}>
              <Typography
                sx={{
                  fontSize: { xs: "1.6rem", sm: "2rem", md: "2.4rem" },
                  fontWeight: 800,
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                  color: "text.primary",
                  ...(seg.pulse && {
                    animation: "countdownTick 1s ease-in-out infinite",
                    "@keyframes countdownTick": {
                      "0%,100%": { opacity: 1 },
                      "50%": { opacity: 0.55 },
                    },
                  }),
                }}
              >
                {String(seg.val).padStart(2, "0")}
              </Typography>
              <Typography
                sx={{
                  fontSize: { xs: "0.55rem", sm: "0.62rem" },
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "text.disabled",
                  lineHeight: 1,
                }}
              >
                {seg.label}
              </Typography>
            </Stack>
            {i < segments.length - 1 && (
              <Typography
                sx={{
                  fontSize: { xs: "1.3rem", sm: "1.6rem", md: "2rem" },
                  fontWeight: 400,
                  lineHeight: 1,
                  color: alpha(theme.palette.text.primary, 0.25),
                  pb: { xs: "0.7rem", sm: "0.75rem" },
                }}
              >
                :
              </Typography>
            )}
          </React.Fragment>
        ))}
      </Stack>
    </Stack>
  );
};
