import React from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Avatar,
  Chip,
  Grid,
} from "@mui/material";
import { Stadium, SportsSoccer, Sports } from "@mui/icons-material";

// --- HOOKS & COMPONENTS ---
import { CountdownTimer } from "../../Hooks/Helper_Functions";
import PenaltyTimeline from "./Fixture-Components/PenaltyTimeline";

export default function FixtureHeader({
  fixture,
  onClick,
  showDate = false,
  showDetails = false,
  showScorers = false,
  showPenaltys = false,
  addClass,
}) {
  // --- DATA PREP ---
  const { teams, fixture: fixData, goals, score, events } = fixture;
  const statusShort = fixData.status.short;
  const inPlay = ["1H", "2H", "ET", "P", "BT"].includes(statusShort);
  const isFinished = ["FT", "AET", "PEN"].includes(statusShort);
  const isScheduled = ["NS", "TBD"].includes(statusShort);

  const groupGoals = (teamId) => {
    const teamEvents =
      events?.filter((e) => e.team.id === teamId && e.type === "Goal") || [];
    const grouped = [];
    teamEvents
      .sort((a, b) => a.time.elapsed - b.time.elapsed)
      .forEach((event) => {
        const timeDisplay = `${event.time.elapsed}${
          event.time.extra ? `+${event.time.extra}` : ""
        }`;
        const existing = grouped.find((p) => p.name === event.player.name);
        if (existing) existing.times.push(timeDisplay);
        else grouped.push({ name: event.player.name, times: [timeDisplay] });
      });
    return grouped;
  };

  const homeScorers = groupGoals(teams.home.id);
  const awayScorers = groupGoals(teams.away.id);
  const penaltyEvents = events?.filter(
    (e) => e.comments === "Penalty Shootout"
  );

  const matchDate = new Date(fixData.timestamp * 1000);
  const timeString = matchDate.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Paper
      onClick={() => onClick && onClick(fixture.id)}
      className={addClass}
      elevation={0}
      sx={{
        p: 0,
        cursor: onClick ? "pointer" : "default",
        transition: "transform 0.2s ease",
      }}
    >
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {/* Status Area */}
        <Stack direction="row" justifyContent="center" sx={{ mb: 2 }}>
          {inPlay ? (
            <LivePulseBadge elapsed={fixData.status.elapsed} />
          ) : (
            <Chip
              label={statusShort === "NS" ? timeString : statusShort}
              size="small"
              variant="filled"
              sx={{ fontWeight: "bold" }}
            />
          )}
        </Stack>

        {/* Main Face-Off Grid */}
        <Grid container spacing={1} alignItems="center" justifyContent="center">
          {/* Home Team */}
          <Grid item xs={4}>
            <TeamDisplay team={teams.home} />
          </Grid>

          {/* Center Score/Timer Area */}
          <Grid item xs={4} sx={{ textAlign: "center" }}>
            {isScheduled ? (
              <Typography color="primary" sx={{ fontWeight: "bold" }}>
                <CountdownTimer targetTime={fixData.timestamp} />
              </Typography>
            ) : (
              <Stack spacing={0}>
                <Typography variant="h2">
                  {goals.home ?? 0} - {goals.away ?? 0}
                </Typography>
                {score.halftime.home !== null && !isFinished && (
                  <Typography variant="caption" color="text.secondary">
                    HT {score.halftime.home}-{score.halftime.away}
                  </Typography>
                )}
              </Stack>
            )}
          </Grid>

          {/* Away Team */}
          <Grid item xs={4}>
            <TeamDisplay team={teams.away} />
          </Grid>
        </Grid>

        {/* Aggregate Score for Penalties */}
        {score.penalty.home !== null && (
          <Typography
            variant="button"
            display="block"
            textAlign="center"
            color="error"
            sx={{ mt: 1 }}
          >
            PENS: {score.penalty.home}-{score.penalty.away}
          </Typography>
        )}

        {/* Scorers Section */}
        {showScorers && (homeScorers.length > 0 || awayScorers.length > 0) && (
          <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: "divider" }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                {homeScorers.map((s, i) => (
                  <ScorerItem key={i} scorer={s} align="right" />
                ))}
              </Grid>
              <Grid item xs={6}>
                {awayScorers.map((s, i) => (
                  <ScorerItem key={i} scorer={s} align="left" />
                ))}
              </Grid>
            </Grid>
          </Box>
        )}
      </Box>

      {/* Footer Info */}
      {(showPenaltys || showDetails) && (
        <Box
          sx={{
            p: 2,
            bgcolor: "action.hover",
            borderTop: 1,
            borderColor: "divider",
          }}
        >
          {showPenaltys && score.penalty.home !== null && (
            <PenaltyTimeline penaltyEvents={penaltyEvents} />
          )}
          {showDetails && (
            <Stack
              direction="row"
              spacing={3}
              justifyContent="center"
              color="text.secondary"
            >
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Stadium fontSize="inherit" />
                <Typography variant="caption">{fixData.venue.name}</Typography>
              </Stack>
              {fixData.referee && (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Sports fontSize="inherit" />
                  <Typography variant="caption">{fixData.referee}</Typography>
                </Stack>
              )}
            </Stack>
          )}
        </Box>
      )}
    </Paper>
  );
}

const TeamDisplay = ({ team }) => (
  <Stack alignItems="center" spacing={1}>
    <Avatar
      src={team.logo}
      variant="square"
      sx={{
        width: { xs: 45, md: 70 },
        height: { xs: 45, md: 70 },
        bgcolor: "transparent",
        "& img": { objectFit: "contain" },
      }}
    />
    <Typography variant="h6" align="center">
      {team.name}
    </Typography>
  </Stack>
);

const ScorerItem = ({ scorer, align }) => (
  <Stack
    direction={align === "right" ? "row" : "row-reverse"}
    justifyContent="flex-end"
    alignItems="center"
    spacing={1}
  >
    <Typography variant="caption" align={align}>
      {scorer.name}{" "}
      <Typography
        component="span"
        variant="caption"
        color="primary"
        sx={{ fontWeight: "bold" }}
      >
        {scorer.times.map((t) => t + "'").join(", ")}
      </Typography>
    </Typography>
    <SportsSoccer sx={{ fontSize: 12, opacity: 0.5 }} />
  </Stack>
);

const LivePulseBadge = ({ elapsed }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 1,
      px: 1.5,
      py: 0.5,
      border: 1,
      borderColor: "error.main",
      bgcolor: "action.selected",
    }}
  >
    <Box
      sx={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        bgcolor: "error.main",
      }}
    />
    <Typography variant="caption" color="error" sx={{ fontWeight: "bold" }}>
      LIVE {elapsed}'
    </Typography>
  </Box>
);
