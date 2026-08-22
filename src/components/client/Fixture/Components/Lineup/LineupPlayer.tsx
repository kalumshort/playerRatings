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
  alpha,
  useTheme,
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
})<{ bg: string }>(({ bg, theme }) => ({
  width: 22,
  height: 22,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
  background: bg,
  border: `1.5px solid ${theme.palette.background.paper}`,
  animation: `${popIn} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)`,
}));

const CountBadge = styled("span")(({ theme }) => ({
  position: "absolute",
  top: -6,
  right: -6,
  background: theme.palette.text.primary,
  color: theme.palette.background.paper,
  fontSize: "8px",
  fontWeight: 900,
  width: 14,
  height: 14,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: `1px solid ${theme.palette.background.paper}`,
}));

// --- SUB-COMPONENT: EVENT BADGES ---
const EventBadge = ({ type, data, playerId, count }: any) => {
  const theme = useTheme();
  const iconStyle = { fontSize: 13, color: theme.palette.background.paper };

  if (type === "goal") {
    return (
      <Tooltip
        title={`${count} Goal${count > 1 ? "s" : ""}`}
        arrow
        TransitionComponent={Zoom}
      >
        <BadgeRoot bg={theme.palette.form.good}>
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
            bgcolor: isYellow ? "cards.yellow" : "cards.red",
            borderRadius: "2px",
            transform: "rotate(-5deg)",
            animation: `${popIn} 0.3s ease`,
          }}
        />
      </Tooltip>
    );
  }

  if (type === "sub") {
    const isOut = data.player?.id === playerId;
    const bg = isOut ? theme.palette.form.poor : theme.palette.form.inForm;

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
  const theme = useTheme();
  // 1. SELECTORS
  const squadData = useSelector(
    (state: RootState) => state.teamSquads.byClubId,
  ); // Assuming path
  const groupColour = theme.palette.error.main; // Should ideally come from props or a group selector

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
          sx={{
            width: "100%",
            height: "100%",
            // background.default, not grey.900: the api-sports player PNGs are
            // cut-outs, so this colour shows through and needs to follow the
            // mode. grey.900 (#212121) was a dark slab behind every player in
            // light mode. Matches PitchPlayer's `.pitch-avatar`.
            bgcolor: "background.default",
            // Keeps MUI's fallback glyph visible — it defaults to
            // background.default, which is now the background too.
            color: "text.secondary",
          }}
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
            aria-label="Remove player from lineup"
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
              "&:hover": {
                bgcolor: "error.main",
                color: "background.paper",
              },
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
            // Was common.white + a black shadow, which assumed a dark pitch.
            // Lineup.tsx renders this on a plain Paper, so in light mode the
            // names were white on white and only the shadow made them legible.
            color: "text.primary",
            textShadow:
              theme.palette.mode === "dark"
                ? "none"
                : `0 1px 1px ${alpha(theme.palette.common.white, 0.8)}`,
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
            bgcolor: alpha(theme.palette.common.black, 0.5),
            p: "2px",
          }}
        >
          <Box
            sx={{
              height: 4,
              width: "100%",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                width: `${percentage}%`,
                height: "100%",
                bgcolor: groupColour,
                transition: "width 0.8s ease-in-out",
              }}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
}
