"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
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

// Stable empty reference for fixtures with no events yet.
const EMPTY_EVENTS: any[] = [];

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
    selectMatchRatingsById(state, fixture.id),
  );

  // 1. DATA SANITIZATION
  const players = useMemo(
    () => combinedPlayers.filter(Boolean),
    [combinedPlayers],
  );

  const matchId = String(fixture.id);
  // Stable reference when the fixture has no events yet, so the memoized cards
  // don't see a fresh [] on every render.
  const events = fixture?.events ?? EMPTY_EVENTS;

  // Averages computed once here rather than each card scanning the ratings map,
  // which also lets PlayerRatingCard take a primitive instead of the whole map.
  const avgRatings = useMemo(() => {
    const out: Record<string, string | null> = {};
    players.forEach((p: any) => {
      const stats = matchRatings?.[String(p.id)];
      out[String(p.id)] = stats?.totalSubmits
        ? (stats.totalRating / stats.totalSubmits).toFixed(1)
        : null;
    });
    return out;
  }, [players, matchRatings]);

  // 2. NAVIGATION HANDLER
  // Must stay above the early return below — hooks can't run conditionally.
  // Memoized because PlayerThumbnail is React.memo'd and a fresh function here
  // defeated it on every render.
  const handleCarouselSelect = useCallback((i: number) => {
    setCurrentIndex(i);
    if (swiperRef.current) {
      swiperRef.current.slideTo(i);
    }
  }, []);

  if (!players.length) return null;

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
              {/* Narrow props only: passing `fixture` and `matchRatings`
                  would hand every card two objects that change identity on
                  each live tick, making React.memo useless. */}
              <PlayerRatingCard
                player={p}
                matchId={matchId}
                events={events}
                avgRating={avgRatings[String(p.id)]}
                isMobile={isMobile}
                groupId={groupId}
                userId={userId}
                usersMatchPlayerRating={usersMatchPlayerRatings?.[p.id]}
                currentYear={currentYear}
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
