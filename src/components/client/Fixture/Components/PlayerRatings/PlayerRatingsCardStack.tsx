"use client";

import React, { useMemo, useRef, useState } from "react";
import { Box, useTheme, useMediaQuery } from "@mui/material";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards, Navigation } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";

// Swiper Styles
import "swiper/css";
import "swiper/css/effect-cards";
import "swiper/css/navigation";

// Components

import PlayerImageCarousel from "./PlayerImageCarousel";
import { PlayerRatingCard } from "./PlayerRatingCard";
import { selectMatchRatingsById } from "@/lib/redux/selectors/ratingsSelectors";
import { RootState } from "@/lib/redux/store";
import { useSelector } from "react-redux";

interface CardStackProps {
  combinedPlayers: any[];
  fixture: any;
  groupId: string;
  userId: string;
  usersMatchPlayerRatings: any;
  currentYear: string;
  storedUsersMatchMOTM: string | null;
  setStoredMotmId: React.Dispatch<React.SetStateAction<string | null>>;
  storedMotmId: string | null;
}

export default function PlayerRatingsCardStack({
  combinedPlayers = [],
  fixture,
  groupId,
  userId,
  usersMatchPlayerRatings,
  currentYear,
  storedUsersMatchMOTM,
  setStoredMotmId,
  storedMotmId,
}: CardStackProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const swiperRef = useRef<SwiperType | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const matchRatings = useSelector((state: RootState) =>
    selectMatchRatingsById(fixture.id)(state),
  );

  // 1. DATA SANITIZATION
  const players = useMemo(
    () => combinedPlayers.filter(Boolean),
    [combinedPlayers],
  );

  if (!players.length) return null;

  // 2. NAVIGATION HANDLER
  const handleCarouselSelect = (i: number) => {
    setCurrentIndex(i);
    if (swiperRef.current) {
      swiperRef.current.slideTo(i);
    }
  };

  return (
    <Box
      className="ratings-stack-wrap"
      sx={{
        mt: 2,
        width: "100%",
        // Ensure swiper navigation buttons don't clip
        "& .swiper-button-next, & .swiper-button-prev": {
          color: theme.palette.primary.main,
          transform: "scale(0.6)",
          top: "55%",
        },
      }}
    >
      {/* THUMBNAIL NAVIGATOR */}
      <PlayerImageCarousel
        combinedPlayers={players}
        usersMatchPlayerRatings={usersMatchPlayerRatings}
        currentIndex={currentIndex}
        isMobile={isMobile}
        storedUsersMatchMOTM={storedUsersMatchMOTM}
        fixture={fixture}
        onSelect={handleCarouselSelect}
      />

      {/* CARD STACK */}
      <Box
        sx={{
          maxWidth: 520,
          mx: "auto",
          mt: 3,
          // Clay Container Shadow
          filter: "drop-shadow(0px 20px 30px rgba(0,0,0,0.15))",
        }}
        style={{
          overflow: "hidden",
        }}
      >
        <Swiper
          effect="cards"
          grabCursor
          modules={[EffectCards, Navigation]}
          onSwiper={(s) => (swiperRef.current = s)}
          onSlideChange={(s) => setCurrentIndex(s.activeIndex)}
          /* IMPORTANT: These classes prevent the Swiper from moving 
             when the user is interacting with the Rating Slider.
          */
          noSwiping
          noSwipingClass="no-swipe"
          style={{
            width: isMobile ? "90%" : "100%",
            overflow: "visible",
          }}
        >
          {players.map((p) => (
            <SwiperSlide
              key={p.id}
              style={{ borderRadius: "24px", overflow: "hidden" }}
            >
              <PlayerRatingCard
                player={p}
                fixture={fixture}
                isMobile={isMobile}
                groupId={groupId}
                userId={userId}
                usersMatchPlayerRating={usersMatchPlayerRatings?.[p.id]}
                currentYear={currentYear}
                // Pass ref to child so it can lock/unlock swiping during slider drag
                swiperRef={swiperRef}
                matchRatings={matchRatings}
                setStoredMotmId={setStoredMotmId}
                storedMotmId={storedMotmId}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </Box>
    </Box>
  );
}
