// PlayerRatingsCardStack.jsx
import React, { useMemo } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-cards";
import "swiper/css/navigation";
import "./swiper-overrides.css";

import { PlayerRatingCard } from "./PlayerRatingsCards";

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
}) {
  const players = useMemo(
    () => combinedPlayers.filter(Boolean),
    [combinedPlayers]
  );

  if (!players.length) return null;

  const swiperRef = React.createRef();

  return (
    <div className="ratings-stack-wrap">
      <Swiper
        effect="cards"
        grabCursor={true}
        modules={[EffectCards, Navigation]}
        navigation
        onSwiper={(s) => (swiperRef.current = s)}
        noSwiping
        noSwipingClass="no-swipe" // any element with this class won't start a swipe
        style={{ width: isMobile ? "100%" : 520, height: isMobile ? 420 : 650 }}
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
              swiperRef={swiperRef}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
