import React, { useMemo } from "react";
import { useSelector, shallowEqual } from "react-redux"; // 1. Import shallowEqual

import { Box, Avatar, Tooltip } from "@mui/material";

import { selectSquadPlayerById } from "../../../../Selectors/squadDataSelectors";
import { useParams } from "react-router-dom";

const ACCENT = "#4EFF4E";

function PlayerThumbnail({
  player,
  index,
  currentIndex,
  onSelect,
  usersMatchPlayerRatings,
  storedUsersMatchMOTM,
}) {
  const { clubSlug } = useParams();

  const selectPlayer = useMemo(
    () => selectSquadPlayerById(player.id, clubSlug),
    [player.id, clubSlug] // Re-memoize if player ID or club changes
  );

  const playerData = useSelector(selectPlayer, shallowEqual);

  const rated = Boolean(usersMatchPlayerRatings?.[player.id]);
  const isMOTM = storedUsersMatchMOTM === String(player.id);
  const isActive = index === currentIndex;

  const photo = playerData?.photo || player.photo;
  const name = playerData?.name || player.name || "Unknown";
  const initials = (name || "?")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleSelect = () => onSelect?.(index);
  const handleKey = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleSelect();
    }
  };

  return (
    <Tooltip title={name} arrow>
      <Box
        onClick={handleSelect}
        onKeyDown={handleKey}
        role="button"
        tabIndex={0}
        sx={{
          position: "relative",
          cursor: "pointer",
          flex: "0 0 auto",
          width: 48,
          textAlign: "center",
          outline: "none",
        }}
      >
        <Avatar
          src={photo}
          alt={name}
          sx={{
            width: 38,
            height: 38,
            mx: "auto",
            fontWeight: 800,

            border: `2px solid ${isActive && ACCENT}`,
            transition:
              "transform 160ms ease, border-color 160ms ease, filter 160ms ease",
            transform: isActive ? "scale(1.06)" : "scale(1)",
            // “Green out” rated players a bit + keep visibility
            filter: rated
              ? "grayscale(0.15) saturate(1.1) brightness(1.02)"
              : "none",
            // Optional: stronger green cue when rated
            boxShadow:
              rated && !isActive ? `inset 0 0 0 1px ${ACCENT}40` : "none",
          }}
        >
          {photo ? null : initials}
        </Avatar>

        {/* status dots row */}
        <Box
          sx={{
            display: "flex",
            gap: 0.5,
            justifyContent: "center",
            alignItems: "center",
            mt: 0.5,
          }}
        >
          {/* Rated dot (accent green) */}
          {rated && (
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: ACCENT,
                opacity: isActive ? 1 : 0.85,
              }}
            />
          )}

          {/* MOTM dot (theme primary) */}
          {isMOTM && (
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: "primary.main", // theme primary colour
                opacity: 1,
              }}
            />
          )}
        </Box>
      </Box>
    </Tooltip>
  );
}

export default React.memo(PlayerThumbnail);
