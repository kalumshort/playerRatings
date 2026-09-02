"use client";

import React, { useMemo } from "react";
import {
  Box,
  Typography,
  Avatar,
  Tooltip,
  IconButton,
  ButtonBase,
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
  WhatshotRounded,
  AcUnitRounded,
  SwapHorizRounded,
} from "@mui/icons-material";

import { HEAT_TIERS, tierColor, type PlayerHeat, type PlayerStance } from "@/lib/live/heat";

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

/**
 * The pip that says what YOU said, so the token shows state rather than only
 * accepting input. Without it the pitch looked identical before and after you
 * voted, and the only way to remember your stance was to reopen the modal.
 */
const StancePip = ({ stance }: { stance: PlayerStance }) => {
  const theme = useTheme();
  const { heat } = theme.palette;

  const mood = stance.mood ?? null;
  const wantsSub = Boolean(stance.subFor);
  if (!mood && !wantsSub) return null;

  const [bg, ink, Icon, label] = mood
    ? mood === "hot"
      ? [heat.hotSolid, "#fff", WhatshotRounded, "You called them on fire"]
      : [heat.coldSolid, "#fff", AcUnitRounded, "You called them frozen"]
    : [heat.subDemand, "#fff", SwapHorizRounded, "You asked for a sub"];

  return (
    <Tooltip title={label} arrow TransitionComponent={Zoom}>
      <Box
        sx={{
          position: "absolute",
          bottom: -3,
          left: -3,
          zIndex: 6,
          width: 20,
          height: 20,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          bgcolor: bg,
          color: ink,
          border: `2px solid ${theme.palette.background.paper}`,
          animation: `${popIn} 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)`,
        }}
      >
        <Icon sx={{ fontSize: 11 }} />
      </Box>
    </Tooltip>
  );
};

/**
 * The crowd's split on this player, as a bar rather than a number.
 *
 * Reuses the slot the old `percentage` prop drew in, because a fraction of a
 * fixed-width bar is the one comparison that works at this size — two counts
 * side by side are unreadable at 10px and invite arithmetic.
 */
const HeatBar = ({ heat }: { heat: PlayerHeat }) => {
  const theme = useTheme();
  const total = heat.support + heat.doubt;
  if (total === 0) return null;

  const hotPct = (heat.support / total) * 100;

  return (
    <Box
      aria-hidden
      sx={{
        width: "78%",
        height: 4,
        mt: 0.5,
        display: "flex",
        borderRadius: 2,
        overflow: "hidden",
        bgcolor: alpha(theme.palette.text.primary, 0.1),
      }}
    >
      <Box
        sx={{
          width: `${hotPct}%`,
          bgcolor: theme.palette.heat.hotSolid,
          transition: "width .45s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
      <Box
        sx={{
          flex: 1,
          bgcolor: theme.palette.heat.coldSolid,
        }}
      />
    </Box>
  );
};

/** What a screen reader is told about the crowd, since the ring is visual only. */
const verdictSentence = (heat?: PlayerHeat, stance?: PlayerStance) => {
  const parts: string[] = [];
  if (heat && heat.tier !== "neutral") {
    parts.push(`${HEAT_TIERS[heat.tier].label} — ${heat.support} for, ${heat.doubt} against`);
  }
  if (heat?.subDemanded) parts.push("the crowd want them substituted");
  if (stance?.mood) parts.push(`you said ${stance.mood}`);
  if (stance?.subFor) parts.push("you asked for a substitution");
  return parts.length ? `${parts.join(". ")}.` : "No crowd verdict yet.";
};

// --- MAIN COMPONENT ---
export default function LineupPlayer({
  player,
  fixture,
  onDelete,
  percentage,
  showPlayerName = true,
  /** Turns the token into a real button. Live matches only. */
  interactive = false,
  onClick,
  heat,
  stance,
  ...props
}: any) {
  const theme = useTheme();
  const groupColour = theme.palette.error.main;

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
    // player?.id, not player.id: dep arrays are evaluated on every render,
    // including the ones the guard below is there to handle.
  }, [fixture, player?.id]);

  if (!player) return null;

  const ring: string | null = heat ? tierColor(heat.tier, theme.palette.heat) : null;
  const glow = heat ? HEAT_TIERS[heat.tier].glow : 0;

  const content = (
    <>
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
            // The crowd's verdict reads on the player, not just on a badge
            // floating above them.
            border: ring ? `2.5px solid ${ring}` : "2px solid transparent",
            boxShadow: ring ? `0 0 ${Math.round(12 * glow)}px ${alpha(ring, 0.55)}` : "none",
            transition: "border-color .3s ease, box-shadow .3s ease",
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

        {stance && <StancePip stance={stance} />}

        {/* A nested <button> is invalid markup, so the delete affordance is
            never drawn on an interactive token. Only the predictor passes it. */}
        {onDelete && !interactive && (
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

      {heat && <HeatBar heat={heat} />}

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
    </>
  );

  // The read-only token, unchanged: the predictor, the share image and a
  // finished match all render this branch.
  if (!interactive) {
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
        {content}
      </Box>
    );
  }

  /**
   * The live token, which is a genuine button.
   *
   * Was a bare div with an onClick: no keyboard route in, no focus ring, no
   * role, and nothing on screen suggesting it did anything. The interaction
   * recipe below is the one PitchPlayer already uses on the predictor pitch —
   * the hover guard in particular, because a hover tint applied on tap sticks
   * on a touch device until you tap elsewhere.
   */
  // The surface only. clay.button ships its own `&:hover`, `&:active`,
  // `borderRadius` and `transition`, and spreading it wholesale meant its 8px
  // radius overrode the 14px set above it and its unguarded `:hover` fired on
  // touch — which is the exact sticky-highlight the guard below exists to stop.
  const {
    "&:hover": _clayHover,
    "&:active": _clayActive,
    borderRadius: _clayRadius,
    transition: _clayTransition,
    ...claySurface
  } = ((theme as any).clay?.button ?? {}) as Record<string, any>;

  return (
    <ButtonBase
      onClick={onClick}
      focusRipple={false}
      aria-label={`${player.name}. ${verdictSentence(heat, stance)} Activate to rate this player.`}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        width: 78,
        px: 0.5,
        pt: 0.75,
        pb: 1,
        // A raised surface with a real edge is what turns an avatar on grass
        // into something that looks pressable.
        ...claySurface,
        borderRadius: "14px",
        borderColor: ring ? alpha(ring, 0.55) : undefined,
        cursor: "pointer",
        transition:
          "transform .16s cubic-bezier(0.175, 0.885, 0.32, 1.275), background-color .15s ease, border-color .3s ease, box-shadow .3s ease",
        "@media (hover: hover)": {
          "&:hover": {
            zIndex: 10,
            transform: "translateY(-3px) scale(1.06)",
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
          },
        },
        "&:active": { transform: "scale(0.94)", filter: "brightness(0.96)" },
        "&:focus-visible": {
          outline: `2px solid ${theme.palette.primary.main}`,
          outlineOffset: 2,
        },
        "@media (prefers-reduced-motion: reduce)": {
          transition: "background-color .15s ease",
          "@media (hover: hover)": { "&:hover": { transform: "none" } },
          "&:active": { transform: "none" },
        },
        ...props.sx,
      }}
    >
      {content}
    </ButtonBase>
  );
}
