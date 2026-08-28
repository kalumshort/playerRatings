"use client";

import React from "react";
import { Box, ButtonBase, Typography, alpha, useTheme } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

/**
 * The button that opens a squad picker.
 *
 * Both controls previously used a small `Chip` with a dashed border. Dashed
 * borders read as an empty drop target, which undersold these — they are the
 * page's main navigation, not placeholders — and the two chips ended up
 * different heights because their contents differed. This is one solid pill
 * with a fixed height, so the pair lines up whatever is written in them.
 */
export default function PickerTrigger({
  icon,
  label,
  accent,
  active = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  accent: string;
  /** Menu is open — holds the hover treatment so the button reads as the
   *  source of the popup. */
  active?: boolean;
  onClick: (e: React.MouseEvent<HTMLElement>) => void;
}) {
  const theme = useTheme();

  return (
    <ButtonBase
      onClick={onClick}
      focusRipple
      sx={{
        height: 38,
        px: 1.75,
        gap: 0.75,
        borderRadius: "999px",
        bgcolor: active ? alpha(accent, 0.1) : "background.paper",
        border: `1px solid ${active ? accent : theme.palette.divider}`,
        color: active ? "text.primary" : "text.secondary",
        transition: "all 0.18s ease",
        "&:hover": {
          bgcolor: alpha(accent, 0.1),
          borderColor: accent,
          color: "text.primary",
          transform: "translateY(-1px)",
        },
        "&:active": { transform: "translateY(0)" },
      }}
    >
      <Box sx={{ display: "flex", color: accent }}>{icon}</Box>

      <Typography
        component="span"
        sx={{
          fontWeight: 800,
          fontSize: "0.78rem",
          letterSpacing: 0.2,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </Typography>

      <KeyboardArrowDownIcon
        sx={{
          fontSize: 16,
          opacity: 0.6,
          transition: "transform 0.18s ease",
          transform: active ? "rotate(180deg)" : "none",
        }}
      />
    </ButtonBase>
  );
}
