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
import StarIcon from "@mui/icons-material/Star";
import StarOutlineIcon from "@mui/icons-material/StarOutline";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import StyleIcon from "@mui/icons-material/Style";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";

import { selectSquadPlayerById } from "../../../../Selectors/squadDataSelectors";
import {
  getRatingClass,
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
    [combinedPlayers]
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

      <Box
        sx={{
          mt: 2,
          display: "flex",
          gap: 1,
          alignItems: "center",
          color: "text.secondary",
        }}
      >
        <Typography variant="caption" fontWeight="bold">
          {index + 1} / {players.length}
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
  onNext,
  onPrev,
}) {
  // 1. Performance: Memoize Selector
  // 1. Extract clubSlug from the URL context
  const { clubSlug } = useParams();

  // 2. Performance: Memoize Selector including the clubSlug context
  const selectPlayer = useMemo(
    // Pass clubSlug to the factory to look in the correct team's data
    () => selectSquadPlayerById(player.id, clubSlug),
    [player.id, clubSlug] // Re-memoize if player ID or club changes
  );

  // 3. Select player data using the context-aware selector
  const playerData = useSelector(selectPlayer, shallowEqual);

  // 2. Performance: Memoize Events Logic
  const playerEvents = useMemo(() => {
    if (!fixture?.events) return [];
    const pId = player.id;
    const events = [];

    fixture.events.forEach((ev) => {
      const time =
        ev.time.elapsed + (ev.time.extra ? `+${ev.time.extra}` : "") + "'";

      if (
        ev.type === "Goal" &&
        ev.player.id === pId &&
        ev.detail === "Normal Goal"
      ) {
        events.push({ type: "goal", label: "Goal", time });
      }
      if (
        ev.type === "Goal" &&
        ev.player.id === pId &&
        ev.detail === "Penalty"
      ) {
        events.push({ type: "penalty", label: "Penalty", time });
      }
      if (ev.type === "Goal" && ev.assist.id === pId) {
        events.push({ type: "assist", label: "Assist", time });
      }
      if (
        ev.type === "Card" &&
        ev.player.id === pId &&
        ev.detail.includes("Yellow")
      ) {
        events.push({ type: "yellow", label: "Yellow Card", time });
      }
      if (
        ev.type === "Card" &&
        ev.player.id === pId &&
        ev.detail.includes("Red")
      ) {
        events.push({ type: "red", label: "Red Card", time });
      }
      if (ev.type === "subst" && ev.player.id === pId) {
        events.push({ type: "subOut", label: "Subbed Out", time });
      }
      if (ev.type === "subst" && ev.assist.id === pId) {
        events.push({ type: "subIn", label: "Subbed In", time });
      }
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

  // Memoize submit handler to prevent re-renders
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
    [fixture.id, player.id, userId, groupId, currentYear]
  );

  const handleMotmClick = async () => {
    if (readOnly) return;
    setLocalStorageItem(
      `userMatchMOTM-${fixture.id}`,
      isMOTM ? null : String(player.id)
    );
  };

  return (
    <Paper
      elevation={10}
      sx={{
        // 1. Dynamic Solid Background Color logic
        backgroundColor: (theme) =>
          theme.palette.mode === "light"
            ? "#F8FAFC" // Solid White (matches your light mode base)
            : "#020617", // Solid Dark Grey (matches your dark mode rgb(20,20,20))

        // Optional: Reset backdrop filter since it's now opaque (performance boost)
        backdropFilter: "none",

        // 2. Your existing layout styles (converted to system props where applicable)
        width: isMobile ? "95%" : "500px",
        height: "auto",
        minHeight: isMobile ? "500px" : "640px",
        maxHeight: "85vh",
        pb: 2, // 'pb' works natively in sx
        m: "auto", // 'margin' becomes 'm'
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        overflow: "hidden",
        position: "relative",
      }}
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
          px: 6, // Padding to avoid overlap with nav buttons
        }}
      >
        <Avatar
          src={
            player?.photo ||
            playerData?.photo ||
            `https://media.api-sports.io/football/players/${player.id}.png`
          }
          alt={playerData?.name || player.name}
          sx={{
            width: isMobile ? 80 : 140,
            height: isMobile ? 80 : 140,
            mb: 1,
            border: isMOTM ? 4 : 1,
            borderColor: isMOTM ? "warning.main" : "divider", // Theme color
            boxShadow: isMOTM ? 10 : 2,
          }}
        />
        <Typography variant="h4" fontWeight="bold" textAlign="center">
          {playerData?.name || player.name}
        </Typography>

        {playerData?.position && (
          <Typography
            variant="subtitle1"
            sx={{
              textTransform: "uppercase",
              letterSpacing: 2,
              mt: 0.5,
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
            mt: 2,
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
          backdropFilter: "blur(15px)",

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
            className="PlayerRatingsResults"
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "space-evenly",
              alignItems: "center",
              py: 2, // Added padding for breathing room
            }}
          >
            {/* YOUR SCORE */}
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
                }}
              >
                YOURS
              </Typography>
              <Box
                className={`globalBoxShadow ${getRatingClass(
                  storedUsersPlayerRating
                )}`}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 72, // Increased size
                  height: 72, // Square aspect ratio
                  borderRadius: "18px",
                  border: "1px solid rgba(255,255,255,0.15)",
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(0,0,0,0.05)",
                }}
              >
                <Typography
                  variant="h4" // Larger, bolder text
                >
                  {storedUsersPlayerRating}
                </Typography>
              </Box>
            </Box>

            {/* Vertical Divider */}
            <Box
              sx={{
                width: "1px",
                height: 50,
                bgcolor: "divider",
                mx: 1,
                opacity: 0.5,
              }}
            />

            {/* AVERAGE SCORE */}
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
                }}
              >
                AVERAGE
              </Typography>
              <Box
                className={`globalBoxShadow ${getRatingClass(
                  playerRatingAverage
                )}`}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 72,
                  height: 72,
                  borderRadius: "18px",
                  border: "1px solid rgba(255,255,255,0.15)",
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(0,0,0,0.05)",
                }}
              >
                <Typography variant="h4">{playerRatingAverage}</Typography>
              </Box>
            </Box>
          </Box>
        ) : (
          /* NEW STEPPER INPUT VIEW */
          <RatingInputSection
            swiperRef={swiperRef}
            onRatingSubmit={onRatingSubmit}
            isMOTM={isMOTM}
            readOnly={readOnly}
            isMobile={isMobile}
          />
        )}
      </Box>
      <div style={{ position: "absolute", top: 16, right: 16 }}>
        <Tooltip title={isMOTM ? "Remove MOTM" : "Award MOTM"} arrow>
          <ToggleButton
            value="motm"
            selected={isMOTM}
            onChange={handleMotmClick}
            disabled={readOnly}
            sx={{
              flex: "0 0 auto",
              width: isMobile ? 48 : 56,
              height: isMobile ? 48 : 56,
              borderRadius: "16px",
              border: 1,
              borderColor: isMOTM && "warning.main",
              color: isMOTM && "warning.main",
            }}
          >
            {isMOTM ? (
              <StarIcon fontSize={isMobile ? "medium" : "large"} />
            ) : (
              <StarOutlineIcon fontSize={isMobile ? "medium" : "large"} />
            )}
          </ToggleButton>
        </Tooltip>
      </div>
    </Paper>
  );
}

// =========================================================
// 3. ISOLATED INPUT SECTION (STEPPER)
// =========================================================
const RatingInputSection = React.memo(
  ({ swiperRef, onRatingSubmit, isMOTM, onMotmToggle, readOnly, isMobile }) => {
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
          gap: isMobile ? 1.5 : 2,
        }}
      >
        {/* --- STEPPER ROW --- */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            maxWidth: isMobile ? 280 : 350, // Tighter width on mobile
            mx: "auto",
            mb: isMobile ? 0 : 1,
          }}
        >
          {/* MINUS BUTTON */}
          <IconButton
            onClick={() => adjustScore(-0.5)}
            disabled={sliderValue <= 1}
            sx={{
              border: "1px solid",

              // Smaller buttons on mobile
              width: isMobile ? 44 : 56,
              height: isMobile ? 44 : 56,
              borderRadius: "16px",
            }}
          >
            <RemoveIcon fontSize={isMobile ? "small" : "medium"} />
          </IconButton>

          {/* CENTER SCORE DISPLAY */}
          <Box sx={{ textAlign: "center", minWidth: isMobile ? 60 : 80 }}>
            <Typography
              variant={isMobile ? "h3" : "h2"} // Smaller text on mobile
              fontWeight="900"
              sx={{
                lineHeight: 1,
                color:
                  sliderValue >= 8
                    ? "#2ecc71"
                    : sliderValue >= 5
                    ? ""
                    : "#e74c3c",
              }}
            >
              {sliderValue.toFixed(1).endsWith(".0")
                ? sliderValue
                : sliderValue.toFixed(1)}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                textTransform: "uppercase",
                letterSpacing: 1,

                fontSize: isMobile ? "0.65rem" : "0.75rem",
              }}
            >
              Rating
            </Typography>
          </Box>

          {/* PLUS BUTTON */}
          <IconButton
            onClick={() => adjustScore(0.5)}
            disabled={sliderValue >= 10}
            sx={{
              border: "1px solid",

              width: isMobile ? 44 : 56,
              height: isMobile ? 44 : 56,
              borderRadius: "16px",
            }}
          >
            <AddIcon fontSize={isMobile ? "small" : "medium"} />
          </IconButton>
        </Box>

        {/* --- ACTION ROW: MOTM + CONFIRM --- */}
        <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
          <Button
            variant="contained"
            onClick={() => onRatingSubmit(sliderValue)}
            startIcon={<CheckCircleIcon />}
            sx={{
              flex: 1,
              maxWidth: 280,
              height: isMobile ? 48 : 56, // Smaller button height
              borderRadius: "16px",
              fontWeight: "bold",
              fontSize: isMobile ? "1rem" : "1.1rem",
              textTransform: "none",
            }}
          >
            Confirm
          </Button>
        </Box>
      </Box>
    );
  }
);

// =========================================================
// 4. HELPER: EVENT BADGE
// =========================================================
const EventBadge = React.memo(({ type, label, time }) => {
  let icon = null;
  let color = "white";
  let bg = "rgba(255,255,255,0.1)";

  switch (type) {
    case "goal":
    case "penalty":
      icon = <SportsSoccerIcon fontSize="small" />;
      color = "#2ecc71"; // Green
      break;
    case "assist":
      icon = <AutoFixHighIcon fontSize="small" />;
      color = "#3498db"; // Blue
      break;
    case "yellow":
      icon = <StyleIcon fontSize="small" sx={{ transform: "rotate(90deg)" }} />;
      color = "#f1c40f"; // Yellow
      break;
    case "red":
      icon = <StyleIcon fontSize="small" sx={{ transform: "rotate(90deg)" }} />;
      color = "#e74c3c"; // Red
      break;
    case "subIn":
      icon = (
        <CompareArrowsIcon
          fontSize="small"
          sx={{ transform: "rotate(90deg)" }}
        />
      );
      color = "#2ecc71";
      break;
    case "subOut":
      icon = (
        <CompareArrowsIcon
          fontSize="small"
          sx={{ transform: "rotate(90deg)" }}
        />
      );
      color = "#e74c3c";
      break;
    default:
      break;
  }

  return (
    <Tooltip title={label} arrow>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          borderRadius: "12px",
          px: 1,
          py: 0.5,
          border: `1px solid ${color}40`,
          bgcolor: bg,
        }}
      >
        <Box sx={{ display: "flex", color: color }}>{icon}</Box>
        <Typography variant="caption" sx={{ fontWeight: "bold" }}>
          {time}
        </Typography>
      </Box>
    </Tooltip>
  );
});
