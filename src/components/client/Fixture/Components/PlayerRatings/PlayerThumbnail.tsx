"use client";

import React, { useMemo } from "react";
import { useSelector, shallowEqual } from "react-redux";
import { Box, Avatar, Tooltip, styled, Stack } from "@mui/material";

import { RootState } from "@/lib/redux/store";

const StatusDot = styled(Box, {
  shouldForwardProp: (prop) => prop !== "active" && prop !== "type",
})<{ active?: boolean; type: "rated" | "motm" }>(({ theme, active, type }) => {
  const accent =
    type === "rated" ? theme.palette.success.main : theme.palette.primary.main;
  return {
    width: 6,
    height: 6,
    borderRadius: "50%",
    transition: "all 0.2s ease",
    backgroundColor: accent,
    opacity: active ? 1 : 0.6,
  };
});

interface ThumbnailProps {
  player: any;
  index: number;
  currentIndex: number;
  onSelect: (index: number) => void;
  usersMatchPlayerRatings: any;
  storedUsersMatchMOTM: string | null;
}

function PlayerThumbnail({
  player,
  index,
  currentIndex,
  onSelect,
  usersMatchPlayerRatings,
  storedUsersMatchMOTM,
}: ThumbnailProps) {
  // 1. STABILIZED SELECTOR
  // We use the RootState type to ensure the selector is performant
  const playerData = useSelector(
    (state: RootState) =>
      state.teamSquads.byClubId["33" as string]?.[player.id],
    shallowEqual,
  );

  const isRated = Boolean(usersMatchPlayerRatings?.[player.id]);
  const isMOTM = storedUsersMatchMOTM === String(player.id);
  const isActive = index === currentIndex;

  const photo =
    player?.photo ||
    playerData?.photo ||
    `https://media.api-sports.io/football/players/${player.id}.png`;
  const name = playerData?.name || player.name || "Unknown";

  // 2. INITIALS FALLBACK
  const initials = useMemo(() => {
    return name
      .split(" ")
      .map((s: string) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [name]);

  return (
    <Tooltip title={name} arrow disableInteractive>
      <Box
        onClick={() => onSelect(index)}
        sx={{
          position: "relative",
          cursor: "pointer",
          width: 50,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          outline: "none",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <Avatar
          src={photo}
          alt={name}
          sx={{
            width: 40,
            height: 40,
            fontSize: "0.8rem",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: isActive ? "scale(1.15)" : "scale(1)",
            filter: isRated ? "grayscale(0.2) brightness(1.1)" : "none",
            bgcolor: "grey.800",
          }}
        >
          {initials}
        </Avatar>

        {/* INDICATOR ROW */}
        <Stack
          direction="row"
          spacing={0.5}
          justifyContent="center"
          sx={{ mt: 0.75, height: 6 }}
        >
          {isRated && <StatusDot type="rated" active={isActive} />}
          {isMOTM && <StatusDot type="motm" active={isActive} />}
        </Stack>
      </Box>
    </Tooltip>
  );
}

export default React.memo(PlayerThumbnail);
