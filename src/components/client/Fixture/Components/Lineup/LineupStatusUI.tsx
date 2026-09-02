"use client";

import React from "react";
import {
  Whatshot,
  AcUnit,
  ArrowDownward,
  InfoOutlined,
  Close,
} from "@mui/icons-material";
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  alpha,
  useTheme,
} from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";

import {
  HEAT_TIERS,
  tierColor,
  tierGradient,
  type HeatTier,
  type PlayerHeat,
} from "@/lib/live/heat";

const CHIP = 24;

/** Icon per tier direction. Colour is never the only signal. */
const tierIcon = (tier: HeatTier) => {
  const dir = HEAT_TIERS[tier].direction;
  if (dir === "hot") return <Whatshot sx={{ fontSize: 14 }} />;
  if (dir === "cold") return <AcUnit sx={{ fontSize: 14 }} />;
  return null;
};

/**
 * The cluster of live-status chips that sits above a player's head.
 *
 * Two independent signals, side by side rather than one winning: how the crowd
 * rates a player and whether they want them off are different questions, and
 * the old priority chain hid the first behind the second — a player the crowd
 * loved but wanted rested read as purely negative.
 */
export const StatusBadge = ({
  heat,
  visible,
}: {
  heat?: PlayerHeat;
  visible: boolean;
}) => {
  const showTier = Boolean(heat && heat.tier !== "neutral");
  const showSub = Boolean(heat && heat.subOut > 0);

  if (!visible || !heat || (!showTier && !showSub)) return null;

  return (
    <Box
      sx={{
        position: "absolute",
        top: -14,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: 0.4,
        zIndex: 10,
        pointerEvents: "none",
      }}
    >
      {showTier && <TierChip heat={heat} />}
      {showSub && <SubPressureChip heat={heat} />}
    </Box>
  );
};

const TierChip = ({ heat }: { heat: PlayerHeat }) => {
  const theme = useTheme();
  const reduce = useReducedMotion();
  const spec = HEAT_TIERS[heat.tier];
  const solid = tierColor(heat.tier, theme.palette.heat);

  const title = `${spec.label} — ${heat.support} of ${Math.max(
    heat.engaged,
    1,
  )} fans rate them, ${heat.doubt} don't`;

  return (
    <Tooltip title={title} arrow>
      <Box
        component={motion.div}
        // The badge earns its place by appearing, so it arrives with a pop
        // rather than materialising. A tier change re-runs it.
        key={heat.tier}
        initial={reduce ? false : { scale: 0, opacity: 0 }}
        animate={
          reduce
            ? { scale: 1, opacity: 1 }
            : {
                scale: [1, 1.12, 1],
                opacity: 1,
              }
        }
        transition={
          reduce
            ? { duration: 0 }
            : {
                scale: {
                  // Intensity is legible from across the room: an inferno
                  // badge breathes noticeably faster than a warm one.
                  duration: spec.pulseSeconds,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
                opacity: { duration: 0.25 },
              }
        }
        sx={{
          width: CHIP,
          height: CHIP,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          color: theme.palette.common.white,
          background: tierGradient(heat.tier, theme.palette.heat),
          border: `2px solid ${theme.palette.background.paper}`,
          boxShadow: solid
            ? `0 0 ${Math.round(10 * spec.glow)}px ${alpha(solid, 0.75 * spec.glow)}`
            : "none",
        }}
      >
        {tierIcon(heat.tier)}
      </Box>
    </Tooltip>
  );
};

/**
 * Sub demand as a filling ring rather than a boolean arrow.
 *
 * The old badge appeared the instant a third fan asked and said nothing before
 * or after, so mounting pressure was invisible right up until it wasn't. A
 * conic sweep shows the crowd gathering.
 */
const SubPressureChip = ({ heat }: { heat: PlayerHeat }) => {
  const theme = useTheme();
  const reduce = useReducedMotion();
  const { subDemand, subDemandTint } = theme.palette.heat;
  const pct = Math.round(heat.subPressure * 100);

  const title = heat.subDemanded
    ? `The crowd want them off — ${heat.subOut} of ${Math.max(heat.engaged, 1)} fans`
    : `${heat.subOut} want them off — ${heat.subRemaining} more to force the call`;

  return (
    <Tooltip title={title} arrow>
      <Box
        component={motion.div}
        initial={reduce ? false : { scale: 0, opacity: 0 }}
        animate={
          reduce || !heat.subDemanded
            ? { scale: 1, opacity: 1 }
            : { scale: [1, 1.14, 1], opacity: 1 }
        }
        transition={
          reduce || !heat.subDemanded
            ? { duration: 0.2 }
            : { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
        }
        sx={{
          width: CHIP,
          height: CHIP,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          border: `2px solid ${theme.palette.background.paper}`,
          // The sweep is the track; the disc below it keeps the glyph readable
          // over whatever fraction has filled.
          background: `conic-gradient(${subDemand} 0% ${pct}%, ${alpha(
            subDemand,
            0.18,
          )} ${pct}% 100%)`,
          boxShadow: heat.subDemanded
            ? `0 0 10px ${alpha(subDemand, 0.7)}`
            : "none",
        }}
      >
        <Box
          sx={{
            width: CHIP - 8,
            height: CHIP - 8,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            bgcolor: heat.subDemanded ? subDemand : subDemandTint,
            color: heat.subDemanded
              ? theme.palette.common.white
              : theme.palette.heat.subDemandInk,
          }}
        >
          <ArrowDownward sx={{ fontSize: 11 }} />
        </Box>
      </Box>
    </Tooltip>
  );
};

/** Collapsible key for the badges above. */
export const StatusLegend = ({
  open,
  setOpen,
  active,
}: {
  open: boolean;
  setOpen: (next: boolean) => void;
  active: boolean;
}) => {
  const theme = useTheme();

  if (!active) return <Box />;

  if (!open)
    return (
      <Paper
        variant="pill"
        component="button"
        onClick={() => setOpen(true)}
        aria-label="Show the live status key"
        sx={{
          px: 1.5,
          py: 0.5,
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          border: "none",
          font: "inherit",
        }}
      >
        {/* Was common.white on a `pill` Paper, which is #FFFFFF in light mode. */}
        <InfoOutlined sx={{ color: "text.secondary", fontSize: 16, mr: 0.5 }} />
        <Typography variant="caption" sx={{ color: "text.primary" }}>
          KEY
        </Typography>
      </Paper>
    );

  return (
    <Paper variant="sm" sx={{ p: 2, minWidth: 200 }}>
      <Stack direction="row" justifyContent="space-between" mb={1}>
        <Typography variant="caption" fontWeight={900}>
          STATUS KEY
        </Typography>
        <IconButton
          size="small"
          onClick={() => setOpen(false)}
          aria-label="Close"
        >
          <Close fontSize="small" />
        </IconButton>
      </Stack>

      {/* Driven by HEAT_TIERS so the key cannot describe tiers the pitch no
          longer draws. Hottest first, then coldest, then the sub demand. */}
      {(["inferno", "onfire", "warm", "chilly", "frozen"] as HeatTier[]).map(
        (tier) => (
          <LegendRow
            key={tier}
            icon={tierIcon(tier)}
            label={HEAT_TIERS[tier].label}
            hint={HEAT_TIERS[tier].hint}
            background={tierGradient(tier, theme.palette.heat)}
          />
        ),
      )}
      <LegendRow
        icon={<ArrowDownward sx={{ fontSize: 12 }} />}
        label="Fans want them off"
        hint="The ring fills as the crowd turns"
        background={theme.palette.heat.subDemand}
      />
    </Paper>
  );
};

const LegendRow = ({
  icon,
  label,
  hint,
  background,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  background: string;
}) => (
  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
    <Box
      sx={{
        width: 20,
        height: 20,
        flexShrink: 0,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        color: "common.white",
        background,
      }}
    >
      {icon}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" fontWeight={800} display="block">
        {label}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block">
        {hint}
      </Typography>
    </Box>
  </Stack>
);
