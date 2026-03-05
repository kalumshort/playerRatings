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
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export const AsyncButton = ({
  children,
  loading = false,
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
      backgroundColor: `${mainColor} !important`,
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
  ]);

  return (
    <Button
      {...props}
      onClick={!loading ? onClick : undefined}
      sx={{
        position: "relative",
        transition: "all 0.2s ease",
        fontWeight: 900,
        borderRadius: "16px",

        // Apply loading styles if active
        ...(loading ? loadingStyles : {}),

        // Merge external styles
        ...(Array.isArray(sx) ? sx : [sx]),
      }}
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
          <CircularProgress
            size={24}
            thickness={6}
            sx={{
              color:
                theme.palette.mode === "light"
                  ? "#fff"
                  : theme.palette.text.primary,
            }}
          />
        </Box>
      )}
    </Button>
  );
};
