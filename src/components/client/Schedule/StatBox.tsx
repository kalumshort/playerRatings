"use client";

import { Box, Typography } from "@mui/material";

interface StatBoxProps {
  value: number;
  label: string;
  color: string;
}

export const StatBox = ({ value, label, color }: StatBoxProps) => (
  <Box
    sx={(theme: any) => ({
      ...theme.clay?.box, // Your custom theme property
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      py: 1.5,
      borderRadius: "16px",
      bgcolor: "background.default",
      // Adding a subtle fallback for the 'clay' effect
      boxShadow: theme.clay ? "none" : "inset 0px 2px 4px rgba(0,0,0,0.05)",
    })}
  >
    <Typography
      sx={{
        fontWeight: 900,
        fontSize: "1.8rem",
        lineHeight: 1,
        color: color,
      }}
    >
      {value}
    </Typography>
    <Typography
      variant="caption"
      sx={{
        fontSize: "0.65rem",
        fontWeight: 800,
        color: "text.secondary",
        mt: 0.5,
        letterSpacing: 0.5,
      }}
    >
      {label}
    </Typography>
  </Box>
);
