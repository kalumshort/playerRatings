import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import {
  Box,
  Typography,
  Avatar,
  Tooltip,
  IconButton,
  useTheme,
  Zoom,
} from "@mui/material";
import { SportsSoccer, SwapVert, Delete, Rectangle } from "@mui/icons-material";

// --- HOOKS & SELECTORS ---
import { selectSquadPlayerById } from "../../../Selectors/squadDataSelectors";
import { missingPlayerImg } from "../../../Hooks/Helper_Functions";
import useGroupData from "../../../Hooks/useGroupsData";
import { useParams } from "react-router-dom";

export default function LineupPlayer({
  player,
  fixture,
  onDelete,
  percentage,
  showPlayerName = true,
  ...props
}) {
  const theme = useTheme();
  const { clubSlug } = useParams();
  const playerData = useSelector((state) =>
    selectSquadPlayerById(player?.id, clubSlug)(state)
  );
  const { activeGroup } = useGroupData();
  const groupColour = activeGroup?.accentColor || "#DA291C";

  // --- EVENT LOGIC ---
  const events = useMemo(() => {
    if (!fixture?.events || !player?.id)
      return { goals: [], cards: [], sub: null };
    const pId = player.id;

    return {
      goals: fixture.events.filter(
        (e) =>
          e.player?.id === pId &&
          (e.detail === "Normal Goal" ||
            (e.detail === "Penalty" && e.comments !== "Penalty Shootout"))
      ),
      cards: fixture.events.filter(
        (e) => e.type === "Card" && e.player?.id === pId
      ),
      sub: fixture.events.find(
        (e) =>
          e.type === "subst" && (e.player?.id === pId || e.assist?.id === pId)
      ),
    };
  }, [fixture, player]);

  if (!player) return null;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        width: 70,
        cursor: props.draggable ? "grab" : "default",
        transition: "transform 0.2s",
        "&:hover": { zIndex: 10, transform: "scale(1.1)" },
        order: player?.grid?.split(":")[1],
      }}
      {...props}
    >
      {/* --- AVATAR CONTAINER WITH ABSOLUTE BADGES --- */}
      <Box sx={{ position: "relative", width: 50, height: 50 }}>
        <Avatar
          src={player?.photo || playerData?.photo || missingPlayerImg}
          alt={player.name}
          sx={{
            width: "100%",
            height: "100%",
            border: `2px solid ${theme.palette.background.paper}`,
            boxShadow: `0 4px 8px rgba(0,0,0,0.4)`,
            bgcolor: "grey.800",
          }}
        />

        {/* 1. GOALS (Top Right) */}
        {events.goals.length > 0 && (
          <Box sx={{ position: "absolute", top: -5, right: -5, zIndex: 2 }}>
            <EventIcon
              type="goal"
              count={events.goals.length}
              data={events.goals}
            />
          </Box>
        )}

        {/* 2. CARDS (Top Left) */}
        {events.cards.length > 0 && (
          <Box sx={{ position: "absolute", top: -5, left: -5, zIndex: 2 }}>
            {events.cards.map((card, i) => (
              <EventIcon key={i} type="card" data={card} />
            ))}
          </Box>
        )}

        {/* 3. SUBS (Bottom Right) */}
        {events.sub && (
          <Box sx={{ position: "absolute", bottom: -2, right: -2, zIndex: 2 }}>
            <EventIcon type="sub" data={events.sub} playerId={player.id} />
          </Box>
        )}

        {/* 4. DELETE (Bottom Left - Only if dragging allowed) */}
        {onDelete && (
          <Box sx={{ position: "absolute", bottom: -5, left: -5, zIndex: 3 }}>
            <IconButton
              size="small"
              onClick={() => onDelete(player.id)}
              sx={{
                bgcolor: "background.paper",
                p: 0.2,
                boxShadow: 2,
                "&:hover": { bgcolor: "error.main", color: "white" },
              }}
            >
              <Delete sx={{ fontSize: 12 }} color="error" />
            </IconButton>
          </Box>
        )}
      </Box>

      {/* --- PLAYER NAME --- */}
      {showPlayerName && (
        <Typography
          variant="caption"
          noWrap
          sx={{
            mt: 0.5,
            textAlign: "center",
            width: "100%",
            maxWidth: 68,

            px: 0.5,
            py: 0.1,
            lineHeight: 1.1,
          }}
        >
          {playerData?.name || player.name}
        </Typography>
      )}

      {/* --- PERCENTAGE BAR --- */}
      {percentage !== undefined && (
        <Box sx={{ width: "100%", mt: 0.2, px: 1 }}>
          <Box
            sx={{
              height: 3,
              width: "100%",
              bgcolor: "rgba(255,255,255,0.2)",
              borderRadius: 1,
            }}
          >
            <Box
              sx={{
                width: `${percentage}%`,
                height: "100%",
                bgcolor: groupColour,
                borderRadius: 1,
              }}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
}

// --- SUB-COMPONENT: EVENT BADGES ---
const EventIcon = ({ type, data, playerId, count }) => {
  let content = null;
  let tooltip = "";

  const badgeStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 16,
    height: 16,
    borderRadius: "50%",
    bgcolor: "background.paper",
    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
  };

  if (type === "goal") {
    tooltip = `${count} Goal${count > 1 ? "s" : ""}`;
    content = (
      <Box sx={{ ...badgeStyle, bgcolor: "transparent", boxShadow: "none" }}>
        <SportsSoccer
          sx={{
            fontSize: 16,
            color: "#4EFF4E",
            filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.8))",
          }}
        />
        {count > 1 && (
          <Typography
            sx={{
              position: "absolute",
              bottom: -4,
              right: -4,
              fontSize: "0.6rem",
              fontWeight: "bold",
              color: "white",
              bgcolor: "black",
              borderRadius: "50%",
              width: 12,
              height: 12,
              textAlign: "center",
              lineHeight: "12px",
            }}
          >
            {count}
          </Typography>
        )}
      </Box>
    );
  } else if (type === "card") {
    const isYellow = data.detail === "Yellow Card";
    tooltip = `${data.detail} (${data.time.elapsed}')`;
    content = (
      <Rectangle
        sx={{
          fontSize: 12,
          color: isYellow ? "#FFD700" : "#FF4500",
          transform: "rotate(90deg)",
          filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.5))",
        }}
      />
    );
  } else if (type === "sub") {
    const isOut = data.player?.id === playerId;
    tooltip = isOut
      ? `Subbed OFF (${data.time.elapsed}')`
      : `Subbed IN (${data.time.elapsed}')`;
    content = (
      <Box sx={{ ...badgeStyle }}>
        <SwapVert sx={{ fontSize: 14, color: isOut ? "#FF4500" : "#4EFF4E" }} />
      </Box>
    );
  }

  return (
    <Tooltip title={tooltip} placement="top" TransitionComponent={Zoom} arrow>
      <Box sx={{ cursor: "help" }}>{content}</Box>
    </Tooltip>
  );
};
