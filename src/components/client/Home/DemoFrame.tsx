"use client";

import { ReactNode } from "react";
import { Box, Chip, Paper, useTheme } from "@mui/material";

/**
 * Wraps a homepage demo panel and labels it as an example.
 *
 * The panels render real crests, real squad names and real match events, but
 * the vote percentages in them are illustrative — there isn't enough real
 * voting data to show honestly yet. This component exists so that labelling
 * lives in exactly one place and can't drift between the three panels.
 */
export default function DemoFrame({
  children,
  padded = true,
}: {
  children: ReactNode;
  /** Off for panels that manage their own padding, e.g. a full-bleed chart. */
  padded?: boolean;
}) {
  const theme = useTheme() as any;

  return (
    <Paper
      sx={{
        ...theme.clay?.card,
        position: "relative",
        overflow: "hidden",
        ...(padded ? { p: { xs: 3, md: 4 } } : {}),
      }}
    >
      <Chip
        label="EXAMPLE"
        size="small"
        sx={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 2,
          height: 20,
          fontSize: "0.6rem",
          fontWeight: 900,
          letterSpacing: 1,
          color: "text.secondary",
          bgcolor: "background.default",
          border: `1px solid ${theme.palette.divider}`,
        }}
      />
      <Box sx={{ position: "relative" }}>{children}</Box>
    </Paper>
  );
}
