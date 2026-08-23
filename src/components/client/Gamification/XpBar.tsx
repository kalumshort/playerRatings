"use client";

import Link from "next/link";
import { Box, ButtonBase, Stack, Typography, alpha, useTheme } from "@mui/material";
import { ChevronRight } from "lucide-react";
import { levelFromXp } from "@/lib/gamification/xpConfig";

/**
 * The slim XP strip for the nav drawer.
 *
 * Deliberately not the full panel: in a nav rail the useful signal is "what am
 * I, and how close am I to the next thing". The season totals, the leaderboard
 * and prediction points all live on the page this links to, so the bar is a
 * doorway rather than a dead end.
 *
 * Level is derived from XP rather than stored, so retuning the thresholds can
 * never strand someone on a level they no longer hold.
 */
export default function XpBar({
  totalXp,
  href,
  onNavigate,
}: {
  totalXp: number;
  /** Where the full progress page lives; null renders a non-interactive bar. */
  href: string | null;
  onNavigate?: () => void;
}) {
  const theme = useTheme() as any;
  const level = levelFromXp(totalXp);

  const body = (
    <Box
      sx={{
        width: "100%",
        px: 1.5,
        py: 1.25,
        borderRadius: "12px",
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: alpha(theme.palette.primary.main, 0.06),
      }}
    >
      <Stack direction="row" alignItems="center" sx={{ gap: 1, mb: 1 }}>
        <Box
          sx={{
            width: 26,
            height: 26,
            flexShrink: 0,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            fontWeight: 900,
            fontSize: "0.75rem",
            color: theme.palette.motm?.bronze ?? theme.palette.common.white,
            background: `linear-gradient(145deg, ${
              theme.palette.motm?.goldStart ?? "#FFE27A"
            } 0%, ${theme.palette.motm?.goldEnd ?? "#F5B300"} 100%)`,
          }}
        >
          {level.level}
        </Box>

        {/* The only flexible column — without minWidth:0 the row cannot shrink
            and the XP figure is pushed outside a 280px drawer. */}
        <Typography
          noWrap
          sx={{ flex: 1, minWidth: 0, fontWeight: 900, fontSize: "0.9rem" }}
        >
          {level.name}
        </Typography>

        <Typography
          sx={{ flexShrink: 0, fontWeight: 900, fontSize: "0.8rem", opacity: 0.75 }}
        >
          {totalXp.toLocaleString()}
        </Typography>

        {href && (
          <ChevronRight size={14} style={{ opacity: 0.4, flexShrink: 0 }} />
        )}
      </Stack>

      <Box
        sx={{
          height: 6,
          borderRadius: 999,
          overflow: "hidden",
          bgcolor: alpha(theme.palette.primary.main, 0.14),
        }}
      >
        <Box
          sx={{
            height: "100%",
            width: `${Math.round(level.progress * 100)}%`,
            borderRadius: 999,
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${alpha(
              theme.palette.primary.light,
              0.9,
            )})`,
            transition: "width .4s ease",
          }}
        />
      </Box>
    </Box>
  );

  // No club yet (a signed-up user who hasn't joined one) means nowhere to send
  // them, so the bar stays informational rather than a link to nothing.
  if (!href) return body;

  return (
    <ButtonBase
      component={Link}
      href={href}
      onClick={onNavigate}
      focusRipple={false}
      aria-label={`${level.name}, ${totalXp} XP. View your progress`}
      sx={{
        width: "100%",
        borderRadius: "12px",
        display: "block",
        textAlign: "left",
        "@media (hover: hover)": {
          "&:hover": { filter: "brightness(1.06)" },
        },
        "&:focus-visible": {
          outline: `2px solid ${theme.palette.primary.main}`,
          outlineOffset: 2,
        },
      }}
    >
      {body}
    </ButtonBase>
  );
}
