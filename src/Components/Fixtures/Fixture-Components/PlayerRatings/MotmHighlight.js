import React from "react";
import { Box, Typography, Paper, Avatar } from "@mui/material";
import { Trophy, Users } from "lucide-react";

export default function FanMOTMHighlight({ motmPercentages }) {
  const winner = motmPercentages?.[0];

  if (!winner) return null;

  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        // 1. Apply the Global Clay Card style
        ...theme.clay.card,
        position: "relative",
        p: 3,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        overflow: "hidden",
        width: "100%",
        mx: "auto",
        borderRadius: "16px",
        boxShadow: "none",
        border: "none",
      })}
    >
      {/* --- BADGE: PRESSED LOOK --- */}
      <Box
        sx={(theme) => ({
          // Apply the "Pressed Groove" style
          ...theme.clay.box,

          position: "absolute",
          top: 16,
          right: 16,
          padding: "6px 14px",
          display: "flex",
          alignItems: "center",
          gap: 1,
          borderRadius: "16px",
          // Ensure background blends perfectly for the inset effect
          backgroundColor: theme.palette.background.default,
        })}
      >
        <Users size={14} color="#888" />
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
          sx={(theme) => ({
            width: 110,
            height: 110,
            // Use the bg color to create a "cutout" border
            border: `6px solid ${theme.palette.background.default}`,
            // Inherit the floating shadow from the theme
            boxShadow: theme.clay.card.boxShadow,
          })}
        />

        {/* Gold Trophy (Custom float) */}
        <Box
          sx={(theme) => ({
            position: "absolute",
            bottom: 0,
            right: 0,
            backgroundColor: "#FFD700",
            width: 36,
            height: 36,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `4px solid ${theme.palette.background.default}`,
            boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
          })}
        >
          <Trophy size={16} color="#B7791F" strokeWidth={2.5} />
        </Box>
      </Box>

      {/* --- TEXT --- */}
      <Box sx={{ mt: 1, textAlign: "center", zIndex: 2 }}>
        <Typography
          variant="overline"
          sx={{
            color: "text.secondary",
            letterSpacing: 2,
            fontWeight: 800,
            lineHeight: 2,
            display: "block",
          }}
        >
          FAN CONSENSUS
        </Typography>

        <Typography
          variant="h5"
          sx={{
            fontWeight: 900,
            color: "text.primary",
            lineHeight: 1,
          }}
        >
          {winner.name}
        </Typography>
      </Box>
    </Paper>
  );
}
