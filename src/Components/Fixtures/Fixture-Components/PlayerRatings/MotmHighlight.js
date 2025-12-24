import React from "react";
import {
  Box,
  Typography,
  Paper,
  styled,
  useTheme as useMuiTheme,
  Avatar,
} from "@mui/material";
import { Trophy, Users } from "lucide-react";
import { useTheme } from "../../../Theme/ThemeContext";

// --- Styled Components ---
const GlassMOTMCard = styled(Paper)(({ theme }) => ({
  position: "relative",
  padding: theme.spacing(3),
  border: "none!important",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  overflow: "hidden",
}));

const PlayerImageContainer = styled(Box)(({ accent }) => ({
  position: "relative",
  zIndex: 2,
  marginBottom: "-20px", // Pulls text up toward the image
}));

const PercentageBadge = styled(Box)(({ theme, accent }) => ({
  position: "absolute",
  top: 16,
  right: 16,
  backgroundColor: `${accent}20`,
  border: `1px solid ${accent}`,
  color: accent,
  padding: "4px 12px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  gap: "6px",
}));

export default function FanMOTMHighlight({ motmPercentages }) {
  const muiTheme = useMuiTheme();
  const { themeBackgroundImage } = useTheme(); //

  const winner = motmPercentages?.[0];
  const accentColor = muiTheme.palette.primary.main;

  if (!winner) return null;

  return (
    <GlassMOTMCard elevation={0}>
      {/* 1. The Fan Consensus Badge */}
      <PercentageBadge accent={accentColor}>
        <Users size={14} />
        <Typography variant="caption" sx={{ fontWeight: 800 }}>
          {winner.percentage}% VOTE
        </Typography>
      </PercentageBadge>

      {/* 2. Player Visual Section */}
      <PlayerImageContainer accent={accentColor}>
        <Avatar
          src={winner.img}
          alt={winner.name}
          sx={{
            width: 100,
            height: 100,
            border: `4px solid ${accentColor}`,
            boxShadow: `0 0 20px ${accentColor}30`,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: -5,
            right: -5,
            backgroundColor: "gold",
            borderRadius: "50%",
            p: 0.5,
            display: "flex",
            boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
          }}
        >
          <Trophy size={20} color="#000" />
        </Box>
      </PlayerImageContainer>

      {/* 3. Text Section */}
      <Box sx={{ mt: 3, textAlign: "center", zIndex: 2 }}>
        <Typography
          variant="h6"
          sx={{
            color: "text.secondary",
            letterSpacing: 2,
            fontSize: "0.75rem",
            fontWeight: 900,
            mb: 0.5,
          }}
        >
          FAN CONSENSUS MOTM
        </Typography>

        <Typography
          variant="h6"
          sx={{
            textTransform: "uppercase",
            lineHeight: 1,
          }}
        >
          {winner.name}
        </Typography>
      </Box>

      {/* 4. Subtle Background Texture */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage: `url(${themeBackgroundImage})`, //
          opacity: 0.05,
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
    </GlassMOTMCard>
  );
}
