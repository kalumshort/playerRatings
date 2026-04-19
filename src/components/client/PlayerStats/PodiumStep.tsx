"use client";

import { getInitialSurname } from "@/lib/utils/football-logic";
import { Box, Stack, Avatar, Typography, useTheme } from "@mui/material";

interface PodiumStepProps {
  rank: 1 | 2 | 3;
  player?: {
    playerId: string;
    playerName: string;
    playerImg: string;
    rating: number;
  };
}

export default function PodiumStep({ rank, player }: PodiumStepProps) {
  const theme = useTheme();
  const isFirst = rank === 1;
  const width = isFirst ? 104 : 88;

  if (!player) return <Box sx={{ width }} />;

  const accent = isFirst ? theme.palette.primary.main : theme.palette.text.secondary;

  return (
    <Stack alignItems="center" spacing={0.75} sx={{ width }}>
      <Box sx={{ position: "relative" }}>
        <Avatar
          src={player.playerImg}
          alt={player.playerName}
          sx={{
            width: isFirst ? 64 : 52,
            height: isFirst ? 64 : 52,
            border: isFirst ? `2px solid ${accent}` : "none",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: -4,
            right: -4,
            minWidth: 20,
            height: 20,
            px: 0.5,
            bgcolor: "background.paper",
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: accent, fontWeight: 700, fontSize: "0.7rem" }}
          >
            {rank}
          </Typography>
        </Box>
      </Box>

      <Typography
        variant="caption"
        noWrap
        sx={{
          maxWidth: "100%",
          fontWeight: 600,
          textAlign: "center",
        }}
      >
        {getInitialSurname(player.playerName)}
      </Typography>

      <Typography
        variant={isFirst ? "h6" : "subtitle2"}
        sx={{ color: accent, fontWeight: 700, lineHeight: 1 }}
      >
        {player.rating.toFixed(1)}
      </Typography>
    </Stack>
  );
}
