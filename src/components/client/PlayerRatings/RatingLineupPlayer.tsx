"use client";

import React from "react";
import { useSelector } from "react-redux";
import {
  Box,
  Typography,
  Avatar,
  styled,
  useTheme,
  alpha,
} from "@mui/material";
import { selectSeasonSquadDataObject } from "@/lib/redux/selectors/squadSelectors";

// --- SELECTORS ---

// --- TYPES ---
interface PlayerProps {
  player: {
    id: number | string;
    name: string;
    photo?: string;
  };
  playerRating: string | number;
}

// --- STYLED COMPONENTS ---

const ScoreBadge = styled(Box)(({ theme }) => ({
  position: "absolute",
  bottom: 0,
  right: -4,
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  padding: "2px 6px",
  borderRadius: "8px",
  border: `2px solid ${theme.palette.background.paper}`,
  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
  zIndex: 10,
  minWidth: "24px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
}));

const PlayerWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  width: 72,
  minHeight: 100,
  position: "relative",
  transition: "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
  "&:hover": {
    transform: "translateY(-4px)",
    zIndex: 2,
  },
}));

// --- COMPONENT ---

/**
 * RatingLineupPlayer - Displays a single player avatar with their rating badge.
 * Uses the global squad dictionary to ensure high-quality images and correct names.
 */
const RatingLineupPlayer = React.memo(
  ({ player, playerRating }: PlayerProps) => {
    const theme = useTheme();

    // 1. Instant lookup via our Dictionary Selector
    // (Avoids passing heavy player objects through multiple levels of props)
    const squadDict = useSelector(selectSeasonSquadDataObject);
    const playerData = squadDict[player?.id];

    if (!player) return null;

    const displayRating =
      playerRating && playerRating !== "na"
        ? Number(playerRating).toFixed(1)
        : "—";

    return (
      <PlayerWrapper>
        {/* Avatar Container */}
        <Box sx={{ position: "relative", width: 56, height: 56 }}>
          <Avatar
            src={
              playerData?.photo ||
              player?.photo ||
              `https://media.api-sports.io/football/players/${player.id}.png`
            }
            alt={playerData?.name || player.name}
            sx={{
              width: "100%",
              height: "100%",
              border: `3px solid ${theme.palette.background.paper}`,
              boxShadow: theme.shadows[3],
              bgcolor: "background.default",
              "& img": {
                objectFit: "cover",
              },
            }}
          />

          {/* Rating Badge */}
          <ScoreBadge>
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: "0.7rem",
                lineHeight: 1,
              }}
            >
              {displayRating}
            </Typography>
          </ScoreBadge>
        </Box>

        {/* Player Name */}
        <Typography
          variant="caption"
          noWrap
          sx={{
            mt: 1,
            fontSize: "0.65rem",
            fontWeight: 800,
            textAlign: "center",
            maxWidth: "100%",
            color: "text.primary",
            px: 0.5,
            textTransform: "uppercase",
            letterSpacing: 0.5,
            // Subtle text shadow for readability on pitch backgrounds
            textShadow:
              theme.palette.mode === "dark"
                ? "none"
                : `0 1px 1px ${alpha(theme.palette.common.white, 0.8)}`,
          }}
        >
          {playerData?.name || player.name}
        </Typography>
      </PlayerWrapper>
    );
  },
);

RatingLineupPlayer.displayName = "RatingLineupPlayer";

export default RatingLineupPlayer;
