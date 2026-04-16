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
  const theme = useTheme();

  // --- AUTO-SCROLL LOGIC ---
  useEffect(() => {
    const el = trackRef.current;
    if (!el || !el.children[currentIndex]) return;

    const child = el.children[currentIndex] as HTMLElement;
    const scrollLeft =
      child.offsetLeft - el.offsetWidth / 2 + child.offsetWidth / 2;

    el.scrollTo({
      left: scrollLeft,
      behavior: "smooth",
    });
  }, [currentIndex]);

  const handleManualScroll = (direction: number) => {
    const el = trackRef.current;
    if (!el) return;
    const scrollAmount = isMobile ? 200 : 400;
    el.scrollBy({ left: direction * scrollAmount, behavior: "smooth" });
  };

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",

        // The "Fade Out" effect on the edges to signal scrollability
        "&::before, &::after": {
          content: '""',
          position: "absolute",
          top: 0,
          bottom: 0,
          width: { xs: 40, md: 80 },
          zIndex: 2,
          pointerEvents: "none",
          transition: "opacity 0.3s ease",
        },
        "&::before": {
          left: 0,
          background: `linear-gradient(to right, ${theme.palette.background.default}, transparent)`,
        },
        "&::after": {
          right: 0,
          background: `linear-gradient(to left, ${theme.palette.background.default}, transparent)`,
        },
      }}
    >
      {/* LEFT NAV */}
      {!isMobile && (
        <IconButton
          onClick={() => handleManualScroll(-1)}
          sx={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 10,
            bgcolor: alpha(theme.palette.background.paper, 0.9),
            backdropFilter: "blur(8px)",
            boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            "&:hover": { bgcolor: theme.palette.background.paper },
          }}
        >
          <ChevronLeftRounded />
        </IconButton>
      )}

      {/* THE SCROLL TRACK */}
      <Box
        ref={trackRef}
        sx={{
          display: "flex",
          gap: { xs: 2, md: 3 },
          overflowX: "auto",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          "&::-webkit-scrollbar": { display: "none" },
          scrollSnapType: "x mandatory",
          px: "calc(50% - 40px)", // Centers the first and last items perfectly
          alignItems: "center",
          minHeight: 120,
        }}
      >
        {combinedPlayers.map((p, i) => {
          const isSelected = currentIndex === i;
          const hasBeenRated = !!usersMatchPlayerRatings[p.id];
          const isMOTM = storedUsersMatchMOTM === String(p.id);

          return (
            <Box
              key={p.id}
              onClick={() => onSelect(i)}
              sx={{
                scrollSnapAlign: "center",
                flexShrink: 0,
                cursor: "pointer",
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                position: "relative",
                // Visual Hierarchy: Dim and scale down inactive players
                transform: isSelected ? "scale(1.15)" : "scale(0.85)",
                opacity: isSelected ? 1 : 0.4,
                filter: isSelected ? "none" : "grayscale(0.5)",

                // Status Indicator Ring for "Rated" players
                "&::after":
                  hasBeenRated && !isSelected
                    ? {
                        content: '""',
                        position: "absolute",
                        bottom: 0,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        bgcolor: "success.main",
                        boxShadow: `0 0 10px ${theme.palette.success.main}`,
                      }
                    : {},
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

              {/* Optional: Tiny MOTM icon overlaying the thumbnail in carousel */}
              {isMOTM && (
                <Box
                  sx={{
                    position: "absolute",
                    top: -5,
                    right: -5,
                    bgcolor: "secondary.main",
                    borderRadius: "50%",
                    width: 20,
                    height: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: `2px solid ${theme.palette.background.default}`,
                    zIndex: 3,
                  }}
                >
                  <span style={{ fontSize: "10px", color: "white" }}>★</span>
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      {/* RIGHT NAV */}
      {!isMobile && (
        <IconButton
          onClick={() => handleManualScroll(1)}
          sx={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 10,
            bgcolor: alpha(theme.palette.background.paper, 0.9),
            backdropFilter: "blur(8px)",
            boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            "&:hover": { bgcolor: theme.palette.background.paper },
          }}
        >
          <ChevronRightRounded />
        </IconButton>
      )}
    </Box>
  );
}
