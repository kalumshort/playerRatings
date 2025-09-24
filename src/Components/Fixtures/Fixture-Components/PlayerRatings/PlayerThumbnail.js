import React from "react";
import { useSelector } from "react-redux";

import { Box, Avatar } from "@mui/material";

import { selectSquadPlayerById } from "../../../../Selectors/squadDataSelectors";

const ACCENT = "#4EFF4E";

export default function PlayerThumbnail({
  player,
  index,
  currentIndex,
  onSelect,
  usersMatchPlayerRatings,
  storedUsersMatchMOTM,
}) {
  // ✅ grab squad info (photo, etc.) from redux
  const playerData = useSelector(selectSquadPlayerById(player.id));

  const rated = Boolean(usersMatchPlayerRatings?.[player.id]);
  const isActive = index === currentIndex;
  const photo = playerData?.photo || player.photo;
  const initials = (player.name || "?")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Box
      onClick={() => onSelect(index)}
      sx={{
        position: "relative",
        cursor: "pointer",
        flex: "0 0 auto",
        width: 45,
        textAlign: "center",
      }}
    >
      <Avatar
        src={photo}
        alt={player.name}
        sx={{
          width: 35,
          height: 35,
          mx: "auto",
          fontWeight: 800,
          bgcolor: "#212121",
          border: `2px solid ${isActive ? ACCENT : "#2a2a2a"}`,
          transition: "transform 160ms ease, border-color 160ms ease",
          transform: isActive ? "scale(1.06)" : "scale(1)",
          filter: rated ? "grayscale(0.2) saturate(1.15)" : "none",
        }}
      >
        {photo ? null : initials}
      </Avatar>

      {/* {rated && (
          <CheckCircleIcon
            sx={{
              position: "absolute",
              right: -2,
              bottom: -2,
              fontSize: 18,
              color: ACCENT,
              bgcolor: "#111",
              borderRadius: "50%",
            }}
          />
        )} */}
      <div style={{ display: "flex", flexDirection: "row", gap: 0 }}>
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            mx: "auto",
            mt: 0.5,
            bgcolor: isActive ? ACCENT : rated ? ACCENT : "#444",
            opacity: isActive ? 1 : rated ? 0.8 : 0.5,
          }}
        />
        {storedUsersMatchMOTM === String(player.id) && (
          <Box
            sx={(theme) => ({
              width: 6,
              height: 6,
              borderRadius: "50%",
              mx: "auto",
              mt: 0.5,
              bgcolor:
                storedUsersMatchMOTM === String(player.id)
                  ? theme.palette.primary.main // ✅ theme primary colour
                  : "#444",
              opacity: storedUsersMatchMOTM === String(player.id) ? 1 : 0.5,
            })}
          />
        )}
      </div>
    </Box>
  );
}
