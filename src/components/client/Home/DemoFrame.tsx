"use client";

import { ReactNode } from "react";
import { Avatar, Box, Chip, Paper, Stack, Typography, useTheme } from "@mui/material";
import type { ShowcaseClub } from "@/lib/homepageShowcase";

/**
 * Wraps a homepage demo panel and labels it as an example.
 *
 * The panels render real crests, real squad names and real match events, but
 * the vote percentages in them are illustrative — there isn't enough real
 * voting data to show honestly yet. This component exists so that labelling
 * lives in exactly one place and can't drift between the panels.
 *
 * Each panel is anchored to one of the five biggest clubs, so it also carries a
 * crest and name — without it, five panels of unfamiliar squad photos give the
 * reader no idea whose players they're looking at.
 */
export default function DemoFrame({
  children,
  padded = true,
  club = null,
}: {
  children: ReactNode;
  /** Off for panels that manage their own padding, e.g. a full-bleed chart. */
  padded?: boolean;
  /** The club this panel's players and match come from. */
  club?: ShowcaseClub | null;
}) {
  const theme = useTheme() as any;

  return (
    <Paper
      sx={{
        ...theme.clay?.card,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Header rail: whose club this is, and the honesty label. */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          position: "absolute",
          top: 12,
          left: 12,
          right: 12,
          zIndex: 2,
          pointerEvents: "none",
        }}
      >
        {club ? (
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Avatar
              src={club.logo}
              alt=""
              sx={{ width: 20, height: 20, bgcolor: "transparent" }}
              imgProps={{ style: { objectFit: "contain" }, loading: "lazy" }}
            />
            <Typography
              variant="caption"
              noWrap
              sx={{
                fontWeight: 900,
                fontSize: "0.65rem",
                letterSpacing: 0.5,
                color: "text.secondary",
              }}
            >
              {club.name}
            </Typography>
          </Stack>
        ) : (
          <Box />
        )}

        <Chip
          label="EXAMPLE"
          size="small"
          sx={{
            height: 20,
            fontSize: "0.6rem",
            fontWeight: 900,
            letterSpacing: 1,
            color: "text.secondary",
            bgcolor: "background.default",
            border: `1px solid ${theme.palette.divider}`,
          }}
        />
      </Stack>

      {/* Extra top padding leaves room for the rail above.
          Deliberately px/pb rather than the `p` shorthand: a responsive `p`
          emits its media query after the base `padding-top`, so the shorthand
          silently won at md and the rail overlapped the panel heading. */}
      <Box
        sx={{
          position: "relative",
          ...(padded
            ? {
                px: { xs: 3, md: 4 },
                pb: { xs: 3, md: 4 },
                pt: { xs: 6, md: 6.5 },
              }
            : {}),
        }}
      >
        {children}
      </Box>
    </Paper>
  );
}
