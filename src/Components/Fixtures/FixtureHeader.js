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
import {
  Stadium,
  SportsSoccer,
  Sports,
  ArrowForward,
} from "@mui/icons-material";

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
  const dateString = matchDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });

  return (
    <Paper
      onClick={() => onClick && onClick(fixture.id)}
      className={addClass}
      elevation={0}
      sx={{
        p: 0,
        cursor: onClick ? "pointer" : "default",
        position: "relative",
        transition: "all 0.2s ease-in-out",
        overflow: "hidden",
        // Interaction Indicator Logic
        ...(onClick && {
          "&:hover": {
            bgcolor: "action.hover",
            "& .interaction-icon": { opacity: 1, transform: "translateX(0)" },
          },
        }),
      }}
    >
      {/* Interaction Icon */}
      {onClick && (
        <Box
          className="interaction-icon"
          sx={{
            position: "absolute",
            top: 12,
            right: 16,
            opacity: 0,
            transform: "translateX(-10px)",
            transition: "all 0.3s ease",
            color: "primary.main",
          }}
        >
          <ArrowForward fontSize="small" />
        </Box>
      )}

      <Box sx={{ p: { xs: 3, md: 4 } }}>
        {/* Status Badge */}
        <Stack
          direction="row"
          justifyContent="center"
          sx={{ mb: 3 }}
          style={{
            position: "absolute",
            top: 10,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          {inPlay ? (
            <LivePulseBadge elapsed={fixData.status.elapsed} />
          ) : (
            <Chip
              label={
                isScheduled ? `${dateString}  • ${timeString}` : statusShort
              }
              size="small"
              variant="filled"
              sx={{ fontWeight: "bold", height: 20, fontSize: "0.65rem" }}
            />
          )}
        </Stack>

        {/* Main Face-Off Grid: Vertically Centered */}
        <Grid container alignItems="center" justifyContent="center">
          {/* Home Team */}
          <Grid item xs={3.5}>
            <TeamDisplay team={teams.home} />
          </Grid>

          {/* Center Score/Timer: Vertically Centered */}
          <Grid item xs={5}>
            <Stack alignItems="center" justifyContent="center" spacing={1}>
              {isScheduled ? (
                <CountdownTimer targetTime={fixData.timestamp} />
              ) : (
                <>
                  <Typography
                    variant="h2"
                    sx={{ whiteSpace: "nowrap", lineHeight: 1 }}
                  >
                    {goals.home ?? 0} — {goals.away ?? 0}
                  </Typography>
                  {score.halftime.home !== null && !isFinished && (
                    <Typography variant="caption" color="text.secondary">
                      HT {score.halftime.home}-{score.halftime.away}
                    </Typography>
                  )}
                </>
              )}
            </Stack>
          </Grid>

          {/* Away Team */}
          <Grid item xs={3.5}>
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
            sx={{ mt: 2 }}
          >
            PENS: {score.penalty.home}-{score.penalty.away}
          </Typography>
        )}

        {/* Scorers Section */}
        {showScorers && (homeScorers.length > 0 || awayScorers.length > 0) && (
          <Box sx={{ mt: 4, pt: 2, borderTop: 1, borderColor: "divider" }}>
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

      {/* Footer Details */}
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

// --- SUB-COMPONENTS ---

const TeamDisplay = ({ team }) => (
  <Stack
    alignItems="center"
    justifyContent="center"
    spacing={1.5}
    sx={{ width: "100%" }}
  >
    <Avatar
      src={team.logo}
      variant="square"
      sx={{
        width: { xs: 45, md: 65 },
        height: { xs: 45, md: 65 },
        bgcolor: "transparent",
        "& img": { objectFit: "contain" },
      }}
    />
    <Typography
      variant="subtitle1"
      align="center"
      sx={{ width: "100%", fontWeight: "bold" }}
    >
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
    <SportsSoccer sx={{ fontSize: 10, opacity: 0.5 }} />
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
        width: 6,
        height: 6,
        borderRadius: "50%",
        bgcolor: "error.main",
        animation: "pulse 1.5s infinite ease-in-out",
        "@keyframes pulse": {
          "0%": { opacity: 1 },
          "50%": { opacity: 0.4 },
          "100%": { opacity: 1 },
        },
      }}
    />
    <Typography variant="caption" color="error" sx={{ fontWeight: "bold" }}>
      LIVE {elapsed}'
    </Typography>
  </Box>
);
