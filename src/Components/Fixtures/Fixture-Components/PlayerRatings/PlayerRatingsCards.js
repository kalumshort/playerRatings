import React, { useMemo, useState, useCallback } from "react";
import { useSelector, shallowEqual } from "react-redux";
import {
  Button,
  IconButton,
  Paper,
  Box,
  Typography,
  Avatar,
  Tooltip,
  ToggleButton,
} from "@mui/material";

// Icons
import StarIcon from "@mui/icons-material/StarRounded";
import StarOutlineIcon from "@mui/icons-material/StarOutlineRounded";
import CheckCircleIcon from "@mui/icons-material/CheckCircleRounded";
import AddIcon from "@mui/icons-material/AddRounded";
import RemoveIcon from "@mui/icons-material/RemoveRounded";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import StyleIcon from "@mui/icons-material/Style";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";

import { selectSquadPlayerById } from "../../../../Selectors/squadDataSelectors";
import {
  setLocalStorageItem,
  useLocalStorage,
} from "../../../../Hooks/Helper_Functions";
import { handlePlayerRatingSubmit } from "../../../../Firebase/Firebase";
import { useParams } from "react-router-dom";

// =========================================================
// 1. PARENT COMPONENT
// =========================================================
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
  swiperRef,
}) {
  const players = useMemo(
    () => combinedPlayers.filter(Boolean),
    [combinedPlayers],
  );
  const [index, setIndex] = useState(0);

  if (!players.length) return null;

  const next = () => setIndex((i) => (i + 1) % players.length);
  const prev = () => setIndex((i) => (i - 1 + players.length) % players.length);

  const current = players[index];

  return (
    <Box
      sx={{
        margin: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
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
        swiperRef={swiperRef}
        onNext={next}
        onPrev={prev}
      />

      <Box sx={{ mt: 3, display: "flex", gap: 1, alignItems: "center" }}>
        <Typography
          variant="overline"
          fontWeight="bold"
          letterSpacing={2}
          color="text.secondary"
        >
          Player {index + 1} / {players.length}
        </Typography>
      </Box>
    </Box>
  );
}

// =========================================================
// 2. MAIN CARD COMPONENT
// =========================================================
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
  const { clubSlug } = useParams();

  const selectPlayer = useMemo(
    () => selectSquadPlayerById(player.id, clubSlug),
    [player.id, clubSlug],
  );

  const playerData = useSelector(selectPlayer, shallowEqual);

  const playerEvents = useMemo(() => {
    if (!fixture?.events) return [];
    const pId = player.id;
    const events = [];

    fixture.events.forEach((ev) => {
      const time =
        ev.time.elapsed + (ev.time.extra ? `+${ev.time.extra}` : "") + "'";

      // ... (Keep existing event logic exactly as is) ...
      if (
        ev.type === "Goal" &&
        ev.player.id === pId &&
        ev.detail === "Normal Goal"
      )
        events.push({ type: "goal", label: "Goal", time });
      if (ev.type === "Goal" && ev.player.id === pId && ev.detail === "Penalty")
        events.push({ type: "penalty", label: "Penalty", time });
      if (ev.type === "Goal" && ev.assist.id === pId)
        events.push({ type: "assist", label: "Assist", time });
      if (
        ev.type === "Card" &&
        ev.player.id === pId &&
        ev.detail.includes("Yellow")
      )
        events.push({ type: "yellow", label: "Yellow Card", time });
      if (
        ev.type === "Card" &&
        ev.player.id === pId &&
        ev.detail.includes("Red")
      )
        events.push({ type: "red", label: "Red Card", time });
      if (ev.type === "subst" && ev.player.id === pId)
        events.push({ type: "subOut", label: "Subbed Out", time });
      if (ev.type === "subst" && ev.assist.id === pId)
        events.push({ type: "subIn", label: "Subbed In", time });
    });
    return events;
  }, [fixture?.events, player.id]);

  const storedUsersPlayerRating = usersMatchPlayerRating;
  const storedUsersMatchMOTM = useLocalStorage(`userMatchMOTM-${fixture.id}`);
  const isMOTM = storedUsersMatchMOTM === String(player?.id);

  const playerRatingAverage = matchRatings?.[player.id]?.totalRating
    ? (
        matchRatings[player.id]?.totalRating /
        matchRatings[player.id]?.totalSubmits
      ).toFixed(1)
    : storedUsersPlayerRating;

  const onRatingSubmit = useCallback(
    async (ratingValue) => {
      await handlePlayerRatingSubmit({
        matchId: fixture.id,
        playerId: String(player.id),
        rating: ratingValue,
        userId,
        groupId,
        currentYear,
      });
    },
    [fixture.id, player.id, userId, groupId, currentYear],
  );

  const handleMotmClick = async () => {
    if (readOnly) return;
    setLocalStorageItem(
      `userMatchMOTM-${fixture.id}`,
      isMOTM ? null : String(player.id),
    );
  };

  const displayName = playerData?.name || player.name;
  const displayPhoto =
    player?.photo ||
    playerData?.photo ||
    `https://media.api-sports.io/football/players/${player.id}.png`;

  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        ...theme.clay.card, // <--- 1. LOAD GLOBAL CLAY STYLES
        width: isMobile ? "95%" : "500px",
        height: "auto",
        minHeight: isMobile ? "520px" : "640px",
        maxHeight: "85vh",
        pb: 3,
        m: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        overflow: "hidden",
        position: "relative",
        borderRadius: "16px",
      })}
    >
      {/* --- TOP: Player Info & Events --- */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          px: 6,
          mt: 2,
        }}
      >
        <Avatar
          src={displayPhoto}
          alt={displayName}
          sx={(theme) => ({
            width: isMobile ? 100 : 150,
            height: isMobile ? 100 : 150,
            mb: 2,
            border: `5px solid ${theme.palette.background.default}`, // Matches bg
            boxShadow: isMOTM
              ? "0 0 25px #FFC8DD" // Glowing MOTM
              : theme.clay.card.boxShadow, // Inherit Clay Shadow
            transition: "all 0.3s ease",
          })}
        />

        <Typography
          variant="h4"
          fontWeight={800}
          textAlign="center"
          letterSpacing="-0.5px"
        >
          {displayName}
        </Typography>

        {playerData?.position && (
          <Typography
            variant="subtitle1"
            color="text.secondary"
            sx={{
              textTransform: "uppercase",
              letterSpacing: 2,
              mt: 0.5,
              fontSize: "0.75rem",
              fontWeight: 700,
            }}
          >
            {playerData?.position}
          </Typography>
        )}

        {/* Events Row */}
        <Box
          sx={{
            display: "flex",
            gap: 1,
            mt: 3,
            flexWrap: "wrap",
            justifyContent: "center",
            minHeight: 32,
          }}
        >
          {playerEvents.length > 0 &&
            playerEvents.map((ev, i) => (
              <EventBadge
                key={i}
                type={ev.type}
                label={ev.label}
                time={ev.time}
              />
            ))}
        </Box>
      </Box>

      {/* --- BOTTOM: Controls Box --- */}
      <Box
        sx={{
          width: "100%",
          position: "relative",
          p: 3,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        {storedUsersPlayerRating ? (
          /* RESULTS VIEW */
          <Box
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "space-evenly",
              alignItems: "center",
              py: 1,
            }}
          >
            <ResultDisplay label="YOURS" score={storedUsersPlayerRating} />
            <Box
              sx={(theme) => ({
                width: "2px",
                height: 50,
                bgcolor:
                  theme.palette.mode === "light"
                    ? "rgba(0,0,0,0.05)"
                    : "rgba(255,255,255,0.1)",
                mx: 1,
                borderRadius: "2px",
              })}
            />
            <ResultDisplay label="AVERAGE" score={playerRatingAverage} />
          </Box>
        ) : (
          /* INPUT VIEW */
          <RatingInputSection
            swiperRef={swiperRef}
            onRatingSubmit={onRatingSubmit}
            isMOTM={isMOTM}
            readOnly={readOnly}
            isMobile={isMobile}
          />
        )}
      </Box>

      {/* --- MOTM TOGGLE --- */}
      <Box sx={{ position: "absolute", top: 20, right: 20 }}>
        <Tooltip title={isMOTM ? "Remove MOTM" : "Award MOTM"} arrow>
          <ToggleButton
            value="motm"
            selected={isMOTM}
            onChange={handleMotmClick}
            disabled={readOnly}
            sx={(theme) => ({
              ...theme.clay.button, // Use surface clay style
              width: isMobile ? 48 : 56,
              height: isMobile ? 48 : 56,
              color: isMOTM ? "#FF9EBB" : "text.secondary",
              border: "none",
              "&.Mui-selected": {
                backgroundColor: "background.default",
                color: "#FF9EBB",
                boxShadow: theme.clay.box.boxShadow, // Inset state
                "&:hover": { backgroundColor: "background.default" },
              },
            })}
          >
            {isMOTM ? (
              <StarIcon fontSize={isMobile ? "medium" : "large"} />
            ) : (
              <StarOutlineIcon fontSize={isMobile ? "medium" : "large"} />
            )}
          </ToggleButton>
        </Tooltip>
      </Box>
    </Paper>
  );
}

// =========================================================
// 3. ISOLATED INPUT SECTION
// =========================================================
const RatingInputSection = React.memo(
  ({ swiperRef, onRatingSubmit, isMOTM, readOnly, isMobile }) => {
    const [sliderValue, setSliderValue] = useState(6);

    const adjustScore = (amount) => {
      setSliderValue((prev) => {
        const next = prev + amount;
        if (next > 10) return 10;
        if (next < 1) return 1;
        return next;
      });
    };

    return (
      <Box
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: isMobile ? 2 : 3,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-evenly",
            width: "100%",
            maxWidth: isMobile ? 300 : 380,
            mx: "auto",
          }}
        >
          {/* MINUS BUTTON */}
          <IconButton
            onClick={() => adjustScore(-0.5)}
            disabled={sliderValue <= 1}
            sx={(theme) => ({
              ...theme.clay.button,
              width: isMobile ? 50 : 64,
              height: isMobile ? 50 : 64,
            })}
          >
            <RemoveIcon fontSize={isMobile ? "small" : "medium"} />
          </IconButton>

          {/* SCORE DISPLAY (Uses theme.clay.box for Pressed look) */}
          <Box
            sx={(theme) => ({
              ...theme.clay.box,
              textAlign: "center",
              minWidth: isMobile ? 80 : 100,
              height: isMobile ? 80 : 100,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            })}
          >
            <Typography
              variant={isMobile ? "h3" : "h2"}
              sx={(theme) => ({
                fontWeight: 900,
                lineHeight: 1,
                color:
                  sliderValue >= 8
                    ? theme.palette.primary.main
                    : sliderValue >= 5
                      ? "text.primary"
                      : "#FFC8DD",
              })}
            >
              {sliderValue.toFixed(1).endsWith(".0")
                ? sliderValue
                : sliderValue.toFixed(1)}
            </Typography>
          </Box>

          {/* PLUS BUTTON */}
          <IconButton
            onClick={() => adjustScore(0.5)}
            disabled={sliderValue >= 10}
            sx={(theme) => ({
              ...theme.clay.button,
              width: isMobile ? 50 : 64,
              height: isMobile ? 50 : 64,
            })}
          >
            <AddIcon fontSize={isMobile ? "small" : "medium"} />
          </IconButton>
        </Box>

        {/* CONFIRM BUTTON (Uses standard MUI Button which has global theme style) */}
        <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
          <Button
            variant="contained"
            onClick={() => onRatingSubmit(sliderValue)}
            startIcon={<CheckCircleIcon />}
            sx={{
              flex: 1,
              maxWidth: 300,
              height: isMobile ? 48 : 56,
              fontSize: "1rem",
            }}
          >
            Confirm Rating
          </Button>
        </Box>
      </Box>
    );
  },
);

// =========================================================
// 4. HELPER: RESULTS DISPLAY
// =========================================================
const ResultDisplay = ({ label, score }) => (
  <Box
    sx={{
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}
  >
    <Typography
      variant="overline"
      sx={{
        fontWeight: 700,
        letterSpacing: 1.2,
        mb: 1,
        color: "text.secondary",
      }}
    >
      {label}
    </Typography>
    <Box
      sx={(theme) => ({
        ...theme.clay.box, // The "Pressed" look
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 72,
        height: 72,
      })}
    >
      <Typography variant="h4" fontWeight="bold">
        {score}
      </Typography>
    </Box>
  </Box>
);

// =========================================================
// 5. HELPER: EVENT BADGE
// =========================================================
const EventBadge = React.memo(({ type, label, time }) => {
  let icon = null;
  let color = "text.primary";
  let bg = "background.default"; // Fallback

  // Logic to determine colors
  switch (type) {
    case "goal":
    case "penalty":
      icon = <SportsSoccerIcon fontSize="small" />;
      color = "#2F5C34";
      bg = "#A0E8AF";
      break;
    case "assist":
      icon = <AutoFixHighIcon fontSize="small" />;
      color = "#2B4C6F";
      bg = "#A2D2FF";
      break;
    case "yellow":
      icon = <StyleIcon fontSize="small" sx={{ transform: "rotate(90deg)" }} />;
      color = "#744210";
      bg = "#F6E05E";
      break;
    case "red":
      icon = <StyleIcon fontSize="small" sx={{ transform: "rotate(90deg)" }} />;
      color = "#742A2A";
      bg = "#FEB2B2";
      break;
    case "subIn":
    case "subOut":
      icon = (
        <CompareArrowsIcon
          fontSize="small"
          sx={{ transform: "rotate(90deg)" }}
        />
      );
      color = type === "subIn" ? "#2F5C34" : "#742A2A";
      bg = type === "subIn" ? "#C6F6D5" : "#FED7D7";
      break;
    default:
      break;
  }

  return (
    <Tooltip title={label} arrow>
      <Box
        sx={(theme) => ({
          display: "flex",
          alignItems: "center",
          gap: 0.8,
          borderRadius: "20px",
          px: 1.5,
          py: 0.5,
          bgcolor: bg,
          color: color,
          // Subtle lift for badges
          boxShadow: "2px 2px 5px rgba(0,0,0,0.05)",
          fontWeight: 600,
        })}
      >
        <Box sx={{ display: "flex" }}>{icon}</Box>
        <Typography variant="caption" sx={{ fontWeight: "800" }}>
          {time}
        </Typography>
      </Box>
    </Tooltip>
  );
});
