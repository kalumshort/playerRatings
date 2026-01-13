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
import {
  SportsSoccer,
  Delete,
  ArrowUpward,
  ArrowDownward,
} from "@mui/icons-material";

// --- HOOKS & SELECTORS ---
import { selectSquadPlayerById } from "../../../Selectors/squadDataSelectors";

import useGroupData from "../../../Hooks/useGroupsData";

// --- SUB-COMPONENT: EVENT BADGES (MATCHING STATUS-ICON STYLE) ---
const EventIcon = ({ type, data, playerId, count }) => {
  let content = null;
  let tooltip = "";
  let gradient = "";

  // Common Style for the Icon inside the badge
  const iconStyle = {
    fontSize: 14,
    color: "white",
    filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.2))",
  };

  if (type === "goal") {
    tooltip = `${count} Goal${count > 1 ? "s" : ""}`;
    gradient = "linear-gradient(135deg, #66bb6a, #2e7d32)"; // Green Gradient
    content = (
      <>
        <SportsSoccer sx={iconStyle} />
        {count > 1 && <span className="event-count-badge">{count}</span>}
      </>
    );
  } else if (type === "card") {
    const isYellow = data.detail === "Yellow Card";
    tooltip = `${data.detail} (${data.time.elapsed}')`;
    gradient = isYellow
      ? "linear-gradient(135deg, #fdd835, #fbc02d)" // Yellow/Gold
      : "linear-gradient(135deg, #ef5350, #c62828)"; // Red

    // Using a simple rectangle shape using CSS or Icon
    content = (
      <Box
        sx={{
          width: 10,
          height: 14,
          bgcolor: "white",
          borderRadius: "2px",
          boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
        }}
      />
    );
  } else if (type === "sub") {
    const isOut = data.player?.id === playerId;
    tooltip = isOut
      ? `Subbed OFF (${data.time.elapsed}')`
      : `Subbed IN (${data.time.elapsed}')`;

    // Sub Out = Orange/Red, Sub In = Blue/Green?
    // Let's use Grey/Blue for generic sub info to not confuse with "Hot/Cold"
    gradient = isOut
      ? "linear-gradient(135deg, #ff7043, #d84315)" // Deep Orange (Out)
      : "linear-gradient(135deg, #42a5f5, #1565c0)"; // Blue (In)

    content = isOut ? (
      <ArrowDownward sx={iconStyle} />
    ) : (
      <ArrowUpward sx={iconStyle} />
    );
  }

  return (
    <Tooltip title={tooltip} placement="top" TransitionComponent={Zoom} arrow>
      <Box className="event-badge" sx={{ background: gradient }}>
        {content}
      </Box>
    </Tooltip>
  );
};

export default function LineupPlayer({
  player,
  fixture,
  onDelete,
  percentage,
  showPlayerName = true,
  ...props
}) {
  const theme = useTheme();

  const playerData = useSelector((state) =>
    selectSquadPlayerById(player?.id)(state)
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
      {/* CSS Styles injected here for encapsulation */}
      <style>
        {`
          .event-badge {
            width: 22px; /* Slightly smaller than Status Icon (26px) for hierarchy */
            height: 22px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 3px 5px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          }

          .event-count-badge {
            position: absolute;
            top: -4px;
            right: -4px;
            background: black;
            color: white;
            font-size: 9px;
            font-weight: bold;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid white;
          }

          @keyframes popIn {
            from { transform: scale(0); }
            to { transform: scale(1); }
          }
        `}
      </style>

      {/* --- AVATAR CONTAINER --- */}
      <Box sx={{ position: "relative", width: 60, height: 70 }}>
        <Avatar
          src={
            player?.photo ||
            playerData?.photo ||
            `https://media.api-sports.io/football/players/${player.id}.png`
          }
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
          <Box sx={{ position: "absolute", top: -8, right: -8, zIndex: 5 }}>
            <EventIcon
              type="goal"
              count={events.goals.length}
              data={events.goals}
            />
          </Box>
        )}

        {/* 2. CARDS (Top Left) */}
        {events.cards.length > 0 && (
          <Box sx={{ position: "absolute", top: -8, left: -8, zIndex: 5 }}>
            {events.cards.map((card, i) => (
              <Box key={i} sx={{ mb: -1.5 }}>
                {" "}
                {/* Stack multiple cards slightly */}
                <EventIcon type="card" data={card} />
              </Box>
            ))}
          </Box>
        )}

        {/* 3. SUBS (Bottom Right) */}
        {events.sub && (
          <Box sx={{ position: "absolute", bottom: -5, right: -5, zIndex: 5 }}>
            <EventIcon type="sub" data={events.sub} playerId={player.id} />
          </Box>
        )}

        {/* 4. DELETE BUTTON (Bottom Left) */}
        {onDelete && (
          <Box sx={{ position: "absolute", bottom: -5, left: -5, zIndex: 6 }}>
            <IconButton
              size="small"
              onClick={() => onDelete(player.id)}
              sx={{
                width: 22,
                height: 22,
                bgcolor: "background.paper",
                boxShadow: 2,
                border: "1px solid #eee",
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
            mt: 1, // Increased margin to clear badges
            textAlign: "center",
            width: "100%",
            maxWidth: 72,
            px: 0.5,
            lineHeight: 1.1,
            textShadow: "0 1px 2px rgba(0,0,0,0.8)", // Shadow for better visibility on pitch
            fontWeight: 500,
            color: "white",
          }}
        >
          {playerData?.name || player.name}
        </Typography>
      )}

      {/* --- PERCENTAGE BAR --- */}
      {percentage !== undefined && (
        <Box sx={{ width: "100%", mt: 0.5, px: 0.5 }}>
          <Box
            sx={{
              height: 4,
              width: "100%",
              bgcolor: "rgba(0,0,0,0.5)",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                width: `${percentage}%`,
                height: "100%",
                bgcolor: groupColour,
                borderRadius: 2,
                transition: "width 0.5s ease-out",
              }}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
}
