"use client";

import React from "react";
import { Box, Typography, Paper, Avatar, alpha, useTheme } from "@mui/material";
import { Trophy, Users } from "lucide-react";
import { useSelector } from "react-redux";
import {
  selectMatchMotmById,
  selectMotmPercentages,
} from "@/lib/redux/selectors/ratingsSelectors";

interface FanMOTMHighlightProps {
  fixtureId: string;
  // motmPercentages: Array<{
  //   name: string;
  //   img: string;
  //   percentage: number;
  //   id: string | number;
  // }>;
}

export default function FanMOTMHighlight({ fixtureId }: FanMOTMHighlightProps) {
  const theme = useTheme() as any;
  const motmPercentages = useSelector(selectMotmPercentages(fixtureId));

  console.log("FanMOTMHighlight", motmPercentages);
  const winner = motmPercentages?.[0];

  if (!winner) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        ...theme.clay?.card,
        position: "relative",
        p: 4,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        overflow: "hidden",
        width: "100%",
        borderRadius: "28px",
        // Soft radial glow behind the winner
        background: `radial-gradient(circle at 50% 30%, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${theme.palette.background.paper} 70%)`,
      }}
    >
      {/* --- VOTE COUNT BADGE --- */}
      <Box
        sx={{
          ...theme.clay?.box,
          position: "absolute",
          top: 20,
          right: 20,
          px: 2,
          py: 0.5,
          display: "flex",
          alignItems: "center",
          gap: 1,
          borderRadius: "12px",
          bgcolor: theme.palette.background.default,
        }}
      >
        <Users size={14} color={theme.palette.text.secondary} />
        <Typography
          variant="caption"
          sx={{ fontWeight: 900, color: "text.secondary", fontSize: "0.7rem" }}
        >
          {winner.percentage}% OF VOTES
        </Typography>
      </Box>

      {/* --- AVATAR & TROPHY --- */}
      <Box sx={{ position: "relative", mb: 2 }}>
        <Avatar
          src={winner.img}
          alt={winner.name}
          sx={{
            width: 120,
            height: 120,
            border: `6px solid ${theme.palette.background.paper}`,
            boxShadow: theme.clay?.card?.boxShadow || theme.shadows[10],
            backgroundColor: "grey.800",
          }}
        />

        {/* Floating Gold Medal */}
        <Box
          sx={{
            position: "absolute",
            bottom: -5,
            right: -5,
            backgroundColor: "#FFD700",
            width: 42,
            height: 42,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `4px solid ${theme.palette.background.paper}`,
            boxShadow: "0 6px 12px rgba(0,0,0,0.2)",
            animation: "pulse 2s infinite ease-in-out",
            "@keyframes pulse": {
              "0%": { transform: "scale(1)" },
              "50%": { transform: "scale(1.1)" },
              "100%": { transform: "scale(1)" },
            },
          }}
        >
          <Trophy size={20} color="#B7791F" strokeWidth={3} />
        </Box>
      </Box>

      {/* --- HERO TEXT --- */}
      <Box sx={{ textAlign: "center", zIndex: 2 }}>
        <Typography
          variant="overline"
          sx={{
            color: "primary.main",
            letterSpacing: 3,
            fontWeight: 900,
            display: "block",
            mb: 0.5,
          }}
        >
          MAN OF THE MATCH
        </Typography>

        <Typography
          variant="h4"
          sx={{
            fontWeight: 900,
            color: "text.primary",
            lineHeight: 1.1,
            textTransform: "uppercase",
            letterSpacing: -1,
          }}
        >
          {winner.name}
        </Typography>

        <Typography
          variant="body2"
          sx={{ mt: 1, opacity: 0.6, fontWeight: 700 }}
        >
          THE FANS HAVE SPOKEN
        </Typography>
      </Box>
    </Paper>
  );
}
