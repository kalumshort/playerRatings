"use client";

import { Avatar, Box, Chip, Stack, Typography, alpha, useTheme } from "@mui/material";
import { ShowcaseFixture, ShowcasePlayer } from "@/lib/homepageShowcase";
import DemoFrame from "@/components/client/Home/DemoFrame";

/**
 * Predictions: winner, scoreline, player to watch.
 *
 * Crests, club names and player names/photos are real, pulled from Firestore by
 * getHomepageShowcase(). The percentages are illustrative — hence the EXAMPLE
 * label from DemoFrame — and are never presented as recorded vote counts.
 */
const EXAMPLE_SPLIT = { home: 47, draw: 22, away: 31 };
const EXAMPLE_PLAYER_SHARE = [38, 21, 14];
const EXAMPLE_SCORE = { home: 2, away: 1 };

export default function PredictionsDemo({
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
      <Stack spacing={3.5}>
        {/* --- Winner --- */}
        <Box>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 1.5, pr: 9 }}
          >
            <Typography
              variant="overline"
              sx={{ fontWeight: 800, letterSpacing: 2, opacity: 0.6 }}
            >
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
            <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.6 }}>
              DRAW
            </Typography>
            <Typography variant="caption" noWrap sx={{ fontWeight: 700, maxWidth: "40%" }}>
              {fixture?.awayName?.toUpperCase() || "AWAY"}
            </Typography>
          </Stack>
        </Box>

        {/* --- Scoreline --- */}
        <Box>
          <Typography
            variant="overline"
            sx={{ fontWeight: 800, letterSpacing: 2, opacity: 0.6, display: "block", mb: 1.5 }}
          >
            Score predictor
          </Typography>

          <Stack direction="row" alignItems="center" justifyContent="center" spacing={2}>
            <ScoreStepper value={EXAMPLE_SCORE.home} logo={fixture?.homeLogo} />
            <Typography sx={{ fontWeight: 900, opacity: 0.35, fontSize: "1.4rem" }}>
              –
            </Typography>
            <ScoreStepper value={EXAMPLE_SCORE.away} logo={fixture?.awayLogo} />
          </Stack>

          <Box
            sx={{
              ...theme.clay?.button,
              mt: 2,
              py: 1,
              borderRadius: "8px",
              textAlign: "center",
              bgcolor: alpha(theme.palette.primary.main, 0.14),
              color: "text.primary",
              fontWeight: 900,
              fontSize: "0.8rem",
              letterSpacing: 1,
            }}
          >
            CONFIRM {EXAMPLE_SCORE.home}-{EXAMPLE_SCORE.away}
          </Box>
        </Box>

        {/* --- Player to watch --- */}
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

/** A static replica of the ScorePrediction stepper — crest, −, value, +. */
function ScoreStepper({ value, logo }: { value: number; logo?: string }) {
  return (
    <Stack alignItems="center" spacing={1}>
      <Avatar
        src={logo}
        alt=""
        sx={{ width: 26, height: 26, bgcolor: "transparent" }}
        imgProps={{ style: { objectFit: "contain" } }}
      />
      <Stack direction="row" alignItems="center" spacing={1}>
        <StepperKey glyph="−" />
        <Typography sx={{ fontWeight: 900, fontSize: "2rem", lineHeight: 1, minWidth: 28, textAlign: "center" }}>
          {value}
        </Typography>
        <StepperKey glyph="+" />
      </Stack>
    </Stack>
  );
}

const StepperKey = ({ glyph }: { glyph: string }) => (
  <Box
    sx={(t) => ({
      width: 24,
      height: 24,
      borderRadius: "6px",
      display: "grid",
      placeItems: "center",
      fontWeight: 900,
      fontSize: "0.9rem",
      color: "text.secondary",
      border: `1px solid ${t.palette.divider}`,
    })}
  >
    {glyph}
  </Box>
);
