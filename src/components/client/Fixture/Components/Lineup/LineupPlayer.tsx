"use client";

import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import {
  Box,
  Typography,
  Avatar,
  Tooltip,
  IconButton,
  Zoom,
  styled,
  keyframes,
} from "@mui/material";
import {
  SportsSoccerRounded,
  DeleteRounded,
  ArrowUpwardRounded,
  ArrowDownwardRounded,
} from "@mui/icons-material";

// --- CLEAN IMPORTS ---
import { RootState } from "@/lib/redux/store";

// --- ANIMATIONS ---
const popIn = keyframes`
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
`;

// --- STYLED COMPONENTS ---
const BadgeRoot = styled(Box, {
  shouldForwardProp: (prop) => prop !== "bg",
})<{ bg: string }>(({ bg }) => ({
  width: 22,
  height: 22,
  borderRadius: "50%",
  boxShadow: "0 4px 8px rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
  background: bg,
  border: "1.5px solid white",
  animation: `${popIn} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)`,
}));

const CountBadge = styled("span")({
  position: "absolute",
  top: -6,
  right: -6,
  background: "#121212",
  color: "white",
  fontSize: "8px",
  fontWeight: 900,
  width: 14,
  height: 14,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid white",
});

// --- SUB-COMPONENT: EVENT BADGES ---
const EventBadge = ({ type, data, playerId, count }: any) => {
  const iconStyle = { fontSize: 13, color: "white" };

  if (type === "goal") {
    return (
      <Tooltip
        title={`${count} Goal${count > 1 ? "s" : ""}`}
        arrow
        TransitionComponent={Zoom}
      >
        <BadgeRoot bg="linear-gradient(135deg, #66bb6a, #1b5e20)">
          <SportsSoccerRounded sx={iconStyle} />
          {count > 1 && <CountBadge>{count}</CountBadge>}
        </BadgeRoot>
      </Tooltip>
    );
  }

  if (type === "card") {
    const isYellow = data.detail.includes("Yellow");
    return (
      <Tooltip
        title={`${data.detail} (${data.time.elapsed}')`}
        arrow
        TransitionComponent={Zoom}
      >
        <Box
          sx={{
            width: 14,
            height: 19,
            bgcolor: isYellow ? "#FFEB3B" : "#F44336",
            borderRadius: "2px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
            transform: "rotate(-5deg)",
            border: "0.5px solid rgba(0,0,0,0.2)",
            animation: `${popIn} 0.3s ease`,
          }}
        />
      </Tooltip>
    );
  }

  if (type === "sub") {
    const isOut = data.player?.id === playerId;
    const bg = isOut
      ? "linear-gradient(135deg, #ff7043, #bf360c)"
      : "linear-gradient(135deg, #42a5f5, #0d47a1)";

    return (
      <Tooltip
        title={isOut ? "Subbed OFF" : "Subbed IN"}
        arrow
        TransitionComponent={Zoom}
      >
        <BadgeRoot bg={bg}>
          {isOut ? (
            <ArrowDownwardRounded sx={iconStyle} />
          ) : (
            <ArrowUpwardRounded sx={iconStyle} />
          )}
        </BadgeRoot>
      </Tooltip>
    );
  }
  return null;
};

// --- MAIN COMPONENT ---
export default function LineupPlayer({
  player,
  fixture,
  onDelete,
  percentage,
  showPlayerName = true,
  groupId,
  ...props
}: any) {
  // 1. SELECTORS
  const squadData = useSelector(
    (state: RootState) => state.teamSquads.byClubId,
  ); // Assuming path
  const groupColour = "#DA291C"; // This should ideally come from props or a group selector

  // 2. EVENT LOGIC
  const events = useMemo(() => {
    if (!fixture?.events || !player?.id)
      return { goals: [], cards: [], sub: null };
    const pId = player.id;

    return {
      goals: fixture.events.filter(
        (e: any) =>
          e.player?.id === pId &&
          e.type === "Goal" &&
          e.detail !== "Missed Penalty",
      ),
      cards: fixture.events.filter(
        (e: any) => e.type === "Card" && e.player?.id === pId,
      ),
      sub: fixture.events.find(
        (e: any) =>
          e.type === "subst" && (e.player?.id === pId || e.assist?.id === pId),
      ),
    };
  }, [fixture, player.id]);

  if (!player) return null;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        width: 75,
        transition: "transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        "&:hover": { zIndex: 10, transform: "scale(1.15)" },
        ...props.sx,
      }}
    >
      {/* AVATAR CONTAINER */}
      <Box sx={{ position: "relative", width: 62, height: 62 }}>
        <Avatar
          src={
            player.photo ||
            `https://media.api-sports.io/football/players/${player.id}.png`
          }
          sx={(theme) => ({
            width: "100%",
            height: "100%",
            border: `3px solid ${theme.palette.background.paper}`,
            boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
            bgcolor: "grey.900",
          })}
        />

        {/* OVERLAYS */}
        <Box sx={{ position: "absolute", top: -5, right: -5, zIndex: 5 }}>
          {events.goals.length > 0 && (
            <EventBadge
              type="goal"
              count={events.goals.length}
              data={events.goals}
            />
          )}
        </Box>

        <Box
          sx={{
            position: "absolute",
            top: -5,
            left: -5,
            zIndex: 5,
            display: "flex",
            gap: 0.3,
          }}
        >
          {events.cards.map((card: any, i: number) => (
            <EventBadge key={i} type="card" data={card} />
          ))}
        </Box>

        {events.sub && (
          <Box sx={{ position: "absolute", bottom: -2, right: -2, zIndex: 5 }}>
            <EventBadge type="sub" data={events.sub} playerId={player.id} />
          </Box>
        )}

        {onDelete && (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(player.id);
            }}
            sx={{
              position: "absolute",
              bottom: -5,
              left: -5,
              zIndex: 6,
              width: 26,
              height: 26,
              bgcolor: "background.paper",
              boxShadow: "inset 0 1px 4px rgba(0,0,0,0.3)",
              border: "1px solid rgba(0,0,0,0.1)",
              "&:hover": { bgcolor: "error.main", color: "white" },
            }}
          >
            <DeleteRounded sx={{ fontSize: 14 }} color="error" />
          </IconButton>
        )}
      </Box>

      {/* PLAYER NAME */}
      {showPlayerName && (
        <Typography
          variant="caption"
          noWrap
          sx={{
            mt: 1,
            fontWeight: 900,
            fontSize: "0.7rem",
            color: "white",
            textShadow: "0 1px 3px rgba(0,0,0,0.8)",
            textAlign: "center",
            width: "100%",
          }}
        >
          {player.name.split(" ").pop()?.toUpperCase()}
        </Typography>
      )}

      {/* PERCENTAGE BAR */}
      {percentage !== undefined && (
        <Box
          sx={{
            width: "80%",
            mt: 0.5,
            bgcolor: "rgba(0,0,0,0.5)",
            borderRadius: 4,
            p: "2px",
            border: "1px solid rgba(255,255,255,0.1)",
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
                boxShadow: `0 0 8px ${groupColour}`,
                transition: "width 0.8s ease-in-out",
              }}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
}
