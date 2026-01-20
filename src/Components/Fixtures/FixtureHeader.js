import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Avatar,
  Grid,
  alpha,
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

// --- COMPONENT ---
export default function FixtureHeader({
  fixture,
  onClick,
  showDetails = false,
  showScorers = false,
  showPenaltys = false,
  addClass,
}) {
  const theme = useTheme();
  const { teams, fixture: fixData, goals, score, events } = fixture;

  const status = fixData.status.short;
  const isLive = ["1H", "2H", "HT", "ET", "P", "BT"].includes(status);
  const isFinished = ["FT", "AET", "PEN"].includes(status);
  const isScheduled = ["NS", "TBD"].includes(status);

  // Formatting
  const matchDate = new Date(fixData.timestamp * 1000);
  const dayMonth = matchDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
  const time = matchDate.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const getScorers = (teamId) => {
    return (
      events
        ?.filter((e) => e.team.id === teamId && e.type === "Goal")
        .reduce((acc, curr) => {
          const timeStr = `${curr.time.elapsed}${curr.time.extra ? `+${curr.time.extra}` : ""}'`;
          const existing = acc.find((p) => p.name === curr.player.name);
          if (existing) existing.times.push(timeStr);
          else acc.push({ name: curr.player.name, times: [timeStr] });
          return acc;
        }, []) || []
    );
  };

  return (
    <Paper
      onClick={() => onClick && onClick(fixture.id)}
      className={addClass}
      elevation={0}
      sx={(theme) => ({
        p: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        cursor: onClick ? "pointer" : "default",
        transition: "transform 0.2s ease",
      })}
    >
      {/* --- ROW 1: STATUS BADGE (In Flow, Not Absolute) --- */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          pt: 2.5, // Padding from top of card
          pb: 1, // Space before teams
          width: "100%",
        }}
      >
        {isLive ? (
          <LiveBadge elapsed={fixData.status.elapsed} />
        ) : (
          <Box
            sx={(theme) => ({
              px: 2,
              py: 0.5,
              borderRadius: "12px",
              bgcolor: "background.paper",
            })}
          >
            <Typography
              sx={{
                fontSize: "0.7rem",
                fontWeight: 800,
                color: "text.secondary",
                letterSpacing: 0.5,
              }}
            >
              {isScheduled ? `${dayMonth} • ${time}` : status}
            </Typography>
          </Box>
        )}
      </Box>

      {/* --- ROW 2: MAIN MATCH AREA --- */}
      <Box sx={{ px: 2, pb: 4 }}>
        <Grid container alignItems="center" spacing={1}>
          {/* HOME TEAM */}
          <Grid item xs={3.5}>
            <TeamColumn team={teams.home} align="right" />
          </Grid>

          {/* SCORE / TIMER */}
          <Grid item xs={5}>
            <Stack alignItems="center" spacing={1}>
              {isScheduled ? (
                <CountdownDisplay targetTime={fixData.timestamp} />
              ) : (
                <>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="center"
                    spacing={1.5}
                  >
                    <Typography variant="h2" sx={scoreStyles}>
                      {goals.home ?? 0}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "1.5rem",
                        color: "text.disabled",
                        fontWeight: 300,
                      }}
                    >
                      -
                    </Typography>
                    <Typography variant="h2" sx={scoreStyles}>
                      {goals.away ?? 0}
                    </Typography>
                  </Stack>

                  {score.halftime.home !== null && !isFinished && (
                    <Box
                      sx={{
                        bgcolor: alpha(theme.palette.text.primary, 0.05),
                        px: 1,
                        borderRadius: 1,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 800, color: "text.secondary" }}
                      >
                        HT {score.halftime.home}-{score.halftime.away}
                      </Typography>
                    </Box>
                  )}
                </>
              )}
            </Stack>
          </Grid>

          {/* AWAY TEAM */}
          <Grid item xs={3.5}>
            <TeamColumn team={teams.away} align="left" />
          </Grid>
        </Grid>

        {/* PENALTIES */}
        {score.penalty.home !== null && (
          <Typography
            variant="button"
            display="block"
            textAlign="center"
            sx={{ mt: 2, fontWeight: 900, color: "error.main" }}
          >
            PENS ({score.penalty.home}-{score.penalty.away})
          </Typography>
        )}

        {/* SCORERS */}
        {showScorers && !isScheduled && (
          <Box
            sx={{
              mt: 3,
              pt: 2,
              borderTop: `2px dashed ${theme.palette.divider}`,
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

      {/* --- FOOTER: DETAILS --- */}
      {showDetails && (
        <Box
          sx={{
            p: 1.5,
            bgcolor: alpha(theme.palette.text.primary, 0.03),
            borderTop: `1px solid ${theme.palette.divider}`,
            mt: "auto",
          }}
        >
          <Stack
            direction="row"
            spacing={3}
            justifyContent="center"
            sx={{ opacity: 0.7 }}
          >
            <Stack direction="row" spacing={0.5} alignItems="center">
              <StadiumRounded sx={{ fontSize: 14 }} />
              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                {fixData.venue.name}
              </Typography>
            </Stack>
            {fixData.referee && (
              <Stack direction="row" spacing={0.5} alignItems="center">
                <SportsRounded sx={{ fontSize: 14 }} />
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
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

// --- SUB-COMPONENTS ---

const scoreStyles = {
  fontSize: { xs: "2.5rem", md: "3.5rem" },
  fontWeight: 900,
  lineHeight: 1,
  color: "text.primary",
  letterSpacing: -2,
};

const TeamColumn = ({ team }) => (
  <Stack alignItems="center" spacing={1.5}>
    <Box
      sx={(theme) => ({
        width: { xs: 75, md: 72 },
        height: { xs: 75, md: 72 },
        borderRadius: "50%",
        bgcolor: "background.paper",
        display: "grid",
        placeItems: "center",
        border: `4px solid ${theme.palette.background.default}`,
        boxShadow: theme.clay.card.boxShadow,
      })}
    >
      <Avatar
        src={team.logo}
        variant="square"
        sx={{
          width: { xs: 55, md: 48 },
          height: { xs: 55, md: 48 },
          bgcolor: "transparent",
          "& img": { objectFit: "contain" },
        }}
      />
    </Box>
    <Typography
      variant="subtitle2"
      align="center"
      sx={{
        fontWeight: 800,
        fontSize: { xs: "0.75rem", md: "0.9rem" },
        textTransform: "uppercase",
        lineHeight: 1.1,
        maxWidth: "90px",
        wordWrap: "break-word",
      }}
    >
      {team.name}
    </Typography>
  </Stack>
);

const ScorerRow = ({ scorer, align }) => (
  <Stack
    direction={align === "right" ? "row" : "row-reverse"}
    justifyContent={"flex-end"}
    alignItems="center"
    spacing={0.5}
    sx={{ mb: 0.5 }}
  >
    <Typography
      sx={{ fontSize: "0.7rem", fontWeight: 600, color: "text.secondary" }}
    >
      {scorer.name}
      <Typography
        component="span"
        sx={{
          ml: 0.5,
          fontSize: "0.75rem",
          color: "primary.main",
          fontWeight: 800,
        }}
      >
        {scorer.times.join(", ")}
      </Typography>
    </Typography>
    <SportsSoccerRounded sx={{ fontSize: 10, opacity: 0.4 }} />
  </Stack>
);

const LiveBadge = ({ elapsed }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 1,
      px: 1.5,
      py: 0.5,
      borderRadius: "12px",
      bgcolor: "#FFE2E2",
      border: "1px solid #FFA8A8",
      boxShadow: "0 2px 6px rgba(255,0,0,0.1)",
    }}
  >
    <Box
      sx={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        bgcolor: "#FF0000",
        animation: "pulse 1.5s infinite",
        "@keyframes pulse": {
          "0%": { opacity: 1 },
          "50%": { opacity: 0.4 },
          "100%": { opacity: 1 },
        },
      }}
    />
    <Typography sx={{ fontSize: "0.7rem", fontWeight: 900, color: "#D90000" }}>
      LIVE {elapsed}'
    </Typography>
  </Box>
);

// Internal Countdown Logic
const CountdownDisplay = ({ targetTime }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetTime));

  useEffect(() => {
    const timer = setInterval(
      () => setTimeLeft(calculateTimeLeft(targetTime)),
      1000,
    );
    return () => clearInterval(timer);
  }, [targetTime]);

  if (!timeLeft)
    return (
      <Typography sx={{ fontSize: "0.7rem", fontWeight: 900 }}>
        MATCH STARTING
      </Typography>
    );

  return (
    <Box
      sx={{
        display: "grid",
        // Responsive Columns: 2 cols on mobile, 4 cols on web
        gridTemplateColumns: {
          xs: timeLeft.days > 0 ? "repeat(2, 1fr)" : "repeat(2, 1fr)", // Always 2x2 on mobile
          sm: "repeat(4, 1fr)", // Horizontal strip on web
        },
        gap: 0.5,
        justifyContent: "center", // Center the grid itself
      }}
    >
      {timeLeft.days > 0 && <TimeBox val={timeLeft.days} lbl="D" />}
      <TimeBox val={timeLeft.hours} lbl="H" />
      <TimeBox val={timeLeft.minutes} lbl="M" />
      <TimeBox val={timeLeft.seconds} lbl="S" />
    </Box>
  );
};

const TimeBox = ({ val, lbl }) => (
  <Box
    sx={(theme) => ({
      ...theme.clay.box,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      width: 55,
      height: 55,
      bgcolor: "background.paper",
      borderRadius: "8px",
    })}
  >
    <Typography
      sx={{
        fontSize: "1.3rem",
        fontWeight: 800,
        lineHeight: 1,
      }}
    >
      {String(val).padStart(2, "0")}
    </Typography>
    <Typography
      sx={{ fontSize: "0.8rem", fontWeight: 700, color: "text.secondary" }}
    >
      {lbl}
    </Typography>
  </Box>
);
