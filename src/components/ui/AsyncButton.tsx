"use client";

import React, { useMemo } from "react";
import {
  Button,
  CircularProgress,
  Box,
  useTheme,
  darken,
  lighten,
  ButtonProps,
  SxProps,
  Theme,
} from "@mui/material";

interface AsyncButtonProps extends ButtonProps {
  loading?: boolean;
  /**
   * Keep the caller's own background while loading. Buttons that paint a
   * gradient via `background` need this, otherwise the loading state's
   * `backgroundColor: !important` stomps it mid-flight.
   */
  keepBackground?: boolean;
  /**
   * Colour for the loading spinner. Needed when `keepBackground` paints a
   * background this component can't measure — see spinnerColor below.
   */
  loadingIndicatorColor?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export const AsyncButton = ({
  children,
  loading = false,
  keepBackground = false,
  loadingIndicatorColor,
  onClick,
  sx = {},
  ...props
}: AsyncButtonProps) => {
  const theme = useTheme();

  // 1. THE FIX: Explicitly type the style object as SxProps<Theme>
  const loadingStyles: SxProps<Theme> = useMemo(() => {
    // Determine which palette color to use
    const colorKey = props.color === "secondary" ? "secondary" : "primary";
    const mainColor = (theme.palette[colorKey] as any).main;
    const isLight = theme.palette.mode === "light";

    const pressedShadow = isLight
      ? `inset 6px 6px 12px ${darken(mainColor, 0.2)}, inset -6px -6px 12px ${lighten(mainColor, 0.5)}`
      : `inset 4px 4px 8px ${darken(mainColor, 0.5)}, inset -4px -4px 8px ${lighten(mainColor, 0.1)}`;

    return {
      boxShadow: `${pressedShadow} !important`,
      transform: "translateY(2px) !important",
      pointerEvents: "none",
      ...(keepBackground
        ? {}
        : { backgroundColor: `${mainColor} !important` }),
      color: "transparent !important",
      // Ensure icons are hidden too
      "& .MuiButton-startIcon, & .MuiButton-endIcon": {
        opacity: 0,
      },
    };
  }, [
    theme.palette.mode,
    theme.palette.primary.main,
    theme.palette.secondary.main,
    props.color,
    keepBackground,
  ]);

  // The spinner can't inherit the button's colour — `loadingStyles` sets
  // `color: transparent !important` to hide the label, which would hide the
  // spinner too. Derive it from whatever the button is filled with instead.
  // The old code picked #fff in light and near-white text.primary in dark;
  // both land at ~1.9:1 on the pale #93BFEC primary, so the spinner was
  // effectively invisible in *both* modes and the branch changed nothing.
  const spinnerColor = useMemo(() => {
    // An explicit colour always wins — the caller knows what it painted.
    if (loadingIndicatorColor) return loadingIndicatorColor;
    // keepBackground means the caller painted its own gradient, which we can't
    // measure here. The old #fff fallback assumed those were all dark buttons;
    // the rating submit button is a PASTEL gradient, so its spinner rendered at
    // 1.13:1 and simply wasn't there. Fall back to the text colour instead,
    // which at least tracks the mode, and pass loadingIndicatorColor when the
    // background is known.
    if (keepBackground) return theme.palette.text.primary;
    const colorKey = props.color === "secondary" ? "secondary" : "primary";
    return theme.palette.getContrastText(
      (theme.palette[colorKey] as any).main,
    );
  }, [theme, props.color, keepBackground, loadingIndicatorColor]);

  return (
    <Button
      {...props}
      onClick={!loading ? onClick : undefined}
      // MUI's array form. Spreading an array into an object literal (the
      // previous shape) produced { "0": {...} } and silently dropped every
      // caller's sx. Later entries win, so callers can still override.
      sx={[
        {
          position: "relative",
          transition: "all 0.2s ease",
          fontWeight: 900,
          borderRadius: "16px",
        },
        loading && loadingStyles,
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {/* Content wrapper */}
      <Box
        component="span"
        sx={{
          display: "contents",
          visibility: loading ? "hidden" : "inherit",
        }}
      >
        {children}
      </Box>

      {/* Spinner */}
      {loading && (
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
          }}
        >
          <CircularProgress size={24} thickness={6} sx={{ color: spinnerColor }} />
        </Box>
      )}
    </Button>
  );
};
