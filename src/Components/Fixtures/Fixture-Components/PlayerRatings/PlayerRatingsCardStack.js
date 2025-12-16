// PlayerRatingsCardStack.jsx
import React, { useMemo, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-cards";
import "swiper/css/navigation";
import "./swiper-overrides.css";

import { PlayerRatingCard } from "./PlayerRatingsCards";
import PlayerImageCarousel from "./PlayerImageCarousel";

export default function PlayerRatingsCardStack({
  combinedPlayers = [],
  fixture,
  isMobile,
  matchRatings,
  readOnly,
  groupId,
  userId,
  usersMatchPlayerRatings,
  currentYear,
  storedUsersMatchMOTM,
}) {
  const swiperRef = useRef(null);
  const [index, setIndex] = useState(0);
  const players = useMemo(
    () => combinedPlayers.filter(Boolean),
    [combinedPlayers]
  );
  if (!players.length) return null;

  return (
    <div className="ratings-stack-wrap">
      {/* NEW: thumbnail carousel */}
      <PlayerImageCarousel
        combinedPlayers={players}
        usersMatchPlayerRatings={usersMatchPlayerRatings}
        currentIndex={index}
        isMobile={isMobile}
        storedUsersMatchMOTM={storedUsersMatchMOTM}
        fixture={fixture}
        onSelect={(i) => {
          setIndex(i);
          if (swiperRef.current) swiperRef.current.slideTo(i);
        }}
      />

      <Swiper
        effect="cards"
        grabCursor
        modules={[EffectCards, Navigation]}
        navigation
        onSwiper={(s) => (swiperRef.current = s)}
        onSlideChange={(s) => setIndex(s.activeIndex)}
        noSwiping
        noSwipingClass="no-swipe"
        style={{ width: isMobile ? "100%" : 520 }}
      >
        {players.map((p) => (
          <SwiperSlide key={p.id}>
            <PlayerRatingCard
              player={p}
              fixture={fixture}
              isMobile={isMobile}
              matchRatings={matchRatings}
              readOnly={readOnly}
              groupId={groupId}
              userId={userId}
              usersMatchPlayerRating={usersMatchPlayerRatings?.[p.id]}
              currentYear={currentYear}
              swiperRef={swiperRef} // keep your slider conflict fix
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
