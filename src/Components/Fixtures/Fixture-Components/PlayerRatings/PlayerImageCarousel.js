import React, { useRef, useEffect } from "react";
import { Box, IconButton, useTheme } from "@mui/material";
import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
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
  const theme = useTheme();

  // --- Auto-Scroll to Active Player ---
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

  // --- Manual Scroll Logic ---
  const scroll = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    const amt = isMobile ? 200 : 300;
    el.scrollBy({ left: dir * amt, behavior: "smooth" });
  };

  return (
    <Box
      sx={{
        // 1. GRID-LIKE STRUCTURE
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 1, // Space between buttons and list
        // 2. CONSTRAINT
        width: "100%",
        maxWidth: "100%", // Hard stop on growth
        mt: 0,
        mb: 0,
        px: 0, // Outer safety padding
      }}
    >
      {/* --- LEFT BUTTON (Static Position) --- */}
      <IconButton
        onClick={() => scroll(-1)}
        sx={{
          ...theme.clay.button,
          width: 44,
          height: 44,
          flexShrink: 0, // Never shrink the button
          zIndex: 2,
        }}
      >
        <ChevronLeftRounded />
      </IconButton>

      {/* --- SCROLL TRACK CONTAINER --- */}
      <Box
        ref={trackRef}
        sx={{
          // 3. THE "DONT GROW" FIX
          flex: 1, // Take remaining space
          minWidth: 0, // CRITICAL: Allows flex child to shrink below content size

          display: "flex",
          gap: 2,

          // SCROLL PHYSICS
          overflowX: "auto",
          scrollBehavior: "smooth",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
          scrollSnapType: "x mandatory",

          // SHADOW ROOM
          py: 2, // Vertical padding so bottom shadows don't get cut off
          px: 1, // Tiny padding inside track
        }}
      >
        {combinedPlayers.map((p, i) => (
          <Box
            key={p.id}
            sx={{
              scrollSnapAlign: "center",
              flexShrink: 0, // Prevent thumbnails from squishing
            }}
          >
            <PlayerThumbnail
              player={p}
              index={i}
              currentIndex={currentIndex}
              onSelect={onSelect}
              usersMatchPlayerRatings={usersMatchPlayerRatings}
              storedUsersMatchMOTM={storedUsersMatchMOTM}
              fixture={fixture}
            />
          </Box>
        ))}
      </Box>

      {/* --- RIGHT BUTTON (Static Position) --- */}
      <IconButton
        onClick={() => scroll(1)}
        sx={{
          ...theme.clay.button,
          width: 44,
          height: 44,
          flexShrink: 0,
          zIndex: 2,
        }}
      >
        <ChevronRightRounded />
      </IconButton>
    </Box>
  );
}
