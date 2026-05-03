"use client";

import React from "react";
import { Box, Typography, Paper, Avatar, useTheme, alpha } from "@mui/material";
import { Trophy, Users } from "lucide-react";

interface MotmWinner {
  name: string;
  img: string;
  percentage: string | number;
  votes: number;
}

interface FanMOTMHighlightProps {
  motmPercentages: MotmWinner[];
}

export default function FanMOTMHighlight({
  motmPercentages,
}: FanMOTMHighlightProps) {
  const theme = useTheme();
  const winner = motmPercentages?.[0];

  if (!winner) return null;

  return (
    <Paper
      sx={{
        position: "relative",
        p: 3,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        overflow: "hidden",
        width: "100%",
        mx: "auto",
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
      }}
    >
      <Paper
        variant="flat"
        sx={{
          position: "absolute",
          top: 16,
          right: 16,
          py: 0.75,
          px: 1.75,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Users size={14} color={theme.palette.text.secondary} />
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {winner.percentage}% VOTE
        </Typography>
      </Paper>

      <Box sx={{ position: "relative", mb: 1, mt: 2 }}>
        <Avatar
          src={winner.img}
          alt={winner.name}
          sx={{
            width: 110,
            height: 110,
            bgcolor: "background.default",
          }}
        />

        <Box
          sx={{
            position: "absolute",
            bottom: 4,
            right: 4,
            backgroundColor: theme.palette.motm.gold,
            width: 36,
            height: 36,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
          }}
        >
          <Trophy
            size={18}
            color={theme.palette.motm.bronzeAccent}
            strokeWidth={2.5}
          />
        </Box>
      </Box>

      <Box sx={{ mt: 1, textAlign: "center", zIndex: 2 }}>
        <Typography
          variant="overline"
          sx={{
            color: "primary.main",
            letterSpacing: 2,
            lineHeight: 2,
            display: "block",
            textTransform: "uppercase",
          }}
        >
          Fan Man of the Match
        </Typography>

        <Typography
          variant="h5"
          sx={{
            color: "text.primary",
            lineHeight: 1.2,
          }}
        >
          {winner.name}
        </Typography>
      </Box>
    </Paper>
  );
}
