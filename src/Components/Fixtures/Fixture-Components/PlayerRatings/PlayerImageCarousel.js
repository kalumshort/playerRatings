import React, { useRef, useEffect } from "react";
import { Box, IconButton } from "@mui/material";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import PlayerThumbnail from "./PlayerThumbnail";

export default function PlayerImageCarousel({
  combinedPlayers = [],
  currentIndex = 0,
  onSelect = () => {},
  usersMatchPlayerRatings = {},
  isMobile = false,
  storedUsersMatchMOTM,
  fixture,
}) {
  const trackRef = useRef(null);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const child = el.children[currentIndex];
    if (!child) return;
    const box = child.getBoundingClientRect();
    const parent = el.getBoundingClientRect();
    const delta = box.left - (parent.left + parent.width / 2 - box.width / 2);
    el.scrollBy({ left: delta, behavior: "smooth" });
  }, [currentIndex]);

  const scroll = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    const amt = isMobile ? 240 : 360;
    el.scrollBy({ left: dir * amt, behavior: "smooth" });
  };

  return (
    <Box
      sx={{ position: "relative", px: 5, mb: 1 }}
      style={{ margin: "15px 0px 30px 0px" }}
    >
      <IconButton
        size="small"
        onClick={() => scroll(-1)}
        sx={{
          position: "absolute",
          left: 0,
          top: "50%",
          transform: "translateY(-50%)",
          bgcolor: "rgba(0,0,0,0.35)",
          "&:hover": { bgcolor: "rgba(0,0,0,0.55)" },
          zIndex: 1,
        }}
      >
        <ChevronLeft />
      </IconButton>
      <IconButton
        size="small"
        onClick={() => scroll(1)}
        sx={{
          position: "absolute",
          right: 0,
          top: "50%",
          transform: "translateY(-50%)",
          bgcolor: "rgba(0,0,0,0.35)",
          "&:hover": { bgcolor: "rgba(0,0,0,0.55)" },
          zIndex: 1,
        }}
      >
        <ChevronRight />
      </IconButton>

      <Box
        ref={trackRef}
        sx={{
          display: "flex",
          gap: 1.25,
          overflowX: "auto",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
          px: 1,
        }}
      >
        {combinedPlayers.map((p, i) => (
          <PlayerThumbnail
            key={p.id}
            player={p}
            index={i}
            currentIndex={currentIndex}
            onSelect={onSelect}
            usersMatchPlayerRatings={usersMatchPlayerRatings}
            storedUsersMatchMOTM={storedUsersMatchMOTM}
            fixture={fixture}
          />
        ))}
      </Box>
    </Box>
  );
}
