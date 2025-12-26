import React from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Avatar,
  Chip,
  Grid,
  alpha,
  useTheme,
} from "@mui/material";
import { Stadium, SportsSoccer, Sports } from "@mui/icons-material";

// --- COMPONENTS ---
import { CountdownTimer } from "./Fixture-Components/Countdown";
import PenaltyTimeline from "./Fixture-Components/PenaltyTimeline";

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

  // Logic: Format Date/Time
  const matchDate = new Date(fixData.timestamp * 1000);
  const dayMonth = matchDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
  const time = matchDate.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Logic: Group Scorers
  const getScorers = (teamId) => {
    return (
      events
        ?.filter((e) => e.team.id === teamId && e.type === "Goal")
        .reduce((acc, curr) => {
          const timeStr = `${curr.time.elapsed}${
            curr.time.extra ? `+${curr.time.extra}` : ""
          }'`;
          const existing = acc.find((p) => p.name === curr.player.name);
          if (existing) existing.times.push(timeStr);
          else acc.push({ name: curr.player.name, times: [timeStr] });
          return acc;
        }, []) || []
    );
  };

  const penaltyEvents = events?.filter(
    (e) => e.comments === "Penalty Shootout"
  );

  return (
    <Paper
      onClick={() => onClick && onClick(fixture.id)}
      className={addClass}
      elevation={0}
      sx={{
        p: 0,
        position: "relative",
        overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
        transition: "transform 0.2s ease",
        "&:hover": onClick ? { transform: "translateY(-2px)" } : {},
      }}
    >
      {/* Top Status Bar */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          position: "absolute",
          top: 12,
          width: "100%",
          zIndex: 2,
        }}
      >
        {isLive ? (
          <LiveBadge elapsed={fixData.status.elapsed} />
        ) : (
          <Chip
            label={isScheduled ? `${dayMonth} • ${time}` : status}
            size="small"
            sx={{
              height: 20,
              fontSize: "0.65rem",
              fontWeight: 800,
            }}
          />
        )}
      </Box>

      <Box sx={{ p: { xs: 2.5, md: 4 }, pt: { xs: 6, md: 7 } }}>
        <Grid container alignItems="center">
          {/* Home Team */}
          <Grid item xs={3}>
            <TeamColumn team={teams.home} />
          </Grid>

          {/* Match Center */}
          <Grid item xs={6}>
            <Stack alignItems="center" spacing={1}>
              {isScheduled ? (
                <CountdownTimer targetTime={fixData.timestamp} />
              ) : (
                <>
                  <Typography
                    variant="h2"
                    sx={{
                      fontSize: { xs: "2.4rem", md: "3.8rem" },
                      lineHeight: 1,
                      letterSpacing: -1,
                    }}
                  >
                    {goals.home ?? 0} — {goals.away ?? 0}
                  </Typography>
                  {score.halftime.home !== null && !isFinished && (
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 800, opacity: 0.6 }}
                    >
                      HT {score.halftime.home}-{score.halftime.away}
                    </Typography>
                  )}
                </>
              )}
            </Stack>
          </Grid>

          {/* Away Team */}
          <Grid item xs={3}>
            <TeamColumn team={teams.away} />
          </Grid>
        </Grid>

        {/* Aggregate Penalties */}
        {score.penalty.home !== null && (
          <Typography
            variant="button"
            display="block"
            textAlign="center"
            color="error"
            sx={{ mt: 2, fontWeight: 900 }}
          >
            PENS ({score.penalty.home}-{score.penalty.away})
          </Typography>
        )}

        {/* Scorer List */}
        {showScorers && !isScheduled && (
          <Box
            sx={{
              mt: 3,
              pt: 2,
              borderTop: `1px dashed ${theme.palette.divider}`,
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

      {/* Detail Footer with Penalty Timeline */}
      {(showPenaltys || showDetails) && (
        <Box
          sx={{
            p: 1.5,
            borderTop: `1px solid ${theme.palette.divider}`,
            bgcolor: alpha(theme.palette.text.primary, 0.02),
          }}
        >
          {/* Integrated Penalty Timeline */}
          {showPenaltys && score.penalty.home !== null && (
            <Box sx={{ mb: showDetails ? 2 : 0 }}>
              <PenaltyTimeline penaltyEvents={penaltyEvents} />
            </Box>
          )}

          {showDetails && (
            <Stack
              direction="row"
              spacing={3}
              justifyContent="center"
              sx={{ opacity: 0.6 }}
            >
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Stadium sx={{ fontSize: 14 }} />
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  {fixData.venue.name}
                </Typography>
              </Stack>
              {fixData.referee && (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Sports sx={{ fontSize: 14 }} />
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {fixData.referee}
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

const TeamColumn = ({ team }) => {
  return (
    <Stack alignItems="center" spacing={1.5}>
      <Avatar
        src={team.logo}
        variant="square"
        sx={{
          width: { xs: 50, md: 70 },
          height: { xs: 50, md: 70 },
          bgcolor: "transparent",
          filter: "drop-shadow(0px 4px 8px rgba(0,0,0,0.15))",
          "& img": { objectFit: "contain" },
        }}
      />
      <Typography
        variant="subtitle2"
        align="center"
        sx={{
          fontWeight: 800,
          fontSize: { xs: "0.65rem", md: "0.9rem" },
          textTransform: "uppercase",
          letterSpacing: 0.5,
          lineHeight: 1.2,
          display: { xs: "none", sm: "block" }, // Optimized for mobile badges
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
    justifyContent={"flex-end"}
    alignItems="center"
    spacing={0.5}
    sx={{ mb: 0.5 }}
  >
    <Typography sx={{ fontSize: "0.65rem", fontWeight: 600 }}>
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
    <SportsSoccer sx={{ fontSize: 10, opacity: 0.3 }} />
  </Stack>
);

const LiveBadge = ({ elapsed }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 1,
      px: 1.5,
      py: 0.4,
      borderRadius: "4px",
      border: "1px solid",
      borderColor: "error.main",
      bgcolor: alpha("#ff4b4b", 0.1),
    }}
  >
    <Box
      sx={{
        width: 6,
        height: 6,
        borderRadius: "50%",
        bgcolor: "error.main",
        animation: "pulse 1.5s infinite",
        "@keyframes pulse": {
          "0%": { opacity: 1 },
          "50%": { opacity: 0.3 },
          "100%": { opacity: 1 },
        },
      }}
    />
    <Typography
      sx={{ fontSize: "0.7rem", fontWeight: 900, color: "error.main" }}
    >
      LIVE {elapsed}'
    </Typography>
  </Box>
);
