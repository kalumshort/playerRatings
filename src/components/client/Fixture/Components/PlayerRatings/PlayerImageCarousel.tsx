"use client";

import React, { useRef, useEffect } from "react";
import { Box, IconButton, useTheme, alpha } from "@mui/material";
import { ChevronLeftRounded, ChevronRightRounded } from "@mui/icons-material";
import PlayerThumbnail from "./PlayerThumbnail";

interface CarouselProps {
  combinedPlayers: any[];
  currentIndex: number;
  onSelect: (index: number) => void;
  usersMatchPlayerRatings?: any;
  isMobile?: boolean;
  storedUsersMatchMOTM?: string | null;
  fixture: any;
}

export default function PlayerImageCarousel({
  combinedPlayers = [],
  currentIndex = 0,
  onSelect,
  usersMatchPlayerRatings = {},
  isMobile = false,
  storedUsersMatchMOTM,
  fixture,
}: CarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const theme = useTheme() as any;

  // --- 1. AUTO-SCROLL LOGIC ---
  // Keeps the active player thumbnail centered in the track
  useEffect(() => {
    const el = trackRef.current;
    if (!el || !el.children[currentIndex]) return;

    const child = el.children[currentIndex] as HTMLElement;
    const parentRect = el.getBoundingClientRect();
    const childRect = child.getBoundingClientRect();

    // Calculate the distance to center the child within the parent
    const scrollLeft =
      child.offsetLeft - el.offsetWidth / 2 + child.offsetWidth / 2;

    el.scrollTo({
      left: scrollLeft,
      behavior: "smooth",
    });
  }, [currentIndex]);

  // --- 2. MANUAL NAV LOGIC ---
  const handleManualScroll = (direction: number) => {
    const el = trackRef.current;
    if (!el) return;
    const scrollAmount = isMobile ? 180 : 300;
    el.scrollBy({ left: direction * scrollAmount, behavior: "smooth" });
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        maxWidth: "100vw",
        gap: 0.5,
        position: "relative",
        // Avoid clipping the clay shadows of the thumbnails
        py: 1,
      }}
    >
      {/* LEFT NAV */}
      {!isMobile && (
        <IconButton
          onClick={() => handleManualScroll(-1)}
          sx={{
            ...theme.clay?.button,
            width: 40,
            height: 40,
            flexShrink: 0,
            zIndex: 2,
            bgcolor: alpha(theme.palette.background.paper, 0.8),
          }}
        >
          <ChevronLeftRounded />
        </IconButton>
      )}

      {/* THE SCROLL TRACK */}
      <Box
        ref={trackRef}
        sx={{
          flex: 1,
          minWidth: 0, // CRITICAL: Allows flex container to shrink
          display: "flex",
          gap: 1.5,
          overflowX: "auto",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          "&::-webkit-scrollbar": { display: "none" },
          scrollSnapType: "x mandatory",
          py: 1.5, // Space for active scaling/glows
          px: { xs: 2, md: 4 }, // Padding so first/last items center correctly
        }}
      >
        {combinedPlayers.map((p, i) => (
          <Box
            key={p.id}
            sx={{
              scrollSnapAlign: "center",
              flexShrink: 0,
              transition: "transform 0.3s ease",
              // Slightly scale the container if active for visual feedback
              transform: currentIndex === i ? "scale(1.05)" : "scale(1)",
            }}
          >
            <PlayerThumbnail
              player={p}
              index={i}
              currentIndex={currentIndex}
              onSelect={onSelect}
              usersMatchPlayerRatings={usersMatchPlayerRatings}
              storedUsersMatchMOTM={storedUsersMatchMOTM}
            />
          </Box>
        ))}
      </Box>

      {/* RIGHT NAV */}
      {!isMobile && (
        <IconButton
          onClick={() => handleManualScroll(1)}
          sx={{
            ...theme.clay?.button,
            width: 40,
            height: 40,
            flexShrink: 0,
            zIndex: 2,
            bgcolor: alpha(theme.palette.background.paper, 0.8),
          }}
        >
          <ChevronRightRounded />
        </IconButton>
      )}
    </Box>
  );
}
