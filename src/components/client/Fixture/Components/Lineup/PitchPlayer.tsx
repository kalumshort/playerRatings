"use client";

import React from "react";
import {
  Avatar,
  Box,
  ButtonBase,
  Paper,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";

/**
 * `hit`/`miss`   — post-match: did this pick actually start?
 * `agree`/`differ` — pre-match: do you and the crowd agree?
 *
 * `differ` is deliberately NOT red. Disagreeing with the crowd is conviction,
 * not a mistake, and red is already spoken for by `miss` on this component.
 */
export type PitchPlayerStatus = "default" | "hit" | "miss" | "agree" | "differ";

export interface PitchPlayerProps {
  name: string;
  photo?: string;
  fullName?: string;
  /** Top-right pill — a consensus percentage, usually. */
  badge?: React.ReactNode;
  status?: PitchPlayerStatus;
  onClick?: () => void;
  size?: number;
  dimmed?: boolean;
}

/**
 * Status colours use the SOLID domain tokens, not the pastel palette:
 * `success.main` (#86D69A) is too pale to read as a ring on white.
 */
const statusStyles = (theme: any, status: PitchPlayerStatus) => {
  switch (status) {
    case "hit":
    case "agree":
      return { ring: theme.palette.form.goodSolid, Glyph: CheckRoundedIcon };
    case "miss":
      return { ring: theme.palette.form.poorSolid, Glyph: CloseRoundedIcon };
    case "differ":
      return { ring: theme.palette.info.main, Glyph: StarRoundedIcon };
    default:
      return { ring: null, Glyph: null };
  }
};

export function PitchPlayer({
  name,
  photo,
  fullName,
  badge,
  status = "default",
  onClick,
  size = 56,
  dimmed = false,
}: PitchPlayerProps) {
  const interactive = Boolean(onClick);

  return (
    <Box
      component={interactive ? ButtonBase : "div"}
      {...(interactive
        ? { onClick, "aria-label": fullName || name, focusRipple: false }
        : {})}
      sx={(t: any) => {
        const { ring } = statusStyles(t, status);
        return {
          position: "relative",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          borderRadius: 2,
          p: 0.25,
          opacity: dimmed ? 0.45 : 1,
          transition: "background-color .15s ease, opacity .2s ease",
          ...(interactive && {
            cursor: "pointer",
            // hover only where hover actually exists — a scale/tint sticks
            // after tap on touch devices
            "@media (hover: hover)": {
              "&:hover": {
                backgroundColor: alpha(t.palette.primary.main, 0.1),
              },
            },
            "&:active": { filter: "brightness(0.96)" },
            "&:focus-visible": {
              outline: `2px solid ${t.palette.primary.main}`,
              outlineOffset: 2,
            },
          }),
          "& .pitch-avatar": {
            width: size,
            height: size,
            // background.default, not paper: on a paper-based pitch a paper
            // avatar is an invisible white blob in light mode.
            backgroundColor: t.palette.background.default,
            border: `2px solid ${ring ?? alpha(t.palette.primary.main, 0.35)}`,
            boxShadow: t.palette.mode === "light" ? t.shadows[2] : "none",
          },
        };
      }}
    >
      <Box sx={{ position: "relative", lineHeight: 0 }}>
        <Avatar className="pitch-avatar" src={photo} alt={fullName || name} />

        {status !== "default" && <StatusGlyph status={status} />}

        {badge ? (
          <Paper
            variant="pill"
            sx={(t) => ({
              position: "absolute",
              top: -6,
              right: -10,
              px: 0.6,
              fontSize: "0.6rem",
              fontWeight: 900,
              lineHeight: 1.6,
              // Was secondary.main + common.white (~1.9:1) — unreadable once
              // the pitch stopped being a dark slab.
              bgcolor: alpha(t.palette.primary.main, 0.22),
              color: "text.primary",
            })}
          >
            {badge}
          </Paper>
        ) : null}
      </Box>

      <Typography
        variant="caption"
        noWrap
        sx={(t) => ({
          display: "block",
          maxWidth: "100%",
          mt: 0.5,
          fontWeight: 800,
          fontSize: "0.65rem",
          letterSpacing: 0.3,
          textTransform: "uppercase",
          // Was common.white + a black shadow, which assumed a dark pitch.
          color: "text.primary",
          textShadow:
            t.palette.mode === "dark"
              ? "none"
              : `0 1px 1px ${alpha(t.palette.common.white, 0.8)}`,
        })}
      >
        {name}
      </Typography>
    </Box>
  );
}

/**
 * Status is never signalled by colour alone — the ring is always paired with
 * this glyph, so it survives greyscale and colour-blindness.
 */
const StatusGlyph = ({ status }: { status: PitchPlayerStatus }) => {
  const theme = useTheme() as any;
  const { ring, Glyph } = statusStyles(theme, status);
  if (!Glyph || !ring) return null;

  return (
    <Box
      sx={{
        position: "absolute",
        bottom: -2,
        left: -4,
        width: 18,
        height: 18,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        backgroundColor: ring,
        color: "common.white",
        border: `2px solid ${theme.palette.background.paper}`,
      }}
    >
      <Glyph sx={{ fontSize: 12 }} />
    </Box>
  );
};

export function EmptyPitchSlot({
  onClick,
  label,
  size = 56,
}: {
  onClick: () => void;
  label: string;
  size?: number;
}) {
  return (
    <ButtonBase
      onClick={onClick}
      aria-label={label}
      focusRipple={false}
      sx={(t) => ({
        width: size,
        height: size,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        color: "text.secondary",
        border: `2px dashed ${alpha(t.palette.primary.main, 0.35)}`,
        backgroundColor: alpha(t.palette.primary.main, 0.06),
        transition: "background-color .15s ease, border-color .15s ease",
        "@media (hover: hover)": {
          "&:hover": {
            backgroundColor: alpha(t.palette.primary.main, 0.12),
            borderColor: alpha(t.palette.primary.main, 0.5),
          },
        },
        "&:active": { filter: "brightness(0.96)" },
        "&:focus-visible": {
          outline: `2px solid ${t.palette.primary.main}`,
          outlineOffset: 2,
        },
      })}
    >
      <AddRoundedIcon sx={{ fontSize: 24 }} />
    </ButtonBase>
  );
}

export default PitchPlayer;
