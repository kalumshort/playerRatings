"use client";

import React from "react";
import { Paper, Typography, Box, Grid, useTheme } from "@mui/material";
import { styled } from "@mui/material/styles";
import { StatBox } from "./StatBox";
import { HtmlTooltip } from "@/components/ui/HtmlTooltip";

const FixedHeader = styled("div")({
  flexShrink: 0,
  zIndex: 10,
  paddingBottom: "16px",
});

export default function SeasonOverview({ stats, played }: any) {
  const theme = useTheme();

  return (
    <FixedHeader>
      <Paper elevation={0} sx={{ p: 3, borderRadius: "0 0 32px 32px" }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 900,
            fontSize: "1.2rem",
            mb: 3,
            textAlign: "center",
          }}
        >
          SEASON OVERVIEW
        </Typography>

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

        <Typography
          variant="caption"
          sx={{ fontWeight: 800, color: "text.secondary", ml: 1, opacity: 0.6 }}
        >
          FORM GUIDE
        </Typography>

        <Box
          sx={{
            display: "flex",
            gap: "8px",
            overflowX: "auto",
            py: 2,
            px: 1,
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {played.map((game: any) => (
            <HtmlTooltip
              key={game.fixture.id}
              arrow
              title={
                <Box>
                  <Typography variant="subtitle2" fontWeight={800}>
                    {game.teams.home.name} vs {game.teams.away.name}
                  </Typography>
                  <Typography variant="caption">
                    Result: {game.goals.home} - {game.goals.away}
                  </Typography>
                </Box>
              }
            >
              <Box
                sx={{
                  minWidth: "16px",
                  height:
                    game.result === "W"
                      ? "48px"
                      : game.result === "D"
                        ? "32px"
                        : "20px",
                  borderRadius: "20px",
                  bgcolor:
                    game.result === "W"
                      ? "success.main"
                      : game.result === "D"
                        ? "warning.main"
                        : "error.main",
                  alignSelf: "flex-end",
                  transition: "all 0.2s ease",
                  "&:hover": { transform: "scaleY(1.2) translateY(-4px)" },
                }}
              />
            </HtmlTooltip>
          ))}
        </Box>
      </Paper>
    </FixedHeader>
  );
}
