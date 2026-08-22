"use client";

import React from "react";
import { useSelector } from "react-redux";
import { Box, Typography, Paper, Avatar, alpha, useTheme } from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";
import { Trophy, Users } from "lucide-react";

import { selectMotmPercentages } from "@/lib/redux/selectors/ratingsSelectors";
import { RootState } from "@/lib/redux/store";

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

const HeroCard = styled(Paper)(({ theme }) => ({
  position: "relative",
  padding: theme.spacing(5, 3, 4),
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  overflow: "hidden",
  background: `radial-gradient(circle at 50% 0%, ${alpha(
    theme.palette.primary.main,
    0.18,
  )} 0%, ${theme.palette.background.paper} 65%)`,
}));

const votePillSx = {
  position: "absolute" as const,
  top: 18,
  right: 18,
  px: 1.5,
  py: 0.5,
  display: "inline-flex",
  alignItems: "center",
  gap: 0.75,
};

const Medal = styled(Box)(({ theme }) => ({
  position: "absolute",
  bottom: -6,
  right: -6,
  width: 44,
  height: 44,
  borderRadius: "50%",
  display: "grid",
  placeItems: "center",
  background: `linear-gradient(145deg, ${theme.palette.motm.goldStart} 0%, ${theme.palette.motm.goldEnd} 100%)`,
  animation: `${floatPulse} 2.4s infinite ease-in-out`,
}));

const HeroAvatar = styled(Avatar)(({ theme }) => ({
  width: 128,
  height: 128,
  // grey[800] was a fixed dark disc behind the winner in light mode. This sits
  // on HeroCard (a Paper), so background.default is the contrasting surface —
  // same reasoning as PitchPlayer's `.pitch-avatar`.
  backgroundColor: theme.palette.background.default,
  // selectMotmPercentages falls back to img: "", so the initial-letter fallback
  // renders fairly often and needs a colour that isn't the background.
  color: theme.palette.text.secondary,
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
  const motmPercentages = useSelector((state: RootState) =>
    selectMotmPercentages(state, fixtureId),
  );
  const winner = motmPercentages?.[0];

  if (!winner) return null;

  return (
    <HeroCard>
      <Paper variant="pill" sx={votePillSx}>
        <Users size={13} color={theme.palette.text.secondary} />
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {winner.percentage}% OF VOTES
        </Typography>
      </Paper>

      <Box sx={{ position: "relative", mb: 2 }}>
        <HeroAvatar src={winner.img} alt={winner.name} />
        <Medal>
          <Trophy
            size={20}
            color={theme.palette.motm.bronze}
            strokeWidth={2.5}
          />
        </Medal>
      </Box>

      <Typography
        variant="overline"
        sx={{
          color: "primary.main",
          letterSpacing: 3,
          mb: 0.5,
        }}
      >
        Man of the Match
      </Typography>

      <Typography
        variant="h4"
        sx={{
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
        sx={{ mt: 1.5, opacity: 0.55, letterSpacing: 1 }}
      >
        The fans have spoken
      </Typography>
    </HeroCard>
  );
}
