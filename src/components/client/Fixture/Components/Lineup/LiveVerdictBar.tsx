"use client";

import React, { useMemo } from "react";
import { Box, Stack, Typography, alpha, useTheme } from "@mui/material";
import {
  WhatshotRounded,
  AcUnitRounded,
  SwapHorizRounded,
  TouchAppRounded,
} from "@mui/icons-material";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { HEAT_TIERS, type PlayerHeat } from "@/lib/live/heat";

interface LiveVerdictBarProps {
  heatBoard: Record<string, PlayerHeat>;
  voterCount: number;
  /** player id -> display name, for the headline. */
  nameById: Record<string, string>;
  /** Show the tap hint: live, a member, and they have not voted yet. */
  showHint: boolean;
}

type Headline = {
  key: string;
  icon: React.ReactNode;
  text: string;
  tone: "hot" | "cold" | "sub";
};

/**
 * A one-line read on where the crowd is, above the pitch.
 *
 * The panel had no pulse of its own: badges appeared over individual heads and
 * nothing ever said how many people were watching or what the room thought. It
 * also gives the tap hint somewhere to live that is not on top of a player.
 */
export default function LiveVerdictBar({
  heatBoard,
  voterCount,
  nameById,
  showHint,
}: LiveVerdictBarProps) {
  const theme = useTheme();
  const reduce = useReducedMotion();

  const headline: Headline | null = useMemo(() => {
    const entries = Object.values(heatBoard);
    if (entries.length === 0) return null;

    const nameOf = (heat: PlayerHeat) =>
      nameById[heat.playerId] ?? "That player";

    // A forced substitution outranks everything — it is the one verdict the
    // crowd has actually committed to.
    const demanded = entries
      .filter((h) => h.subDemanded)
      .sort((a, b) => b.subOut - a.subOut)[0];
    if (demanded) {
      return {
        key: `sub-${demanded.playerId}`,
        icon: <SwapHorizRounded sx={{ fontSize: 16 }} />,
        text: `${demanded.subOut} of ${Math.max(voterCount, 1)} want ${nameOf(demanded)} off`,
        tone: "sub",
      };
    }

    const rankOf = (h: PlayerHeat) => HEAT_TIERS[h.tier].rank;
    const ranked = entries
      .filter((h) => h.tier !== "neutral")
      .sort((a, b) => rankOf(b) - rankOf(a) || Math.abs(b.net) - Math.abs(a.net));
    const top = ranked[0];
    if (!top) return null;

    const isHot = HEAT_TIERS[top.tier].direction === "hot";
    return {
      key: `${top.tier}-${top.playerId}`,
      icon: isHot ? (
        <WhatshotRounded sx={{ fontSize: 16 }} />
      ) : (
        <AcUnitRounded sx={{ fontSize: 16 }} />
      ),
      text: `${nameOf(top)} — ${HEAT_TIERS[top.tier].label.toLowerCase()}`,
      tone: isHot ? "hot" : "cold",
    };
  }, [heatBoard, nameById, voterCount]);

  const toneColor =
    headline?.tone === "hot"
      ? theme.palette.heat.hotSolid
      : headline?.tone === "cold"
        ? theme.palette.heat.coldSolid
        : theme.palette.heat.subDemand;

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      spacing={1}
      sx={{
        ...(theme as any).clay?.box,
        px: 1.5,
        py: 0.75,
        mb: 1.5,
        minHeight: 40,
      }}
    >
      {/* WHO IS WATCHING */}
      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ flexShrink: 0 }}>
        <Box
          component={motion.span}
          animate={reduce ? undefined : { opacity: [1, 0.25, 1] }}
          transition={
            reduce ? undefined : { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
          }
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            bgcolor: "error.main",
            display: "block",
          }}
        />
        <Typography variant="caption" fontWeight={900} letterSpacing={0.5}>
          {voterCount === 0
            ? "BE FIRST"
            : `${voterCount} FAN${voterCount === 1 ? "" : "S"}`}
        </Typography>
      </Stack>

      {/* THE ROOM'S VERDICT */}
      <Box sx={{ flex: 1, minWidth: 0, textAlign: "right" }}>
        <AnimatePresence mode="wait" initial={false}>
          {headline ? (
            <Stack
              component={motion.div}
              key={headline.key}
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              direction="row"
              alignItems="center"
              justifyContent="flex-end"
              spacing={0.5}
              sx={{ color: toneColor, minWidth: 0 }}
            >
              {headline.icon}
              <Typography
                variant="caption"
                fontWeight={800}
                noWrap
                sx={{ color: "text.primary" }}
              >
                {headline.text}
              </Typography>
            </Stack>
          ) : showHint ? (
            <Stack
              component={motion.div}
              key="hint"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduce ? undefined : { opacity: 0 }}
              direction="row"
              alignItems="center"
              justifyContent="flex-end"
              spacing={0.5}
              sx={{
                color: "text.secondary",
                px: 1,
                py: 0.25,
                borderRadius: 999,
                bgcolor: alpha(theme.palette.primary.main, 0.12),
              }}
            >
              <TouchAppRounded sx={{ fontSize: 15 }} />
              <Typography variant="caption" fontWeight={800} noWrap>
                Tap a player to rate them
              </Typography>
            </Stack>
          ) : (
            <Typography
              key="quiet"
              variant="caption"
              color="text.secondary"
              noWrap
            >
              No verdict yet
            </Typography>
          )}
        </AnimatePresence>
      </Box>
    </Stack>
  );
}
