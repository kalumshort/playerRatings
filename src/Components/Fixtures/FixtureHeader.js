import React from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Avatar,
  Chip,
  useTheme,
} from "@mui/material";
import {
  Stadium,
  SportsSoccer,
  ArrowForward,
  Sports, // Generic icon for Referee
} from "@mui/icons-material";

// --- HOOKS & COMPONENTS ---
import { CountdownTimer } from "../../Hooks/Helper_Functions";
// import FixtureEventsList from "./FixtureEventsList";
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

  const homeEvents = fixture?.events?.filter((e) => e.team.id === homeTeamId);
  const awayEvents = fixture?.events?.filter((e) => e.team.id === awayTeamId);
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

        {/* --- SCORERS --- */}
        {showScorers && (homeEvents?.length > 0 || awayEvents?.length > 0) && (
          <Box
            sx={{
              mt: 3,
              pt: 2,
              borderTop: `1px dashed ${theme.palette.divider}`,
            }}
          >
            <Stack spacing={0.5} alignItems="center">
              {[...(homeEvents || []), ...(awayEvents || [])]
                .filter((e) => e.type === "Goal")
                .sort((a, b) => a.time.elapsed - b.time.elapsed)
                .map((event, index) => (
                  <Stack
                    key={index}
                    direction="row"
                    alignItems="center"
                    spacing={1}
                  >
                    <SportsSoccer
                      sx={{ fontSize: 12, color: "text.secondary" }}
                    />
                    <Typography
                      variant="caption"
                      sx={{ fontFamily: "Space Mono", fontSize: "0.75rem" }}
                    >
                      {event.player.name} {event.time.elapsed}'
                      <Box
                        component="span"
                        sx={{
                          ml: 0.5,
                          fontWeight: "bold",
                          color: theme.palette.primary.main,
                        }}
                      >
                        {event.team.id === homeTeamId
                          ? fixture.teams.home.code
                          : fixture.teams.away.code}
                      </Box>
                    </Typography>
                  </Stack>
                ))}
            </Stack>
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

          {/* DETAILS SECTION: VENUE & REFEREE */}
          {showDetails && (
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={{ xs: 1, sm: 3 }}
              justifyContent="center"
              alignItems="center"
              sx={{ opacity: 0.7 }}
            >
              {/* Venue */}
              <Stack direction="row" spacing={1} alignItems="center">
                <Stadium sx={{ fontSize: 14 }} />
                <Typography variant="caption" sx={{ fontFamily: "Space Mono" }}>
                  {fixture.fixture.venue.name}
                </Typography>
              </Stack>

              {/* Referee (Added Back) */}
              {fixture.fixture.referee && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Sports sx={{ fontSize: 14 }} />{" "}
                  {/* Generic Sports Icon or Whistle */}
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
