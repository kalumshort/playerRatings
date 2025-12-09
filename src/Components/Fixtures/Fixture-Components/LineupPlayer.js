import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import {
  Box,
  Typography,
  Avatar,
  Stack,
  Tooltip,
  IconButton,
  useTheme,
  Zoom,
  Paper,
} from "@mui/material";
import { SportsSoccer, SwapVert, Delete, Rectangle } from "@mui/icons-material";

// --- HOOKS & SELECTORS ---
import { selectSquadPlayerById } from "../../../Selectors/squadDataSelectors";
import { missingPlayerImg } from "../../../Hooks/Helper_Functions";
import useGroupData from "../../../Hooks/useGroupsData";

export default function LineupPlayer({
  player,
  fixture,
  onDelete,
  percentage,
  showPlayerName = true,
  // Drag & Drop props passed through
  ...props
}) {
  const theme = useTheme();
  const playerData = useSelector(selectSquadPlayerById(player?.id));
  const { activeGroup } = useGroupData();
  const groupColour = activeGroup?.accentColor || "#DA291C";

  // --- EVENT LOGIC (Memoized for performance) ---
  const events = useMemo(() => {
    if (!fixture?.events || !player?.id)
      return { goals: [], cards: [], sub: null };

    const pId = player.id;

    // 1. Goals
    const goals = fixture.events.filter(
      (e) =>
        e.player?.id === pId &&
        (e.detail === "Normal Goal" ||
          (e.detail === "Penalty" && e.comments !== "Penalty Shootout"))
    );

    // 2. Cards
    const cards = fixture.events.filter(
      (e) => e.type === "Card" && e.player?.id === pId
    );

    // 3. Subs (In or Out)
    const sub = fixture.events.find(
      (e) =>
        e.type === "subst" && (e.player?.id === pId || e.assist?.id === pId)
    );

    return { goals, cards, sub };
  }, [fixture, player]);

  if (!player) return null;

  return (
    <Paper
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        width: 70, // Fixed width for consistency
        transition: "transform 0.2s",
        cursor: props.draggable ? "grab" : "default",
        "&:hover": { zIndex: 10, transform: "scale(1.05)" },
        // Order for flex container (formation rows)
        order: player?.grid?.split(":")[1],
      }}
      {...props} // Spread draggable props
    >
      {/* 1. PLAYER AVATAR */}
      <Box sx={{ position: "relative" }}>
        <Avatar
          src={player?.photo || playerData?.photo || missingPlayerImg}
          alt={player.name}
          sx={{
            width: 50,
            height: 50,
            border: `2px solid ${theme.palette.background.paper}`,
            boxShadow: `0 4px 8px rgba(0,0,0,0.3)`,
            bgcolor: "grey.800",
          }}
        />

        {/* Delete Button (Overlay) */}
        {onDelete && (
          <Box
            sx={{
              position: "absolute",
              top: -5,
              right: -5,
              bgcolor: "background.paper",
              borderRadius: "50%",
              boxShadow: 1,
            }}
          >
            <IconButton
              size="small"
              onClick={() => onDelete(player.id)}
              sx={{ p: 0.5 }}
            >
              <Delete fontSize="inherit" color="error" />
            </IconButton>
          </Box>
        )}
      </Box>

      {/* 2. PLAYER NAME */}
      {showPlayerName && (
        <Typography
          variant="caption"
          noWrap
          sx={{
            mt: 0.5,
            fontFamily: "Space Mono",
            fontSize: "0.65rem",
            fontWeight: "bold",
            textAlign: "center",
            width: "100%",
            bgcolor: "rgba(0,0,0,0.6)", // Dark pill background for readability on pitch
            color: "#fff",
            borderRadius: 4,
            px: 1,
            py: 0.2,
          }}
        >
          {playerData?.name || player.name}
        </Typography>
      )}

      {/* 3. EVENT INDICATORS (Goals, Cards, Subs) */}
      <Stack
        direction="row"
        spacing={0.5}
        justifyContent="center"
        sx={{ mt: 0.5, height: 16 }}
      >
        {/* Goals */}
        {events.goals.map((goal, i) => (
          <EventIcon key={`g-${i}`} type="goal" data={goal} />
        ))}

        {/* Cards */}
        {events.cards.map((card, i) => (
          <EventIcon key={`c-${i}`} type="card" data={card} />
        ))}

        {/* Subs */}
        {events.sub && (
          <EventIcon type="sub" data={events.sub} playerId={player.id} />
        )}
      </Stack>

      {/* 4. VOTING PERCENTAGE BAR */}
      {percentage !== undefined && (
        <Box sx={{ width: "100%", mt: 0.5, px: 0.5 }}>
          <Box
            sx={{
              height: 4,
              width: "100%",
              bgcolor: "rgba(255,255,255,0.2)",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                width: `${percentage}%`,
                height: "100%",
                bgcolor: groupColour,
              }}
            />
          </Box>
          <Typography
            variant="caption"
            sx={{
              fontSize: "0.6rem",
              color: "#fff",
              display: "block",
              textAlign: "center",
              lineHeight: 1,
              mt: 0.2,
              textShadow: "0 1px 2px #000",
            }}
          >
            {percentage.toFixed(0)}%
          </Typography>
        </Box>
      )}
    </Paper>
  );
}

// --- SUB-COMPONENT: EVENT ICONS ---
const EventIcon = ({ type, data, playerId }) => {
  let content = null;
  let tooltip = "";

  if (type === "goal") {
    tooltip = `Goal: ${data.time.elapsed}'`;
    content = (
      <SportsSoccer
        sx={{
          fontSize: 14,
          color: "#4EFF4E",
          filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.5))",
        }}
      />
    );
  } else if (type === "card") {
    const isYellow = data.detail === "Yellow Card";
    tooltip = `${data.detail}: ${data.time.elapsed}'`;
    content = (
      <Rectangle
        sx={{
          fontSize: 14,
          color: isYellow ? "#FFD700" : "#FF4500",
          transform: "rotate(90deg)", // Vertical card look
          filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.5))",
        }}
      />
    );
  } else if (type === "sub") {
    const isOut = data.player?.id === playerId;
    tooltip = isOut
      ? `Subbed OFF for ${data.assist.name} (${data.time.elapsed}')`
      : `Subbed IN for ${data.player.name} (${data.time.elapsed}')`;

    content = (
      <SwapVert
        sx={{
          fontSize: 16,
          color: isOut ? "#FF4500" : "#4EFF4E", // Red arrow for out, Green for in
          filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.5))",
        }}
      />
    );
  }

  return (
    <Tooltip title={tooltip} placement="top" TransitionComponent={Zoom}>
      <Box sx={{ cursor: "help", display: "flex", alignItems: "center" }}>
        {content}
      </Box>
    </Tooltip>
  );
};
