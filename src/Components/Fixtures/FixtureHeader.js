import React from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Avatar,
  Chip,
  useTheme,
  Grid,
} from "@mui/material";
import {
  Stadium,
  SportsSoccer,
  ArrowForward,
  Sports,
} from "@mui/icons-material";

// --- HOOKS & COMPONENTS ---
import { CountdownTimer } from "../../Hooks/Helper_Functions";
import PenaltyTimeline from "./Fixture-Components/PenaltyTimeline";
import { useFixtureGradientProvider } from "../../Providers/FixtureGradientProvider";

export default function FixtureHeader({
  fixture,
  onClick,
  showDate = false,
  showDetails = false,
  showScorers = false,
  showPenaltys = false,
  addClass,
}) {
  const theme = useTheme();
  const { fixtureGradient } = useFixtureGradientProvider() || {};

  // --- DATA PREP ---
  const homeTeamId = fixture.teams.home.id;
  const awayTeamId = fixture.teams.away.id;
  const statusShort = fixture.fixture.status.short;

  const inPlay = ["1H", "2H", "ET", "P", "BT"].includes(statusShort);
  const isFinished = ["FT", "AET", "PEN"].includes(statusShort);
  const isScheduled = ["NS", "TBD"].includes(statusShort);

  // --- GOAL GROUPING LOGIC ---
  const groupGoals = (events) => {
    if (!events) return [];
    const grouped = [];

    // Sort by time first so the list order makes sense
    const sortedEvents = [...events].sort(
      (a, b) => a.time.elapsed - b.time.elapsed
    );

    sortedEvents.forEach((event) => {
      // Create a nice time string (e.g. "90+2")
      const timeDisplay =
        event.time.elapsed + (event.time.extra ? `+${event.time.extra}` : "");
      const playerName = event.player.name;

      // Check if player is already in our list
      const existingPlayer = grouped.find((p) => p.name === playerName);

      if (existingPlayer) {
        existingPlayer.times.push(timeDisplay);
      } else {
        grouped.push({ name: playerName, times: [timeDisplay] });
      }
    });

    return grouped;
  };

  // Get Raw Events
  const rawHomeGoals = fixture?.events?.filter(
    (e) => e.team.id === homeTeamId && e.type === "Goal"
  );
  const rawAwayGoals = fixture?.events?.filter(
    (e) => e.team.id === awayTeamId && e.type === "Goal"
  );

  // Group them
  const homeScorers = groupGoals(rawHomeGoals);
  const awayScorers = groupGoals(rawAwayGoals);

  const penaltyEvents = fixture?.events?.filter(
    (e) => e.comments === "Penalty Shootout"
  );

  const matchDate = new Date(fixture.fixture.timestamp * 1000);
  const timeString = matchDate.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateFullString = matchDate.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // --- STYLES ---
  const containerSx = {
    p: 0,
    cursor: onClick ? "pointer" : "default",
    position: "relative",
    transition: "transform 0.2s, box-shadow 0.2s",
    overflow: "hidden",
    "&:hover": onClick
      ? {
          transform: "translateY(-2px)",
          boxShadow: `0 12px 24px -10px ${theme.palette.primary.main}40`,
        }
      : {},
    "::before": fixtureGradient
      ? {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, ${fixtureGradient}20 0%, transparent 100%)`,
          zIndex: 0,
        }
      : {},
  };

  return (
    <Paper
      sx={containerSx}
      onClick={() => onClick && onClick(fixture.id)}
      className={addClass}
      elevation={0}
    >
      <Box sx={{ position: "relative", zIndex: 1, p: 3 }}>
        {/* --- TOP ROW: STATUS & ICONS --- */}
        <Box
          sx={{
            position: "absolute",
            top: 12,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
          }}
        >
          {inPlay ? (
            <LivePulseBadge elapsed={fixture.fixture.status.elapsed} />
          ) : (
            <Chip
              label={statusShort === "NS" ? timeString : statusShort}
              size="small"
              sx={{
                fontFamily: "Space Mono",
                fontWeight: "bold",
                bgcolor: theme.palette.divider,
                fontSize: "0.7rem",
                height: 20,
              }}
            />
          )}
        </Box>

        {onClick && (
          <Box sx={{ position: "absolute", top: 12, right: 12, opacity: 0.5 }}>
            <ArrowForward fontSize="small" />
          </Box>
        )}

        {/* --- MAIN FACE-OFF AREA --- */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          spacing={{ xs: 2, md: 6 }}
          sx={{ mt: 2 }}
        >
          <TeamDisplay team={fixture.teams.home} align="right" />

          <Box sx={{ textAlign: "center", minWidth: 80 }}>
            {isScheduled ? (
              <Box sx={{ color: "text.secondary", fontFamily: "Space Mono" }}>
                <CountdownTimer targetTime={fixture.fixture.timestamp} />
              </Box>
            ) : (
              <Stack alignItems="center">
                <Typography
                  variant="h2"
                  sx={{
                    fontFamily: "VT323",
                    lineHeight: 0.8,
                    fontWeight: "bold",
                    fontSize: { xs: "3rem", md: "4rem" },
                    letterSpacing: 2,
                  }}
                >
                  {fixture.goals.home ?? 0}-{fixture.goals.away ?? 0}
                </Typography>

                {fixture.score.halftime.home !== null && !isFinished && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 0.5, fontFamily: "Space Mono" }}
                  >
                    HT {fixture.score.halftime.home}-
                    {fixture.score.halftime.away}
                  </Typography>
                )}
              </Stack>
            )}
          </Box>

          <TeamDisplay team={fixture.teams.away} align="left" />
        </Stack>

        {/* --- EXTRA DETAILS (Date/Pens) --- */}
        <Stack alignItems="center" spacing={1} sx={{ mt: 2 }}>
          {showDate && !inPlay && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontFamily: "Space Mono", fontSize: "0.7rem" }}
            >
              {dateFullString}
            </Typography>
          )}

          {fixture.score.penalty.home !== null && (
            <Chip
              label={`PENS: ${fixture.score.penalty.home}-${fixture.score.penalty.away}`}
              size="small"
              color="error"
              sx={{
                height: 20,
                fontWeight: "bold",
                fontFamily: "Space Mono",
                fontSize: "0.65rem",
              }}
            />
          )}
        </Stack>

        {/* --- SCORERS SECTION (Split Layout & Grouped) --- */}
        {showScorers && (homeScorers.length > 0 || awayScorers.length > 0) && (
          <Box
            sx={{
              mt: 3,
              pt: 2,
              borderTop: `1px dashed ${theme.palette.divider}`,
            }}
          >
            <Grid container>
              {/* HOME SCORERS (Right Aligned) */}
              <Grid item xs={5} sx={{ textAlign: "right", pr: 1 }}>
                {homeScorers.map((scorer, index) => (
                  <Stack
                    key={index}
                    direction="row"
                    justifyContent="flex-end"
                    alignItems="flex-start" // Align top in case of multi-line
                    spacing={1}
                    sx={{ mb: 0.5 }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ fontFamily: "Space Mono", fontSize: "0.75rem" }}
                    >
                      {scorer.name}{" "}
                      <span
                        style={{
                          color: theme.palette.primary.main,
                          fontWeight: "bold",
                        }}
                      >
                        {scorer.times.map((t) => t + "'").join(", ")}
                      </span>
                    </Typography>
                    <SportsSoccer
                      sx={{ fontSize: 12, color: "text.secondary", mt: 0.5 }}
                    />
                  </Stack>
                ))}
              </Grid>

              {/* CENTER GAP */}
              <Grid item xs={2} />

              {/* AWAY SCORERS (Left Aligned) */}
              <Grid item xs={5} sx={{ textAlign: "left", pl: 1 }}>
                {awayScorers.map((scorer, index) => (
                  <Stack
                    key={index}
                    direction="row"
                    justifyContent="flex-start"
                    alignItems="flex-start"
                    spacing={1}
                    sx={{ mb: 0.5 }}
                  >
                    <SportsSoccer
                      sx={{ fontSize: 12, color: "text.secondary", mt: 0.5 }}
                    />
                    <Typography
                      variant="caption"
                      sx={{ fontFamily: "Space Mono", fontSize: "0.75rem" }}
                    >
                      <span
                        style={{
                          color: theme.palette.primary.main,
                          fontWeight: "bold",
                        }}
                      >
                        {scorer.times.map((t) => t + "'").join(", ")}
                      </span>{" "}
                      {scorer.name}
                    </Typography>
                  </Stack>
                ))}
              </Grid>
            </Grid>
          </Box>
        )}
      </Box>

      {/* --- FOOTER: PENALTIES & DETAILS --- */}
      {(showPenaltys || showDetails) && (
        <Box
          sx={{
            p: 1.5,
            bgcolor: "rgba(0,0,0,0.02)",
            borderTop: `1px solid ${theme.palette.divider}`,
          }}
        >
          {showPenaltys && fixture.score.penalty.home !== null && (
            <Box sx={{ mb: showDetails ? 2 : 0 }}>
              <PenaltyTimeline penaltyEvents={penaltyEvents} />
            </Box>
          )}

          {showDetails && (
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={{ xs: 1, sm: 3 }}
              justifyContent="center"
              alignItems="center"
              sx={{ opacity: 0.7 }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Stadium sx={{ fontSize: 14 }} />
                <Typography variant="caption" sx={{ fontFamily: "Space Mono" }}>
                  {fixture.fixture.venue.name}
                </Typography>
              </Stack>

              {fixture.fixture.referee && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Sports sx={{ fontSize: 14 }} />
                  <Typography
                    variant="caption"
                    sx={{ fontFamily: "Space Mono" }}
                  >
                    {fixture.fixture.referee}
                  </Typography>
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

const TeamDisplay = ({ team, align }) => (
  <Stack
    alignItems="center"
    justifyContent="center"
    spacing={1}
    sx={{ width: 100 }}
  >
    <Avatar
      src={team.logo}
      alt={team.name}
      sx={{
        width: { xs: 50, md: 60 },
        height: { xs: 50, md: 60 },
        filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.2))",
        borderRadius: "0px",
      }}
    />
    <Typography
      variant="subtitle2"
      align="center"
      noWrap
      sx={{
        fontFamily: "VT323",
        textTransform: "uppercase",
        fontSize: "1.1rem",
        width: "100%",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {team.name}
    </Typography>
  </Stack>
);

const LivePulseBadge = ({ elapsed }) => {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        px: 1,
        py: 0.2,
        borderRadius: 10,
        bgcolor: "#ff174420",
        border: "1px solid #ff1744",
      }}
    >
      <Box
        sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#ff1744" }}
      />
      <Typography
        variant="caption"
        sx={{
          color: "#ff1744",
          fontWeight: "bold",
          fontFamily: "Space Mono",
          fontSize: "0.65rem",
        }}
      >
        LIVE {elapsed}'
      </Typography>
    </Box>
  );
};
