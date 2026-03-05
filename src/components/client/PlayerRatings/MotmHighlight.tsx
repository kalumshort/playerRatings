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
      elevation={0}
      sx={{
        // Use theme-defined clay card if available, otherwise fallback to custom object
        ...((theme as any).clay?.card || {
          bgcolor: "background.paper",
          boxShadow: theme.shadows[2],
        }),
        position: "relative",
        p: 3,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        overflow: "hidden",
        width: "100%",
        mx: "auto",
        borderRadius: "24px",
        // Soft gradient overlay to emphasize the winner
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
      }}
    >
      {/* --- BADGE: PRESSED LOOK --- */}
      <Box
        sx={{
          // Custom "Pressed" style logic
          borderRadius: "16px",
          bgcolor:
            theme.palette.mode === "dark"
              ? alpha("#000", 0.2)
              : alpha(theme.palette.common.white, 0.5),
          boxShadow:
            theme.palette.mode === "dark"
              ? "inset 2px 2px 4px rgba(0,0,0,0.5), inset -1px -1px 2px rgba(255,255,255,0.05)"
              : "inset 2px 2px 5px rgba(0,0,0,0.05), inset -1px -1px 2px rgba(255,255,255,1)",
          position: "absolute",
          top: 16,
          right: 16,
          padding: "6px 14px",
          display: "flex",
          alignItems: "center",
          gap: 1,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        <Users size={14} color={theme.palette.text.secondary} />
        <Typography
          variant="caption"
          sx={{ fontWeight: 800, color: "text.secondary" }}
        >
          {winner.percentage}% VOTE
        </Typography>
      </Box>

      {/* --- AVATAR: FLOATING LOOK --- */}
      <Box sx={{ position: "relative", mb: 1, mt: 2 }}>
        <Avatar
          src={winner.img}
          alt={winner.name}
          sx={{
            width: 110,
            height: 110,
            border: `6px solid ${theme.palette.background.paper}`,
            boxShadow: `0 12px 24px ${alpha(theme.palette.common.black, 0.15)}`,
            bgcolor: "background.default",
          }}
        />

        {/* Gold Trophy (Custom float) */}
        <Box
          sx={{
            position: "absolute",
            bottom: 4,
            right: 4,
            backgroundColor: "#FFD700",
            width: 36,
            height: 36,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `4px solid ${theme.palette.background.paper}`,
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            zIndex: 2,
          }}
        >
          <Trophy size={18} color="#B7791F" strokeWidth={2.5} />
        </Box>
      </Box>

      {/* --- TEXT --- */}
      <Box sx={{ mt: 1, textAlign: "center", zIndex: 2 }}>
        <Typography
          variant="overline"
          sx={{
            color: "primary.main",
            letterSpacing: 2,
            fontWeight: 800,
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
            fontWeight: 900,
            color: "text.primary",
            lineHeight: 1.2,
            textShadow:
              theme.palette.mode === "light"
                ? "0 1px 1px rgba(0,0,0,0.05)"
                : "none",
          }}
        >
          {winner.name}
        </Typography>
      </Box>
    </Paper>
  );
}
