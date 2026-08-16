"use client";

import React from "react";
import { Box, alpha, styled } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";

import {
  DEFAULT_FORMATION,
  FORMATIONS,
  POSITION_BY_ROW,
  type FormationRow,
  type FormationRowId,
  type SquadPosition,
} from "./formations";

export interface PitchSlotContext {
  slotId: number;
  rowId: FormationRowId;
  rowIndex: number;
  /**
   * Squad position derived from the row this slot sits in — the picker uses
   * this instead of a fixed slot->position map, which was wrong for any
   * formation that reuses a slot id differently.
   */
  position: SquadPosition;
}

export interface PitchProps {
  formation: string;
  /** Override the formation table (tests). Defaults to the shared FORMATIONS. */
  formations?: Record<string, FormationRow[]>;
  /** Renders the contents of one slot cell. */
  renderSlot: (ctx: PitchSlotContext) => React.ReactNode;
  /** Absolutely positioned layer above the markings, below the players. */
  overlay?: React.ReactNode;
  /** Bar inside the surface, below the rows — title, formation, badges. */
  footer?: React.ReactNode;
  /** Forwarded to the surface node so html2canvas can capture it. */
  surfaceRef?: React.Ref<HTMLDivElement>;
  /** Fixed cell width so empty and filled cells stay aligned. */
  slotWidth?: number;
  aspectRatio?: number;
  sx?: SxProps<Theme>;
}

/**
 * The shared pitch surface.
 *
 * Replaces the two competing pitches this feature used to have — a mint
 * `success` gradient in the builder and a blue `primary` gradient in the
 * read-only shell — with one surface that dissolves into `background.paper`,
 * so it is correct in light and dark mode without a mode branch.
 *
 * The primitive owns the surface, the markings and the row layout. Cell
 * contents come from `renderSlot`, because that is the part that genuinely
 * differs between consumers (an interactive slot in the builder, a static
 * token in the shell, a hit/miss token after kickoff).
 */
const PitchSurface = styled(Box, {
  shouldForwardProp: (prop) => prop !== "ratio",
})<{ ratio: number }>(({ theme, ratio }) => ({
  ...((theme as any).clay?.card ?? {}),
  position: "relative",
  width: "100%",
  aspectRatio: String(ratio),
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  borderRadius: 12,
  // Must come after the clay spread: `background` is a shorthand and resets
  // background-color, which clay.card sets. Harmless because this gradient
  // resolves to background.paper from 65% onward.
  background: `radial-gradient(circle at 50% 0%, ${alpha(
    theme.palette.primary.main,
    0.18,
  )} 0%, ${theme.palette.background.paper} 65%)`,
}));

/**
 * Pitch markings, ported from the old LineupShell (its geometry was the
 * correct one — both penalty areas, centre circle, halfway line).
 *
 * Recoloured from `common.white` to a primary tint: white only worked because
 * it sat on a saturated coloured slab. The old wrapper `opacity: 0.3` is gone
 * — with a 0.10 tint it would composite to 0.03 and disappear.
 */
const MARKING_ALPHA = 0.1;

const PitchMarkings = () => (
  <Box
    aria-hidden
    sx={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}
  >
    {/* Penalty area — top */}
    <Box
      sx={(t) => ({
        position: "absolute",
        top: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "50%",
        height: "15%",
        border: 2,
        borderColor: alpha(t.palette.primary.main, MARKING_ALPHA),
        borderTop: 0,
      })}
    />
    {/* Centre circle */}
    <Box
      sx={(t) => ({
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "30%",
        aspectRatio: "1",
        borderRadius: "50%",
        border: 2,
        borderColor: alpha(t.palette.primary.main, MARKING_ALPHA),
      })}
    />
    {/* Halfway line */}
    <Box
      sx={(t) => ({
        position: "absolute",
        top: "50%",
        left: 0,
        right: 0,
        height: "2px",
        bgcolor: alpha(t.palette.primary.main, MARKING_ALPHA),
      })}
    />
    {/* Penalty area — bottom */}
    <Box
      sx={(t) => ({
        position: "absolute",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "50%",
        height: "15%",
        border: 2,
        borderColor: alpha(t.palette.primary.main, MARKING_ALPHA),
        borderBottom: 0,
      })}
    />
  </Box>
);

export default function Pitch({
  formation,
  formations = FORMATIONS,
  renderSlot,
  overlay,
  footer,
  surfaceRef,
  slotWidth = 70,
  aspectRatio = 0.72,
  sx,
}: PitchProps) {
  const layout: FormationRow[] =
    formations[formation] || formations[DEFAULT_FORMATION] || [];

  return (
    <PitchSurface ratio={aspectRatio} ref={surfaceRef} data-pitch-surface sx={sx}>
      <PitchMarkings />

      {overlay ? (
        <Box sx={{ position: "absolute", inset: 0, zIndex: 1 }}>{overlay}</Box>
      ) : null}

      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-evenly",
          py: 2,
          zIndex: 2,
        }}
      >
        {layout.map((row, rowIndex) => (
          <Box
            key={row.rowId}
            sx={{
              display: "flex",
              justifyContent: "space-evenly",
              alignItems: "center",
              width: "100%",
            }}
          >
            {row.slots.map((slotId) => (
              // Fixed-width cell whether or not it's filled — the old shell
              // used 65px for empty and 70px for filled, so rows drifted.
              <Box
                key={slotId}
                sx={{
                  width: slotWidth,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                {renderSlot({
                  slotId,
                  rowId: row.rowId,
                  rowIndex,
                  position: POSITION_BY_ROW[row.rowId] ?? "Midfielder",
                })}
              </Box>
            ))}
          </Box>
        ))}
      </Box>

      {footer ? <Box sx={{ zIndex: 3 }}>{footer}</Box> : null}
    </PitchSurface>
  );
}
