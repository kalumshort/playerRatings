import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import {
  StadiumRounded,
  SportsRounded,
  SportsSoccerRounded,
} from "@mui/icons-material";

// --- HELPERS ---
const calculateTimeLeft = (targetTime) => {
  const difference = +new Date(targetTime * 1000) - +new Date();
  let timeLeft = null;
  if (difference > 0) {
    timeLeft = {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }
  return timeLeft;
};

// --- SKELETON ---
export const FixtureHeaderSkeleton = ({ className }) => (
  <Paper
    elevation={0}
    className={className}
    sx={{
      p: 0,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      minHeight: "200px",
    }}
  >
    <Box sx={{ display: "flex", justifyContent: "center", pt: 2, pb: 1 }}>
      <Skeleton
        variant="rounded"
        width={100}
        height={28}
        sx={{ borderRadius: 14 }}
      />
    </Box>
    <Box sx={{ px: 1.5, pb: 2.5 }}>
      <Grid container alignItems="center" spacing={1.5}>
        <Grid item xs={3.5}>
          <Stack alignItems="center" spacing={1.2}>
            <Skeleton variant="circular" width={90} height={90} />
            <Skeleton variant="text" width={80} height={24} />
          </Stack>
        </Grid>
        <Grid item xs={5}>
          <Stack alignItems="center" spacing={1.2}>
            <Skeleton
              variant="rounded"
              width={140}
              height={70}
              sx={{ borderRadius: 3 }}
            />
            <Skeleton variant="text" width={80} height={20} />
          </Stack>
        </Grid>
        <Grid item xs={3.5}>
          <Stack alignItems="center" spacing={1.2}>
            <Skeleton variant="circular" width={90} height={90} />
            <Skeleton variant="text" width={80} height={24} />
          </Stack>
        </Grid>
      </Grid>
    </Box>
  </Paper>
);

// --- MAIN COMPONENT ---
export default function FixtureHeader({
  fixture,
  onClick,
  showDetails = false,
  showScorers = false,
  addClass,
}) {
  const theme = useTheme();
  if (!fixture) {
    return <FixtureHeaderSkeleton className={addClass} />;
  }
  const { teams, fixture: fixData, goals, score, events } = fixture;
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
  const getScorers = (teamId) =>
    events
      ?.filter((e) => e.team.id === teamId && e.type === "Goal")
      .reduce((acc, curr) => {
        const timeStr = `${curr.time.elapsed}${curr.time.extra ? `+${curr.time.extra}` : ""}'`;
        const existing = acc.find((p) => p.name === curr.player.name);
        if (existing) existing.times.push(timeStr);
        else acc.push({ name: curr.player.name, times: [timeStr] });
        return acc;
      }, []) || [];
  return (
    <Paper
      onClick={() => onClick?.(fixture.id)}
      className={addClass}
      elevation={0}
      sx={{
        overflow: "hidden",
        bgcolor: "background.paper",
        cursor: onClick ? "pointer" : "default",
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
        "&:hover": onClick
          ? { transform: "translateY(-2px)", boxShadow: theme.shadows[4] }
          : undefined,
        ...(isLive && {
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)}, transparent 70%)`,
        }),
      }}
    >
      {/* Status / Live Badge */}
      <Box sx={{ display: "flex", justifyContent: "center", pt: 2, pb: 1 }}>
        {isLive ? (
          <LiveBadge elapsed={fixData.status.elapsed} />
        ) : (
          <Box
            sx={{
              px: 2.5,
              py: 0.75,
              borderRadius: 14,
              bgcolor: alpha(theme.palette.text.primary, 0.06),
              border: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
            }}
          >
            <Typography
              sx={{
                fontSize: "0.82rem",
                fontWeight: 800,
                color: "text.secondary",
                letterSpacing: 0.6,
              }}
            >
              {isScheduled ? `${dayMonth} • ${time}` : status}
            </Typography>
          </Box>
        )}
      </Box>
      {/* Main content */}
      <Box sx={{ px: { xs: 1, sm: 2 }, pb: { xs: 2.5, sm: 3.5 } }}>
        <Grid container alignItems="center" spacing={1}>
          {/* Home Team */}
          <Grid item xs={3.5}>
            <TeamColumn team={teams.home} align="right" />
          </Grid>
          {/* Score / Timer */}
          <Grid item xs={5}>
            <Stack alignItems="center" spacing={1.5}>
              {isScheduled ? (
                <CountdownDisplay targetTime={fixData.timestamp} />
              ) : (
                <>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="center"
                    spacing={{ xs: 2.5, sm: 4 }}
                    sx={{ width: "100%" }}
                  >
                    <Typography variant="h2" sx={{}}>
                      {goals.home ?? 0}
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 300,
                        color: "text.disabled",
                      }}
                    >
                      —
                    </Typography>
                    <Typography variant="h2" sx={{}}>
                      {goals.away ?? 0}
                    </Typography>
                  </Stack>
                  {/* HT / Pens pills */}
                  <Stack direction="row" spacing={1.5} sx={{ mt: 0.5 }}>
                    {score.halftime.home !== null && !isFinished && (
                      <Box
                        sx={{
                          bgcolor: alpha(theme.palette.text.primary, 0.08),
                          px: 2,
                          py: 0.6,
                          borderRadius: 12,
                        }}
                      >
                        <Typography
                          variant="caption"
                          fontWeight={800}
                          color="text.secondary"
                        >
                          HT {score.halftime.home}–{score.halftime.away}
                        </Typography>
                      </Box>
                    )}
                    {score.penalty.home !== null && (
                      <Box
                        sx={{
                          bgcolor: "error.main",
                          color: "error.contrastText",
                          px: 2,
                          py: 0.6,
                          borderRadius: 12,
                        }}
                      >
                        <Typography variant="caption" fontWeight={900}>
                          PEN {score.penalty.home}–{score.penalty.away}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </>
              )}
            </Stack>
          </Grid>
          {/* Away Team */}
          <Grid item xs={3.5}>
            <TeamColumn team={teams.away} align="left" />
          </Grid>
        </Grid>
        {/* Scorers */}
        {showScorers && !isScheduled && (
          <Box
            sx={{
              mt: 3,
              pt: 2,
              borderTop: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={6}>
                {getScorers(teams.home.id).map((s, i) => (
                  <ScorerRow key={i} scorer={s} align="right" />
                ))}
              </Grid>
              <Grid item xs={6}>
                {getScorers(teams.away.id).map((s, i) => (
                  <ScorerRow key={i} scorer={s} align="left" />
                ))}
              </Grid>
            </Grid>
          </Box>
        )}
      </Box>
      {/* Footer */}
      {showDetails && (
        <Box
          sx={{
            p: 1.5,
            bgcolor: alpha(theme.palette.text.primary, 0.04),
            borderTop: `1px solid ${theme.palette.divider}`,
            mt: "auto",
          }}
        >
          <Stack
            direction="row"
            spacing={4}
            justifyContent="center"
            sx={{ opacity: 0.75 }}
          >
            {fixData.venue?.name && (
              <Stack direction="row" spacing={0.75} alignItems="center">
                <StadiumRounded sx={{ fontSize: 15 }} />
                <Typography variant="caption" fontWeight={700}>
                  {fixData.venue.name}
                </Typography>
              </Stack>
            )}
            {fixData.referee && (
              <Stack direction="row" spacing={0.75} alignItems="center">
                <SportsRounded sx={{ fontSize: 15 }} />
                <Typography variant="caption" fontWeight={700}>
                  {fixData.referee}
                </Typography>
              </Stack>
            )}
          </Stack>
        </Box>
      )}
    </Paper>
  );
}

// ────────────────────────────────────────────────
// SUB-COMPONENTS
// ────────────────────────────────────────────────
const TeamColumn = ({ team, align = "center" }) => {
  const theme = useTheme();
  return (
    <Stack
      alignItems="center"
      spacing={{ xs: 1.25, sm: 1.5 }}
      sx={{ width: "100%" }}
    >
      <Box
        sx={{
          width: { xs: 88, sm: 96, md: 104 },
          height: { xs: 88, sm: 96, md: 104 },
          borderRadius: "50%",
          bgcolor: "background.paper",
          display: "grid",
          placeItems: "center",
          border: `4px solid ${theme.palette.background.default}`,
          boxShadow: "0 4px 16px rgba(0,0,0,0.14)",
          overflow: "hidden",
        }}
      >
        <Avatar
          src={team.logo}
          variant="square"
          sx={{
            width: "78%",
            height: "78%",
            bgcolor: "transparent",
            "& img": { objectFit: "contain" },
          }}
        />
      </Box>
      <Typography
        variant="subtitle1"
        align="center"
        sx={{
          fontWeight: 800,
          fontSize: { xs: "0.96rem", sm: "1.05rem", md: "1.12rem" },
          lineHeight: 1.22,
          maxWidth: "120px",
          px: 0.5,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {team.name}
      </Typography>
    </Stack>
  );
};
const ScorerRow = ({ scorer, align }) => (
  <Stack
    direction={align === "right" ? "row" : "row-reverse"}
    justifyContent="flex-end"
    alignItems="center"
    spacing={0.75}
    sx={{ mb: 0.75 }}
  >
    <Typography
      sx={{ fontSize: "0.78rem", fontWeight: 600, color: "text.secondary" }}
    >
      {scorer.name}
      <Typography
        component="span"
        sx={{
          ml: 0.75,
          fontSize: "0.82rem",
          color: "primary.main",
          fontWeight: 800,
        }}
      >
        {scorer.times.join(", ")}
      </Typography>
    </Typography>
    <SportsSoccerRounded sx={{ fontSize: 12, opacity: 0.45 }} />
  </Stack>
);
const LiveBadge = ({ elapsed }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 1.25,
      px: 2,
      py: 0.75,
      borderRadius: 14,
      bgcolor: alpha("#ff1744", 0.12),
      border: "1px solid #ff5252",
      boxShadow: "0 2px 10px rgba(255,23,68,0.2)",
    }}
  >
    <Box
      sx={{
        width: 10,
        height: 10,
        borderRadius: "50%",
        bgcolor: "#ff1744",
        animation: "pulse 1.4s infinite",
        "@keyframes pulse": {
          "0%,100%": { opacity: 1 },
          "50%": { opacity: 0.4 },
        },
      }}
    />
    <Typography sx={{ fontSize: "0.82rem", fontWeight: 900, color: "#d50000" }}>
      LIVE {elapsed || "?"}'
    </Typography>
  </Box>
);
const CountdownDisplay = ({ targetTime }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetTime));
  useEffect(() => {
    const timer = setInterval(
      () => setTimeLeft(calculateTimeLeft(targetTime)),
      1000,
    );
    return () => clearInterval(timer);
  }, [targetTime]);
  if (!timeLeft) {
    return (
      <Typography
        sx={{ fontSize: "0.9rem", fontWeight: 800, color: "text.secondary" }}
      >
        Match starting soon
      </Typography>
    );
  }
  const showDays = timeLeft.days > 0;
  return (
    <Stack
      direction="row"
      spacing={{ xs: 1.5, sm: 2 }}
      justifyContent="center"
      alignItems="center" // 1. Ensures boxes align vertically
      useFlexGap // 2. Ensures perfect spacing when items wrap
      flexWrap="wrap"
      sx={{
        width: "fit-content", // 3. Shrinks container to fit items exactly
        maxWidth: "100%", // Prevents overflow on small screens
        mx: "auto", // Centers the container itself
      }}
    >
      {showDays && <TimeBox val={timeLeft.days} label="days" />}
      <TimeBox val={timeLeft.hours} label="hrs" />
      <TimeBox val={timeLeft.minutes} label="min" />
      <TimeBox val={timeLeft.seconds} label="sec" />
    </Stack>
  );
};
const TimeBox = ({ val, label }) => (
  <Box
    sx={{
      minWidth: 58,
      height: 58,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 10,
      bgcolor: "background.paper",
      boxShadow: "0 3px 10px rgba(0,0,0,0.12)",
    }}
  >
    <Typography fontSize="1.45rem" fontWeight={900} lineHeight={1}>
      {String(val).padStart(2, "0")}
    </Typography>
    <Typography fontSize="0.78rem" fontWeight={600} color="text.secondary">
      {label}
    </Typography>
  </Box>
);
