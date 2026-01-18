import React from "react";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { useTheme, darken, lighten } from "@mui/material/styles";
import Box from "@mui/material/Box";

export const AsyncButton = ({
  children,
  loading = false,
  onClick,
  sx = {},
  ...props
}) => {
  const theme = useTheme();

  // 1. CALCULATE CLAY "PRESSED" STATE
  // We dynamically grab the primary color (Matcha)
  const mainColor = theme.palette.primary.main;

  // The "Deep Groove" Shadow logic
  const pressedShadow =
    theme.palette.mode === "light"
      ? `inset 6px 6px 12px ${darken(mainColor, 0.2)}, inset -6px -6px 12px ${lighten(mainColor, 0.5)}`
      : `inset 4px 4px 8px ${darken(mainColor, 0.5)}, inset -4px -4px 8px ${lighten(mainColor, 0.1)}`;

  return (
    <Button
      onClick={!loading ? onClick : undefined} // Prevent clicks while loading
      sx={{
        position: "relative", // Needed to center the spinner

        // 2. THE LOADING STATE LOGIC
        ...(loading && {
          // A. The "Pressed" Look
          boxShadow: pressedShadow,
          transform: "translateY(2px)", // Physically move it down
          pointerEvents: "none", // Block user interaction

          // B. Color Consistency (Keep it Matcha, don't gray out)
          backgroundColor: `${mainColor} !important`,

          // C. Hide Text (but keep its width to prevent layout shift)
          color: "transparent",

          // D. Kill hover effects during load
          "&:hover": {
            boxShadow: pressedShadow,
            backgroundColor: mainColor,
            transform: "translateY(2px)",
          },
        }),

        // Merge any external sx props passed in (margins, width, etc.)
        ...sx,
      }}
      {...props}
    >
      {/* 3. CONTENT PRESERVATION */}
      {/* We render children to keep the button width consistent */}
      {children}

      {/* 4. THE SPINNER */}
      {loading && (
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)", // Perfect center
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress
            size={24}
            thickness={5}
            sx={{
              // Use Text Color (Dark Slate) so it pops against Matcha
              color: theme.palette.text.primary,
            }}
          />
        </Box>
      )}
    </Button>
  );
};
