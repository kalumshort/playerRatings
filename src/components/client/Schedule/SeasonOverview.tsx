"use client";

import React from "react";
import {
  Box,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { format } from "date-fns";

import { HtmlTooltip } from "@/components/ui/HtmlTooltip";
import SeasonSwitcher from "../Widgets/SeasonSwitcher";
import { formatSeason, isArchivedSeason } from "@/lib/config/season";
import { getResultColor } from "@/lib/utils/football-logic";

interface FixtureTeam {
  id: number;
  name: string;
  logo: string;
  winner: boolean | null;
}

interface GameResult {
  fixture: { id: number; date: string; timestamp: number };
  teams: { home: FixtureTeam; away: FixtureTeam };
  goals: { home: number; away: number };
  result: "W" | "D" | "L";
}

interface Stats {
  w: number;
  d: number;
  l: number;
}

interface SeasonOverviewProps {
  stats: Stats;
  played: GameResult[];
  season: string;
}

const RESULT_WORD: Record<"W" | "D" | "L", string> = {
  W: "Won",
  D: "Drew",
  L: "Lost",
};

const DOT = 10;

/** The season in one card: what it is worth, and the run that got there. */
export default function SeasonOverview({
  stats,
  played,
  season,
}: SeasonOverviewProps) {
  const theme = useTheme();

  const points = stats.w * 3 + stats.d;
  const archived = isArchivedSeason(season);
  const latestId = played.length ? played[played.length - 1].fixture.id : null;

  const tally = [
    { key: "W" as const, count: stats.w },
    { key: "D" as const, count: stats.d },
    { key: "L" as const, count: stats.l },
  ];

  return (
    <Box sx={{ flexShrink: 0, zIndex: 10, pb: 2 }}>
      <Paper sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2.5 }}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: 800,
              color: "text.secondary",
              opacity: 0.5,
              letterSpacing: 1,
            }}
          >
            SEASON OVERVIEW
          </Typography>
          <SeasonSwitcher season={season} />
        </Stack>

        {archived && (
          <Chip
            label={`${formatSeason(season)} archive — read only`}
            size="small"
            sx={{
              mb: 2.5,
              fontWeight: 700,
              fontSize: "0.65rem",
              bgcolor: "background.default",
              color: "text.secondary",
            }}
          />
        )}

        {/* The record and the run sit side by side once there is room for
            them. Stacked, they left the right half of a desktop-width card
            empty and pushed the fixture list a screenful down. */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={{ xs: 3, md: 4 }}
          alignItems={{ xs: "stretch", md: "center" }}
        >
          {/* --- THE HEADLINE ---
              Left-aligned as one group rather than pushed to both edges: with
              space-between, the points and the record sat a card's width
              apart with nothing between them. */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={{ xs: 2, sm: 2.5 }}
            divider={<Divider orientation="vertical" flexItem />}
            sx={{ flexShrink: 0 }}
          >
            <Box>
              <Typography
                sx={{
                  fontWeight: 900,
                  fontSize: { xs: "2.5rem", sm: "2.75rem" },
                  lineHeight: 0.9,
                  letterSpacing: "-0.03em",
                }}
              >
                {points}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mt: 0.75,
                  fontWeight: 800,
                  letterSpacing: 1,
                  color: "text.secondary",
                  opacity: 0.55,
                }}
              >
                POINTS
              </Typography>
            </Box>

            <Box>
              <Stack direction="row" spacing={0.9} alignItems="baseline">
                {tally.map(({ key, count }, i) => (
                  <React.Fragment key={key}>
                    {i > 0 && (
                      <Typography sx={{ opacity: 0.25, fontSize: "0.8rem" }}>
                        ·
                      </Typography>
                    )}
                    <Stack direction="row" spacing={0.4} alignItems="baseline">
                      <Typography
                        sx={{
                          fontWeight: 900,
                          fontSize: "1.1rem",
                          lineHeight: 1,
                          color: getResultColor(key, theme),
                        }}
                      >
                        {count}
                      </Typography>
                      <Typography
                        sx={{
                          fontWeight: 800,
                          fontSize: "0.7rem",
                          color: "text.secondary",
                          opacity: 0.7,
                        }}
                      >
                        {key}
                      </Typography>
                    </Stack>
                  </React.Fragment>
                ))}
              </Stack>
              {/* The fixture list is every competition, so the points above are a
                running 3-1-0 tally and not a league table position. Saying so
                here is cheaper than a number that quietly disagrees with the
                table. */}
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mt: 0.75,
                  fontWeight: 700,
                  fontSize: "0.68rem",
                  color: "text.secondary",
                  opacity: 0.55,
                }}
              >
                {played.length} played, all comps
              </Typography>
            </Box>
          </Stack>

          {/* --- FORM --- */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack
              direction="row"
              alignItems="baseline"
              spacing={1.25}
              sx={{ mb: 1.25 }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  color: "text.secondary",
                  opacity: 0.5,
                  letterSpacing: 1,
                }}
              >
                FORM
              </Typography>
              {played.length > 1 && (
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    color: "text.secondary",
                    opacity: 0.4,
                  }}
                >
                  oldest → latest
                </Typography>
              )}
            </Stack>

            {played.length === 0 ? (
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", opacity: 0.6 }}
              >
                No matches played yet this season.
              </Typography>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: "7px",
                }}
              >
                {played.map((game) => {
                  const color = getResultColor(game.result, theme);
                  const latest = game.fixture.id === latestId;
                  const score = `${game.teams.home.name} ${game.goals.home}–${game.goals.away} ${game.teams.away.name}`;

                  return (
                    <HtmlTooltip
                      key={game.fixture.id}
                      arrow
                      title={
                        <Box sx={{ p: 0.25 }}>
                          <Typography
                            sx={{
                              fontSize: "0.62rem",
                              fontWeight: 900,
                              letterSpacing: 0.6,
                              color,
                            }}
                          >
                            {RESULT_WORD[game.result].toUpperCase()}
                          </Typography>
                          <Typography
                            variant="subtitle2"
                            fontWeight={800}
                            sx={{ mt: 0.25 }}
                          >
                            {score}
                          </Typography>
                          {game.fixture.date && (
                            <Typography
                              variant="caption"
                              sx={{ opacity: 0.65 }}
                            >
                              {format(
                                new Date(game.fixture.date),
                                "d MMM yyyy",
                              )}
                            </Typography>
                          )}
                        </Box>
                      }
                    >
                      {/* Deliberately not a motion.div. A staggered entrance
                          ships every dot from the server at opacity 0, which
                          leaves a whole season's form invisible until
                          hydration lands — a bad trade for a fade nobody
                          asked for. Hover is plain CSS for the same reason. */}
                      <Box
                        // A bare div's aria-label is ignored by most screen
                        // readers; role="img" is what makes the dot announce as
                        // the result it stands for.
                        role="img"
                        aria-label={`${RESULT_WORD[game.result]} — ${score}`}
                        sx={{
                          width: DOT,
                          height: DOT,
                          flexShrink: 0,
                          borderRadius: "50%",
                          bgcolor: color,
                          cursor: "pointer",
                          // A halo on the most recent result, so the live end of
                          // the run is findable without counting from the left.
                          boxShadow: latest
                            ? `0 0 0 2.5px ${alpha(color, 0.3)}`
                            : "none",
                          transition: "transform 0.15s ease",
                          "&:hover": { transform: "scale(1.4)" },
                          "@media (prefers-reduced-motion: reduce)": {
                            transition: "none",
                          },
                        }}
                      />
                    </HtmlTooltip>
                  );
                })}
              </Box>
            )}
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}
