import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import {
  Box,
  Typography,
  Avatar,
  Tooltip,
  IconButton,
  Zoom,
} from "@mui/material";
import {
  SportsSoccerRounded,
  DeleteRounded,
  ArrowUpwardRounded,
  ArrowDownwardRounded,
} from "@mui/icons-material";

// --- HOOKS ---
import { selectSquadPlayerById } from "../../../Selectors/squadDataSelectors";
import useGroupData from "../../../Hooks/useGroupsData";

// --- SUB-COMPONENT: EVENT BADGES (Floating Orbs) ---
const EventIcon = ({ type, data, playerId, count }) => {
  let content = null;
  let tooltip = "";
  let gradient = "";
  let borderColor = "transparent";

  const iconStyle = {
    fontSize: 12,
    color: "white",
    filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.3))",
  };

  if (type === "goal") {
    tooltip = `${count} Goal${count > 1 ? "s" : ""}`;
    gradient = "linear-gradient(135deg, #66bb6a, #2e7d32)"; // Green
    borderColor = "#1b5e20";
    content = (
      <>
        <SportsSoccerRounded sx={iconStyle} />
        {count > 1 && <span className="event-count-badge">{count}</span>}
      </>
    );
  } else if (type === "card") {
    const isYellow = data.detail === "Yellow Card";
    tooltip = `${data.detail} (${data.time.elapsed}')`;

    // Cards look like literal mini cards now
    return (
      <Tooltip title={tooltip} placement="top" TransitionComponent={Zoom} arrow>
        <Box
          sx={{
            width: 14,
            height: 18,
            bgcolor: isYellow ? "#FFEB3B" : "#F44336",
            borderRadius: "2px",
            border: "1px solid rgba(0,0,0,0.1)",
            boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
            transform: "rotate(-5deg)",
            "&:hover": { transform: "rotate(0deg) scale(1.2)" },
            transition: "transform 0.2s",
          }}
        />
      </Tooltip>
    );
  } else if (type === "sub") {
    const isOut = data.player?.id === playerId;
    tooltip = isOut
      ? `Subbed OFF (${data.time.elapsed}')`
      : `Subbed IN (${data.time.elapsed}')`;

    gradient = isOut
      ? "linear-gradient(135deg, #ff7043, #d84315)" // Orange
      : "linear-gradient(135deg, #42a5f5, #1565c0)"; // Blue
    borderColor = isOut ? "#bf360c" : "#0d47a1";

    content = isOut ? (
      <ArrowDownwardRounded sx={iconStyle} />
    ) : (
      <ArrowUpwardRounded sx={iconStyle} />
    );
  }

  return (
    <Tooltip title={tooltip} placement="top" TransitionComponent={Zoom} arrow>
      <Box
        className="event-badge"
        sx={{
          background: gradient,
          border: `1px solid ${borderColor}`,
        }}
      >
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
  const playerData = useSelector((state) =>
    selectSquadPlayerById(player?.id)(state),
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
            (e.detail === "Penalty" && e.comments !== "Penalty Shootout")),
      ),
      cards: fixture.events.filter(
        (e) => e.type === "Card" && e.player?.id === pId,
      ),
      sub: fixture.events.find(
        (e) =>
          e.type === "subst" && (e.player?.id === pId || e.assist?.id === pId),
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
        transition: "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": { zIndex: 10, transform: "scale(1.1)" },
        order: player?.grid?.split(":")[1],
      }}
      {...props}
    >
      <style>
        {`
          .event-badge {
            width: 20px; 
            height: 20px;
            border-radius: 50%;
            boxShadow: 0 4px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          }

          .event-count-badge {
            position: absolute;
            top: -5px;
            right: -5px;
            background: #212121;
            color: white;
            font-size: 8px;
            font-weight: 900;
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
      <Box sx={{ position: "relative", width: 64, height: 64 }}>
        <Avatar
          src={
            player?.photo ||
            playerData?.photo ||
            `https://media.api-sports.io/football/players/${player.id}.png`
          }
          alt={player.name}
          sx={(theme) => ({
            width: "100%",
            height: "100%",
            // Clay Sphere Look
            border: `3px solid ${theme.palette.background.paper}`,
            boxShadow: "0 8px 16px rgba(0,0,0,0.3)",
            bgcolor: "grey.800",
          })}
        />

        {/* 1. GOALS (Top Right) */}
        {events.goals.length > 0 && (
          <Box sx={{ position: "absolute", top: -4, right: -4, zIndex: 5 }}>
            <EventIcon
              type="goal"
              count={events.goals.length}
              data={events.goals}
            />
          </Box>
        )}

        {/* 2. CARDS (Top Left) */}
        {events.cards.length > 0 && (
          <Box
            sx={{
              position: "absolute",
              top: -4,
              left: -4,
              zIndex: 5,
              display: "flex",
              gap: 0.5,
            }}
          >
            {events.cards.map((card, i) => (
              <EventIcon key={i} type="card" data={card} />
            ))}
          </Box>
        )}

        {/* 3. SUBS (Bottom Right) */}
        {events.sub && (
          <Box sx={{ position: "absolute", bottom: -2, right: -2, zIndex: 5 }}>
            <EventIcon type="sub" data={events.sub} playerId={player.id} />
          </Box>
        )}

        {/* 4. DELETE BUTTON (Bottom Left - Pressed Clay) */}
        {onDelete && (
          <Box sx={{ position: "absolute", bottom: -2, left: -2, zIndex: 6 }}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(player.id);
              }}
              sx={{
                width: 24,
                height: 24,
                bgcolor: "background.paper",
                boxShadow: "inset 0 1px 3px rgba(0,0,0,0.2)", // Pressed In look
                border: "1px solid rgba(0,0,0,0.1)",
                "&:hover": { bgcolor: "error.main", color: "white" },
              }}
            >
              <DeleteRounded sx={{ fontSize: 14 }} color="error" />
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
            mt: 1.5,
            textAlign: "center",
            width: "100%",
            maxWidth: 80,
            px: 0.5,
            lineHeight: 1.1,
            // Text Shadow to ensure readability on grass
            textShadow: "0 2px 4px rgba(0,0,0,0.9)",
            fontWeight: 700,
            color: "white",
            fontSize: "0.75rem",
            letterSpacing: 0.3,
          }}
        >
          {playerData?.name || player.name}
        </Typography>
      )}

      {/* --- PERCENTAGE BAR --- */}
      {percentage !== undefined && (
        <Box
          sx={{
            width: "100%",
            mt: 0.5,
            px: 0.5,
            // Glassy background for the bar track
            bgcolor: "rgba(0,0,0,0.3)",
            borderRadius: 4,
            p: "2px",
          }}
        >
          <Box
            sx={{
              height: 4,
              width: "100%",
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
                boxShadow: `0 0 6px ${groupColour}`, // Neon glow
                transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
}
