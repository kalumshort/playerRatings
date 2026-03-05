"use client";
import { getInitialSurname } from "@/lib/utils/football-logic";
import { Box, Stack, Avatar, Typography, alpha, useTheme } from "@mui/material";
import { motion } from "framer-motion";

export default function PodiumStep({ rank, player }: any) {
  const theme = useTheme() as any;
  const isFirst = rank === 1;

  // Color logic based on your PALETTE
  const rankColor = isFirst
    ? theme.palette.primary.main
    : rank === 2
      ? "#C0C0C0"
      : "#CD7F32";

  if (!player) return <Box sx={{ width: isFirst ? 110 : 90 }} />;

  return (
    <Stack
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1, type: "spring", stiffness: 100 }}
      alignItems="center"
      sx={{
        position: "relative",
        width: isFirst ? 120 : 100,
        zIndex: isFirst ? 2 : 1,
      }}
    >
      {/* FLOATY AVATAR CONTAINER */}
      <Box sx={{ position: "relative", mb: -2, zIndex: 3 }}>
        <Avatar
          src={player.playerImg}
          sx={{
            width: isFirst ? 85 : 65,
            height: isFirst ? 85 : 65,
            border: `4px solid ${theme.palette.background.paper}`,
            boxShadow: isFirst
              ? `0 10px 25px ${alpha(rankColor, 0.4)}`
              : `0 8px 15px ${alpha(theme.palette.common.black, 0.1)}`,
          }}
        />
        {/* RANK BADGE */}
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: 28,
            height: 28,
            bgcolor: rankColor,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `3px solid ${theme.palette.background.paper}`,
            boxShadow: theme.shadows[2],
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: "#fff", fontWeight: 900, fontSize: "0.7rem" }}
          >
            {rank}
          </Typography>
        </Box>
      </Box>

      {/* THE PILLAR */}
      <Box
        sx={{
          width: "100%",
          pt: 4,
          pb: 2,

          ...theme.clay?.card,
          bgcolor: isFirst ? alpha(rankColor, 0.1) : "background.paper",
          height: isFirst ? 140 : 100,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          border: isFirst
            ? `2px solid ${alpha(rankColor, 1)}`
            : "1px solid transparent",
          // Give it that "squishy" clay look
        }}
      >
        <Typography
          variant="h4"
          fontWeight={900}
          noWrap
          sx={{
            width: "90%",
            textAlign: "center",
            fontSize: "0.65rem",
            letterSpacing: 0.5,
          }}
        >
          {getInitialSurname(player.playerName)}
        </Typography>

        <Box
          sx={{ display: "flex", alignItems: "baseline", gap: 0.2, mt: 0.5 }}
        >
          <Typography
            variant={isFirst ? "h5" : "h6"}
            fontWeight={950}
            sx={{ color: isFirst ? rankColor : "text.primary", lineHeight: 1 }}
          >
            {player.rating.toFixed(1)}
          </Typography>
        </Box>
      </Box>
    </Stack>
  );
}
