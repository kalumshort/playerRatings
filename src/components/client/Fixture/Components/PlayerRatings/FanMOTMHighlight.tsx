"use client";

import React from "react";
import { useSelector } from "react-redux";
import { Box, Typography, Paper, Avatar, alpha, useTheme } from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";
import { Trophy, Users } from "lucide-react";

import { selectMotmPercentages } from "@/lib/redux/selectors/ratingsSelectors";

interface FanMOTMHighlightProps {
  fixtureId: string;
}

const shimmer = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

const floatPulse = keyframes`
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-3px) scale(1.05); }
`;

const HeroCard = styled(Paper)(({ theme }: any) => ({
  ...theme.clay?.card,
  position: "relative",
  padding: theme.spacing(5, 3, 4),
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  overflow: "hidden",
  borderRadius: 28,
  background: `radial-gradient(circle at 50% 0%, ${alpha(
    theme.palette.primary.main,
    0.18,
  )} 0%, ${theme.palette.background.paper} 65%)`,
}));

const VotePill = styled(Box)(({ theme }: any) => ({
  ...theme.clay?.box,
  position: "absolute",
  top: 18,
  right: 18,
  padding: theme.spacing(0.5, 1.5),
  display: "inline-flex",
  alignItems: "center",
  gap: theme.spacing(0.75),
  borderRadius: 999,
  backgroundColor: theme.palette.background.default,
}));

const Medal = styled(Box)(({ theme }) => ({
  position: "absolute",
  bottom: -6,
  right: -6,
  width: 44,
  height: 44,
  borderRadius: "50%",
  display: "grid",
  placeItems: "center",
  background: "linear-gradient(145deg, #FFE27A 0%, #F5B300 100%)",
  border: `4px solid ${theme.palette.background.paper}`,
  boxShadow: "0 6px 14px rgba(0,0,0,0.25)",
  animation: `${floatPulse} 2.4s infinite ease-in-out`,
}));

const HeroAvatar = styled(Avatar)(({ theme }: any) => ({
  width: 128,
  height: 128,
  border: `6px solid ${theme.palette.background.paper}`,
  boxShadow: theme.clay?.card?.boxShadow || theme.shadows[10],
  backgroundColor: theme.palette.grey[800],
}));

const ProgressTrack = styled(Box)(({ theme }) => ({
  width: "100%",
  maxWidth: 220,
  height: 6,
  marginTop: theme.spacing(2),
  borderRadius: 999,
  backgroundColor: alpha(theme.palette.primary.main, 0.12),
  overflow: "hidden",
  position: "relative",
}));

const ProgressFill = styled(Box)<{ width: number }>(({ theme, width }) => ({
  height: "100%",
  width: `${width}%`,
  borderRadius: 999,
  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${alpha(
    theme.palette.primary.light,
    0.9,
  )})`,
  position: "relative",
  "&::after": {
    content: '""',
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)",
    animation: `${shimmer} 2.2s infinite`,
  },
}));

export default function FanMOTMHighlight({ fixtureId }: FanMOTMHighlightProps) {
  const theme = useTheme() as any;
  const motmPercentages = useSelector(selectMotmPercentages(fixtureId));
  const winner = motmPercentages?.[0];

  if (!winner) return null;

  return (
    <HeroCard elevation={0}>
      <VotePill>
        <Users size={13} color={theme.palette.text.secondary} />
        <Typography
          variant="caption"
          sx={{ fontWeight: 900, color: "text.secondary", fontSize: "0.7rem" }}
        >
          {winner.percentage}% OF VOTES
        </Typography>
      </VotePill>

      <Box sx={{ position: "relative", mb: 2 }}>
        <HeroAvatar src={winner.img} alt={winner.name} />
        <Medal>
          <Trophy size={20} color="#7A4F00" strokeWidth={2.5} />
        </Medal>
      </Box>

      <Typography
        variant="overline"
        sx={{
          color: "primary.main",
          letterSpacing: 3,
          fontWeight: 900,
          mb: 0.5,
        }}
      >
        Man of the Match
      </Typography>

      <Typography
        variant="h4"
        sx={{
          fontWeight: 900,
          color: "text.primary",
          lineHeight: 1.1,
          textTransform: "uppercase",
          letterSpacing: -0.5,
          textAlign: "center",
        }}
      >
        {winner.name}
      </Typography>

      <ProgressTrack>
        <ProgressFill width={Math.min(100, Number(winner.percentage) || 0)} />
      </ProgressTrack>

      <Typography
        variant="body2"
        sx={{ mt: 1.5, opacity: 0.55, fontWeight: 700, letterSpacing: 1 }}
      >
        The fans have spoken
      </Typography>
    </HeroCard>
  );
}
