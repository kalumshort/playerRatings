"use client";

import React from "react";
import { Paper, Typography, Box, Chip, useTheme } from "@mui/material";
import Grid from "@mui/material/Grid";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { StatBox } from "./StatBox";
import { HtmlTooltip } from "@/components/ui/HtmlTooltip";

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
}

const BAR_HEIGHT: Record<"W" | "D" | "L", number> = { W: 52, D: 34, L: 18 };

export default function SeasonOverview({ stats, played }: SeasonOverviewProps) {
  const theme = useTheme();
  const points = stats.w * 3 + stats.d;
  const last5 = played.slice(-5);

  const getColor = (result: "W" | "D" | "L") => {
    if (result === "W") return theme.palette.success.main;
    if (result === "D") return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  return (
    <Box sx={{ flexShrink: 0, zIndex: 10, pb: 2 }}>
      <Paper elevation={0} sx={{ p: 3, borderRadius: "0 0 32px 32px" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
          }}
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
          {/* <Chip
            label={`${points} pts`}
            size="small"
            sx={{
              fontWeight: 800,
              fontSize: "0.7rem",
              bgcolor: "background.default",
              color: "text.primary",
              height: 22,
              "& .MuiChip-label": { px: 1 },
            }}
          /> */}
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 4 }}>
            <StatBox
              value={stats.w}
              label="WON"
              color={theme.palette.success.main}
            />
          </Grid>
          <Grid size={{ xs: 4 }}>
            <StatBox
              value={stats.d}
              label="DRAWN"
              color={theme.palette.warning.main}
            />
          </Grid>
          <Grid size={{ xs: 4 }}>
            <StatBox
              value={stats.l}
              label="LOST"
              color={theme.palette.error.main}
            />
          </Grid>
        </Grid>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1,
            px: 1,
          }}
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
            FORM GUIDE
          </Typography>
          <Box sx={{ display: "flex", gap: "5px", alignItems: "center" }}>
            {last5.map((game) => (
              <Box
                key={`dot-${game.fixture.id}`}
                sx={{
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  bgcolor: getColor(game.result),
                }}
              />
            ))}
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: "7px",
            overflowX: "auto",
            pt: 1.5,
            pb: 1,
            px: 1,
            alignItems: "flex-end",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {played.map((game, i) => (
            <HtmlTooltip
              key={game.fixture.id}
              arrow
              title={
                <Box sx={{ p: 0.5 }}>
                  <Typography variant="subtitle2" fontWeight={800}>
                    {game.teams.home.name} {game.goals.home}–{game.goals.away}{" "}
                    {game.teams.away.name}
                  </Typography>
                  {game.fixture.date && (
                    <Typography variant="caption" sx={{ opacity: 0.65 }}>
                      {format(new Date(game.fixture.date), "d MMM yyyy")}
                    </Typography>
                  )}
                </Box>
              }
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "5px",
                  cursor: "pointer",
                }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: i * 0.035,
                    duration: 0.35,
                    ease: "easeOut",
                  }}
                >
                  <Box
                    sx={{
                      width: "15px",
                      height: `${BAR_HEIGHT[game.result]}px`,
                      borderRadius: "8px",
                      background: `linear-gradient(180deg, ${getColor(game.result)}99, ${getColor(game.result)})`,
                      transition: "all 0.2s ease",
                      "&:hover": {
                        transform: "scaleY(1.12) translateY(-3px)",
                        filter: "brightness(1.1)",
                      },
                    }}
                  />
                </motion.div>
                <Typography
                  sx={{
                    fontSize: "0.5rem",
                    fontWeight: 900,
                    color: getColor(game.result),
                    lineHeight: 1,
                    opacity: 0.8,
                  }}
                >
                  {game.result}
                </Typography>
              </Box>
            </HtmlTooltip>
          ))}
        </Box>
      </Paper>
    </Box>
  );
}
