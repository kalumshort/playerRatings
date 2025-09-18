import React, { useMemo, useState } from "react";
import { selectSquadPlayerById } from "../../../../Selectors/squadDataSelectors";
import { useSelector } from "react-redux";
import StarIcon from "@mui/icons-material/Star";
import CheckIcon from "@mui/icons-material/Check";

import {
  getRatingClass,
  setLocalStorageItem,
  useLocalStorage,
} from "../../../../Hooks/Helper_Functions";
import { useTheme } from "../../../Theme/ThemeContext";
import { handlePlayerRatingSubmit } from "../../../../Firebase/Firebase";
import { Button, IconButton, Paper, Slider } from "@mui/material";

import StarOutlineIcon from "@mui/icons-material/StarOutline";

export default function PlayerRatingsCards({
  combinedPlayers = [],
  fixture,
  isMobile,
  matchRatings,
  readOnly,
  groupId,
  userId,
  currentYear,
  usersMatchPlayerRatings,
}) {
  const players = useMemo(
    () => combinedPlayers.filter(Boolean),
    [combinedPlayers]
  );
  const [index, setIndex] = useState(0);

  if (!players.length) return null;

  const next = () => setIndex((i) => (i + 1) % players.length);
  const prev = () => setIndex((i) => (i - 1 + players.length) % players.length);

  const current = players[index];

  return (
    <div style={{ margin: 20 }}>
      <PlayerRatingCard
        player={current}
        fixture={fixture}
        isMobile={isMobile}
        matchRatings={matchRatings}
        readOnly={readOnly}
        groupId={groupId}
        userId={userId}
        usersMatchPlayerRating={usersMatchPlayerRatings?.[current.id]}
        currentYear={currentYear}
      />

      <div
        style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}
      >
        <Button onClick={prev}>‹ Prev</Button>
        <div style={{ flex: 1, textAlign: "center" }}>
          {index + 1} / {players.length}
        </div>
        <Button onClick={next}>Next ›</Button>
      </div>
    </div>
  );
}
export function PlayerRatingCard({
  player,
  fixture,
  isMobile,
  matchRatings,
  readOnly,
  groupId,
  userId,
  currentYear,
  usersMatchPlayerRating,
  swiperRef,
}) {
  const playerData = useSelector(selectSquadPlayerById(player.id));

  const [sliderValue, setSliderValue] = useState(6);

  const handleSliderChange = (event, newValue) => {
    event.preventDefault();
    setSliderValue(newValue);
  };

  const { themeBackgroundImage } = useTheme();

  const storedUsersPlayerRating = usersMatchPlayerRating;
  const storedUsersMatchMOTM = useLocalStorage(`userMatchMOTM-${fixture.id}`);

  const isMOTM = storedUsersMatchMOTM === String(player?.id);

  const playerRatingAverage = matchRatings?.[player.id]?.totalRating
    ? (
        matchRatings[player.id]?.totalRating /
        matchRatings[player.id]?.totalSubmits
      ).toFixed(1)
    : storedUsersPlayerRating;

  const onRatingClick = async () => {
    await handlePlayerRatingSubmit({
      matchId: fixture.id,
      playerId: String(player.id),
      rating: sliderValue,
      userId: userId,
      groupId: groupId,
      currentYear,
    });
  };
  const handleMotmClick = async () => {
    if (readOnly) {
      return;
    }
    if (isMOTM) {
      setLocalStorageItem(`userMatchMOTM-${fixture.id}`, null);
    } else {
      setLocalStorageItem(`userMatchMOTM-${fixture.id}`, String(player.id));
    }
  };

  return (
    <Paper
      style={{
        backgroundImage: `url(${themeBackgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        width: isMobile ? "90%" : "500px",
        height: isMobile ? "400px" : "600px",
        margin: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-evenly",
      }}
    >
      <div
        style={{
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <img
          src={playerData?.photo || player.photo}
          alt={playerData?.name || player.name}
          width={"100px"}
          style={{ borderRadius: "50%", backgroundColor: "#00000014" }}
        />
        <h2 style={{ margin: "15px 0px 5px 0px" }}>
          {playerData?.name || player.name}
        </h2>
        {playerData?.position && (
          <h4
            style={{
              padding: "0px",
              margin: "0px",
              fontWeight: "100",
            }}
          >
            {playerData?.position}
          </h4>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(5, 1fr)",
          gap: "10px",
          width: "90%",
        }}
      >
        {/* {Array.from({ length: 10 }, (_, i) => (
          <ButtonGroup
            key={i}
            aria-label="PlayerRatingsButtonGroup"
            orientation="horizontal"
            size="large"
            style={{ width: "100%" }} // make group fill its grid cell
          >
            <Button
              variant="contained"
              onClick={() => onRatingClick(i + 1)}
              style={{ flex: 1 }} // make button stretch
            >
              {i + 1}
            </Button>

            {i !== 9 && (
              <Button
                variant="outlined"
                onClick={() => onRatingClick(i + 1.5)}
                style={{ flex: 1 }} // make .5 stretch
              >
                .5
              </Button>
            )}
          </ButtonGroup>
        ))} */}
      </div>

      {storedUsersPlayerRating ? (
        <div className="PlayerRatingsResults">
          <div className="PlayerRatingsCommunityContainer">
            <h2 className="PlayerRatingsCommunityTitle">Your Score</h2>
            <div
              className={`globalBoxShadow PlayerStatsListItemScoreContainer ${getRatingClass(
                storedUsersPlayerRating
              )}`}
            >
              <h4 className="PlayerRatingsCommunityScore textShadow">
                {storedUsersPlayerRating}
              </h4>
            </div>
          </div>

          <div className="PlayerRatingsCommunityContainer">
            <h2 className="PlayerRatingsCommunityTitle">Community Score</h2>
            <div
              className={`globalBoxShadow PlayerStatsListItemScoreContainer ${getRatingClass(
                playerRatingAverage
              )}`}
            >
              <h4 className="PlayerRatingsCommunityScore textShadow">
                {playerRatingAverage}
              </h4>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="no-swipe"
          style={{
            width: "80%",
            marginBottom: 10,
            marginTop: -10,
            gap: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
          }}
        >
          <h4 className="PlayerRatingsCommunityScore textShadow">
            {sliderValue}
          </h4>
          <Slider
            value={sliderValue}
            onChange={handleSliderChange}
            step={0.5}
            min={1}
            max={10}
            onPointerDown={(e) => {
              e.stopPropagation();
              if (swiperRef?.current) swiperRef.current.allowTouchMove = false;
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
              if (swiperRef?.current) swiperRef.current.allowTouchMove = true;
            }}
            onPointerCancel={() => {
              if (swiperRef?.current) swiperRef.current.allowTouchMove = true;
            }}
            onMouseDown={(e) => e.stopPropagation()} // desktop fallback
            onTouchStart={(e) => e.stopPropagation()} // iOS/Android fallback
            sx={{
              height: 8,
              "& .MuiSlider-rail": {
                background:
                  "linear-gradient(to right, #ff6b6b, #ffb56b, #6bff95, #6bbfff)",
                opacity: 1,
              },
              "& .MuiSlider-track": {
                background: "transparent",
                border: "none",
              },
              "& .MuiSlider-thumb": {
                width: 20,
                height: 20,
                backgroundColor: "#fff",
                border: "2px solid #333",
              },
            }}
          />
          <IconButton
            aria-label="confirm"
            size="large"
            variant="outlined"
            onClick={() => onRatingClick()}
          >
            <CheckIcon />
          </IconButton>
        </div>
      )}

      <div
        style={{
          cursor: readOnly ? "default" : "pointer",
          pointerEvents: readOnly ? "none" : "auto",
          position: "absolute",
          top: "5%",
          right: "15%",
        }}
      >
        {isMOTM ? (
          <StarIcon
            fontSize="large"
            onClick={handleMotmClick}
            color="primary"
          />
        ) : !readOnly ? (
          <StarOutlineIcon fontSize="large" onClick={handleMotmClick} />
        ) : null}
      </div>
    </Paper>
  );
}
