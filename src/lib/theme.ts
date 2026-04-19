import React from "react";
import { createTheme, Theme, alpha } from "@mui/material/styles";

// ─── PASTEL PALETTE ─────────────────────────────────────────────────────────
export const PALETTE = {
  light: {
    bg: "#FDFBF7",
    paper: "#FFFFFF",
    textPrimary: "#4A4A4A",
    textSecondary: "#8C8C8C",
    clayShadow: "#D1D9E6",
    highlight: "#FFFFFF",
    input: "#EDF0F5",
  },
  dark: {
    bg: "#1A1C1E",
    paper: "#24272B",
    textPrimary: "#ECECEC",
    textSecondary: "#B0B3C7",
    clayShadow: "#0D0E10",
    highlight: "rgba(255, 255, 255, 0.05)",
    input: "#14171D",
  },
  primary: "#A2D2FF",   // sky blue
  secondary: "#A0E8AF", // mint green
  success: "#A0E8AF",   // mint green
  error: "#FFADAD",     // soft coral
  warning: "#FFD6A5",   // peach
  info: "#C9B8FF",      // lavender
  coral: "#FFC8DD",     // pink
} as const;

// ─── TYPE AUGMENTATION ──────────────────────────────────────────────────────
declare module "@mui/material/styles" {
  interface Theme {
    clay: {
      card: React.CSSProperties;
      box: React.CSSProperties;
      button: React.CSSProperties & {
        "&:hover"?: React.CSSProperties;
        "&:active"?: React.CSSProperties;
      };
    };
  }
  interface ThemeOptions {
    clay?: {
      card?: React.CSSProperties;
      box?: React.CSSProperties;
      button?: React.CSSProperties & {
        "&:hover"?: React.CSSProperties;
        "&:active"?: React.CSSProperties;
      };
    };
  }
}

// ─── SHADOW TOKENS ──────────────────────────────────────────────────────────
const shadows = {
  outer: (clayShadow: string, isLight: boolean) =>
    isLight
      ? `8px 8px 16px ${clayShadow}, -8px -8px 16px #FFFFFF`
      : `8px 8px 16px #0B0E12, -8px -8px 16px rgba(255,255,255,0.03)`,
  outerSm: (clayShadow: string, isLight: boolean) =>
    isLight
      ? `4px 4px 8px ${clayShadow}, -4px -4px 8px #FFFFFF`
      : `4px 4px 8px #0B0E12, -4px -4px 8px rgba(255,255,255,0.03)`,
  inner: (isLight: boolean) =>
    isLight
      ? "inset 4px 4px 8px #C6CEDA, inset -4px -4px 8px #FFFFFF"
      : "inset 4px 4px 8px #0B0E12, inset -4px -4px 8px rgba(255,255,255,0.03)",
  innerFocus: (accentColor: string, isLight: boolean) =>
    isLight
      ? `inset 3px 3px 6px #C6CEDA, inset -3px -3px 6px #FFFFFF, 0 0 0 2px ${accentColor}`
      : `inset 4px 4px 8px #0B0E12, 0 0 0 2px ${accentColor}`,
};

// ─── THEME FACTORY ──────────────────────────────────────────────────────────
export const getTheme = (
  mode: "light" | "dark",
  accentColor: string = PALETTE.primary,
): Theme => {
  const isLight = mode === "light";
  const colors = isLight ? PALETTE.light : PALETTE.dark;

  return createTheme({
    // ─── PALETTE ──────────────────────────────────────────────────
    palette: {
      mode,
      primary: { main: accentColor, contrastText: "#3D3D3D" },
      secondary: { main: PALETTE.secondary },
      background: { default: colors.bg, paper: colors.paper },
      text: { primary: colors.textPrimary, secondary: colors.textSecondary },
      success: { main: PALETTE.success },
      error: { main: PALETTE.error },
      warning: { main: PALETTE.warning },
      info: { main: PALETTE.info },
    },

    shape: { borderRadius: 16 },

    // ─── TYPOGRAPHY ───────────────────────────────────────────────
    typography: {
      fontFamily: "var(--font-outfit), sans-serif",
      h1: {
        fontFamily: "var(--font-jakarta), sans-serif",
        fontWeight: 800,
        letterSpacing: "-0.025em",
      },
      h2: {
        fontFamily: "var(--font-jakarta), sans-serif",
        fontWeight: 700,
        letterSpacing: "-0.015em",
      },
      h3: { fontFamily: "var(--font-jakarta), sans-serif", fontWeight: 700 },
      h4: { fontFamily: "var(--font-jakarta), sans-serif", fontWeight: 700 },
      h5: { fontFamily: "var(--font-jakarta), sans-serif", fontWeight: 700 },
      h6: { fontFamily: "var(--font-jakarta), sans-serif", fontWeight: 700 },
      button: {
        fontFamily: "var(--font-outfit), sans-serif",
        fontWeight: 700,
        fontSize: "0.95rem",
        letterSpacing: "0.01em",
        textTransform: "none",
      },
      body1: { fontSize: "1rem", lineHeight: 1.6 },
      body2: { fontSize: "0.875rem", lineHeight: 1.5 },
      caption: { fontWeight: 600, letterSpacing: 0.3, fontSize: "0.75rem" },
      overline: { fontWeight: 800, letterSpacing: 1.5, fontSize: "0.65rem" },
    },

    // ─── CLAY TOKENS ──────────────────────────────────────────────
    clay: {
      card: {
        backgroundColor: colors.bg,
        borderRadius: "32px",
        boxShadow: isLight
          ? `8px 8px 16px ${colors.clayShadow}, -8px -8px 16px #FFFFFF, inset 0 0 0 1px rgba(255,255,255,0.8)`
          : `8px 8px 16px #0B0E12, -8px -8px 16px rgba(255,255,255,0.03), inset 0 0 0 1px rgba(255,255,255,0.05)`,
        border: "none",
      },
      box: {
        backgroundColor: colors.input,
        borderRadius: "24px",
        boxShadow: isLight
          ? "inset 4px 4px 8px #C6CEDA, inset -4px -4px 8px #FFFFFF"
          : "inset 4px 4px 8px #0B0E12",
        border: "none",
      },
      button: {
        backgroundColor: colors.bg,
        borderRadius: "24px",
        color: colors.textPrimary,
        fontWeight: 700,
        transition: "all 0.3s cubic-bezier(0.2, 0, 0, 1)",
        boxShadow: isLight
          ? "6px 6px 12px #C6CEDA, -6px -6px 12px #FFFFFF"
          : "6px 6px 12px #0B0E12, -6px -6px 12px rgba(255,255,255,0.03)",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: isLight
            ? "8px 8px 16px #C6CEDA, -8px -8px 16px #FFFFFF"
            : "8px 8px 16px #0B0E12, -8px -8px 16px rgba(255,255,255,0.05)",
        },
        "&:active": {
          transform: "scale(0.98)",
          boxShadow: isLight
            ? "inset 4px 4px 8px #C6CEDA, inset -4px -4px 8px #FFFFFF"
            : "inset 4px 4px 8px #0B0E12, inset -4px -4px 8px rgba(255,255,255,0.05)",
        },
      },
    },

    // ─── COMPONENT OVERRIDES ──────────────────────────────────────
    components: {

      // GLOBAL BASE
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: colors.bg,
            transition: "background-color 0.4s ease",
            fontFamily: "var(--font-outfit), sans-serif",
          },
          "*::-webkit-scrollbar": { display: "none" },
          "*": { scrollbarWidth: "none" },
        },
      },

      // RIPPLE — disable globally for clay feel
      MuiButtonBase: {
        defaultProps: { disableRipple: true },
      },

      // APP BAR
      MuiAppBar: {
        defaultProps: { elevation: 0, color: "transparent" },
        styleOverrides: {
          root: {
            backgroundColor: alpha(colors.paper, 0.75),
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderBottom: isLight
              ? "1px solid rgba(255,255,255,0.9)"
              : "1px solid rgba(255,255,255,0.05)",
          },
        },
      },

      MuiToolbar: {
        styleOverrides: {
          root: { minHeight: "64px !important" },
        },
      },

      // PAPER
      MuiPaper: {
        styleOverrides: {
          root: {
            padding: "6px",
            margin: "8px",
            backgroundImage: "none",
            backgroundColor: colors.paper,
            borderRadius: "32px",
            transition: "all 0.3s cubic-bezier(0.2, 0, 0, 1)",
            boxShadow: isLight
              ? `10px 10px 20px ${colors.clayShadow}, -10px -10px 20px ${colors.highlight}`
              : `12px 12px 24px ${colors.clayShadow}, -6px -6px 15px rgba(255,255,255,0.03)`,
            border: isLight
              ? "1px solid rgba(255,255,255,0.9)"
              : "1px solid rgba(255,255,255,0.05)",
          },
        },
      },

      // AVATAR
      MuiAvatar: {
        styleOverrides: {
          root: {
            borderRadius: "12px",
            boxShadow: shadows.outerSm(colors.clayShadow, isLight),
          },
          img: { objectFit: "contain", width: "100%", height: "100%" },
        },
      },

      // DIVIDER
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: isLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.06)",
            margin: "4px 0",
          },
        },
      },

      // CHIP
      MuiChip: {
        defaultProps: { variant: "filled" },
        styleOverrides: {
          root: {
            borderRadius: "12px",
            fontWeight: 700,
            fontSize: "0.75rem",
            height: 28,
            border: "none",
            transition: "all 0.2s ease",
            backgroundColor: colors.input,
            boxShadow: shadows.outerSm(colors.clayShadow, isLight),
            "&:hover": { filter: "brightness(1.04)" },
          },
          label: { paddingLeft: "12px", paddingRight: "12px" },
          colorPrimary: {
            backgroundColor: alpha(accentColor, 0.18),
            color: accentColor,
            boxShadow: "none",
          },
          colorSecondary: {
            backgroundColor: alpha(PALETTE.secondary, 0.18),
            color: isLight ? "#1b5e35" : PALETTE.secondary,
            boxShadow: "none",
          },
          colorSuccess: {
            backgroundColor: alpha(PALETTE.success, 0.18),
            color: isLight ? "#1b5e35" : PALETTE.success,
            boxShadow: "none",
          },
          colorError: {
            backgroundColor: alpha(PALETTE.error, 0.18),
            color: isLight ? "#b5000a" : PALETTE.error,
            boxShadow: "none",
          },
          colorWarning: {
            backgroundColor: alpha(PALETTE.warning, 0.22),
            color: isLight ? "#7c5a00" : PALETTE.warning,
            boxShadow: "none",
          },
          colorInfo: {
            backgroundColor: alpha(PALETTE.info, 0.18),
            color: isLight ? "#3d2a8c" : PALETTE.info,
            boxShadow: "none",
          },
        },
      },

      // BUTTONS
      MuiButton: {
        defaultProps: { disableElevation: true, disableRipple: true },
        styleOverrides: {
          root: {
            borderRadius: "24px",
            padding: "12px 28px",
            textTransform: "none",
            fontWeight: 700,
            fontFamily: "var(--font-jakarta), sans-serif",
            transition: "all 0.3s cubic-bezier(0.2, 0, 0, 1)",
            boxShadow: isLight
              ? `6px 6px 12px ${colors.clayShadow}, -6px -6px 12px ${colors.highlight}, inset 0 0 0 1px rgba(255,255,255,0.5)`
              : `6px 6px 12px #0B0E12, -6px -6px 12px rgba(255,255,255,0.03), inset 0 0 0 1px rgba(255,255,255,0.05)`,
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: isLight
                ? `8px 8px 16px ${colors.clayShadow}, -8px -8px 16px ${colors.highlight}`
                : `8px 8px 16px #0B0E12, -8px -8px 16px rgba(255,255,255,0.05)`,
            },
            "&:active": {
              transform: "scale(0.98)",
              boxShadow: isLight
                ? `inset 4px 4px 8px ${colors.clayShadow}, inset -4px -4px 8px ${colors.highlight}`
                : `inset 4px 4px 8px #0B0E12, inset -4px -4px 8px rgba(255,255,255,0.05)`,
            },
          },
          containedPrimary: {
            backgroundColor: accentColor,
            color: "#1A1C1E",
            boxShadow: `0 8px 16px ${alpha(accentColor, 0.4)}`,
            "&:hover": {
              backgroundColor: accentColor,
              filter: "brightness(1.05)",
              boxShadow: `0 12px 20px ${alpha(accentColor, 0.55)}`,
            },
          },
          containedSecondary: {
            backgroundColor: PALETTE.secondary,
            color: "#1A1C1E",
            boxShadow: `0 8px 16px ${alpha(PALETTE.secondary, 0.4)}`,
            "&:hover": {
              backgroundColor: PALETTE.secondary,
              filter: "brightness(1.05)",
            },
          },
          outlined: {
            borderColor: isLight ? colors.clayShadow : "rgba(255,255,255,0.12)",
            boxShadow: "none",
            "&:hover": { boxShadow: "none" },
          },
          text: {
            boxShadow: "none",
            "&:hover": {
              boxShadow: "none",
              backgroundColor: alpha(accentColor, 0.08),
            },
          },
          sizeSmall: { padding: "8px 18px", fontSize: "0.8rem", borderRadius: "18px" },
          sizeLarge: { padding: "16px 36px", fontSize: "1.05rem" },
        },
      },

      MuiIconButton: {
        defaultProps: { disableRipple: true },
        styleOverrides: {
          root: {
            borderRadius: "14px",
            transition: "all 0.25s cubic-bezier(0.2, 0, 0, 1)",
            "&:hover": {
              backgroundColor: colors.input,
              transform: "translateY(-1px)",
            },
            "&:active": { transform: "scale(0.93)" },
          },
        },
      },

      // INPUTS
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: "16px",
            backgroundColor: colors.input,
            boxShadow: shadows.inner(isLight),
            transition: "box-shadow 0.25s cubic-bezier(0.2, 0, 0, 1)",
            "& .MuiOutlinedInput-notchedOutline": { border: "none" },
            "&:hover .MuiOutlinedInput-notchedOutline": { border: "none" },
            "&.Mui-focused": {
              boxShadow: shadows.innerFocus(accentColor, isLight),
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { border: "none" },
            "&.Mui-error": {
              boxShadow: isLight
                ? `inset 3px 3px 6px #C6CEDA, 0 0 0 2px ${PALETTE.error}`
                : `inset 4px 4px 8px #0B0E12, 0 0 0 2px ${PALETTE.error}`,
            },
          },
          input: {
            fontWeight: 600,
            "&::placeholder": { opacity: 0.45 },
          },
          adornedStart: { paddingLeft: "12px" },
          adornedEnd: { paddingRight: "12px" },
        },
      },

      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            color: colors.textSecondary,
            "&.Mui-focused": { color: accentColor },
            "&.Mui-error": { color: PALETTE.error },
          },
        },
      },

      MuiFormHelperText: {
        styleOverrides: {
          root: { fontWeight: 600, marginLeft: "4px" },
        },
      },

      // SELECT
      MuiSelect: {
        styleOverrides: {
          select: {
            fontWeight: 600,
            "&:focus": { backgroundColor: "transparent" },
          },
          icon: { color: colors.textSecondary },
        },
      },

      MuiMenuItem: {
        styleOverrides: {
          root: {
            borderRadius: "12px",
            margin: "2px 6px",
            fontWeight: 600,
            transition: "all 0.2s ease",
            "&:hover": { backgroundColor: colors.input },
            "&.Mui-selected": {
              backgroundColor: alpha(accentColor, 0.15),
              color: accentColor,
              fontWeight: 700,
              "&:hover": { backgroundColor: alpha(accentColor, 0.22) },
            },
          },
        },
      },

      MuiMenu: {
        styleOverrides: {
          list: { padding: "8px" },
        },
      },

      // TABS
      MuiTabs: {
        styleOverrides: {
          root: {
            minHeight: "48px",
            width: "100%",
            padding: "6px",
            backgroundColor: colors.input,
            borderRadius: "24px",
            boxShadow: shadows.inner(isLight),
            overflow: "hidden",
          },
          scroller: {
            overflow: "auto !important",
            borderRadius: "24px",
            "&::-webkit-scrollbar": { display: "none" },
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          },
          flexContainer: { display: "inline-flex", minWidth: "100%" },
          indicator: { display: "none" },
        },
      },

      MuiTab: {
        styleOverrides: {
          root: {
            borderRadius: "20px",
            minHeight: "36px",
            margin: "0 4px",
            transition: "all 0.3s cubic-bezier(0.2, 0, 0, 1)",
            fontFamily: "var(--font-jakarta), sans-serif",
            fontWeight: 600,
            textTransform: "none",
            color: colors.textSecondary,
            "&.Mui-selected": {
              backgroundColor: colors.paper,
              color: accentColor,
              boxShadow: shadows.outerSm(colors.clayShadow, isLight),
            },
          },
        },
      },

      // TOGGLE BUTTON
      MuiToggleButtonGroup: {
        styleOverrides: {
          root: {
            backgroundColor: colors.input,
            borderRadius: "24px",
            boxShadow: shadows.inner(isLight),
            padding: "4px",
            border: "none",
            gap: "4px",
          },
          grouped: {
            border: "none !important",
            borderRadius: "20px !important",
            margin: "0 !important",
          },
        },
      },

      MuiToggleButton: {
        styleOverrides: {
          root: {
            borderRadius: "20px",
            border: "none",
            fontWeight: 600,
            textTransform: "none",
            fontFamily: "var(--font-jakarta), sans-serif",
            transition: "all 0.3s cubic-bezier(0.2, 0, 0, 1)",
            color: colors.textSecondary,
            "&.Mui-selected": {
              backgroundColor: colors.paper,
              color: accentColor,
              fontWeight: 700,
              boxShadow: shadows.outerSm(colors.clayShadow, isLight),
              "&:hover": { backgroundColor: colors.paper },
            },
          },
        },
      },

      // LISTS
      MuiList: {
        styleOverrides: {
          root: { padding: "8px" },
        },
      },

      MuiListItem: {
        styleOverrides: {
          root: { borderRadius: "16px", marginBottom: "2px" },
        },
      },

      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: "18px",
            margin: "4px 8px",
            transition: "all 0.25s cubic-bezier(0.2, 0, 0, 1)",
            "&:hover": { backgroundColor: colors.input },
            "&.Mui-selected": {
              backgroundColor: colors.bg,
              boxShadow: shadows.inner(isLight),
              color: accentColor,
              "&:hover": { backgroundColor: colors.bg },
            },
          },
        },
      },

      MuiListItemText: {
        styleOverrides: {
          primary: { fontWeight: 600 },
          secondary: { fontWeight: 500, fontSize: "0.8rem" },
        },
      },

      MuiListItemIcon: {
        styleOverrides: {
          root: { minWidth: "40px", color: colors.textSecondary },
        },
      },

      // DRAWER
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: colors.bg,
            border: "none",
            borderRadius: "40px 0 0 40px",
            boxShadow: isLight ? "-15px 0 30px #d1d9e6" : "-15px 0 30px #0e1014",
            backgroundImage: "none",
          },
        },
      },

      // DIALOG
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: "32px",
            backgroundColor: colors.paper,
            backgroundImage: "none",
            margin: "16px",
            boxShadow: isLight
              ? `20px 20px 40px ${colors.clayShadow}, -10px -10px 30px #FFFFFF`
              : `20px 20px 40px #0B0E12, -6px -6px 20px rgba(255,255,255,0.03)`,
          },
          root: {
            "& .MuiBackdrop-root": {
              backdropFilter: "blur(8px)",
              backgroundColor: isLight ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.55)",
            },
          },
        },
      },

      MuiDialogTitle: {
        styleOverrides: {
          root: {
            fontFamily: "var(--font-jakarta), sans-serif",
            fontWeight: 800,
            fontSize: "1.2rem",
            padding: "24px 24px 8px",
          },
        },
      },

      MuiDialogContent: {
        styleOverrides: {
          root: { padding: "8px 24px 16px" },
        },
      },

      MuiDialogActions: {
        styleOverrides: {
          root: { padding: "8px 24px 24px", gap: "8px" },
        },
      },

      // SWITCH
      MuiSwitch: {
        styleOverrides: {
          root: { padding: "8px" },
          track: {
            borderRadius: "999px",
            backgroundColor: isLight ? "#C6CEDA" : "#14171D",
            opacity: "1 !important" as any,
            boxShadow: isLight
              ? "inset 2px 2px 4px #B0B8C8, inset -2px -2px 4px #FFFFFF"
              : "inset 2px 2px 4px #0B0E12",
          },
          thumb: {
            boxShadow: isLight
              ? "2px 2px 4px #B0B8C8, -2px -2px 4px #FFFFFF"
              : "2px 2px 4px #0B0E12",
          },
          switchBase: {
            "&.Mui-checked + .MuiSwitch-track": {
              backgroundColor: `${accentColor} !important`,
              opacity: "1 !important" as any,
            },
          },
        },
      },

      // FEEDBACK
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: "16px",
            border: "none",
            fontWeight: 600,
            boxShadow: "none",
          },
          standardSuccess: {
            backgroundColor: alpha(PALETTE.success, 0.15),
            color: isLight ? "#1b5e35" : PALETTE.success,
          },
          standardError: {
            backgroundColor: alpha(PALETTE.error, 0.15),
            color: isLight ? "#b5000a" : PALETTE.error,
          },
          standardWarning: {
            backgroundColor: alpha(PALETTE.warning, 0.2),
            color: isLight ? "#7c5a00" : PALETTE.warning,
          },
          standardInfo: {
            backgroundColor: alpha(PALETTE.info, 0.15),
            color: isLight ? "#3d2a8c" : PALETTE.info,
          },
          filledSuccess: { backgroundColor: PALETTE.success, color: "#1A1C1E" },
          filledError: { backgroundColor: PALETTE.error, color: "#1A1C1E" },
          filledWarning: { backgroundColor: PALETTE.warning, color: "#1A1C1E" },
          filledInfo: { backgroundColor: PALETTE.info, color: "#1A1C1E" },
        },
      },

      MuiCircularProgress: {
        defaultProps: { thickness: 4 },
        styleOverrides: {
          root: { color: accentColor },
        },
      },

      MuiLinearProgress: {
        styleOverrides: {
          root: {
            borderRadius: "999px",
            height: "6px",
            backgroundColor: colors.input,
            boxShadow: isLight ? "inset 2px 2px 4px #C6CEDA" : "inset 2px 2px 4px #0B0E12",
          },
          bar: { borderRadius: "999px", backgroundColor: accentColor },
        },
      },

      MuiSkeleton: {
        defaultProps: { animation: "wave" },
        styleOverrides: {
          root: {
            borderRadius: "12px",
            backgroundColor: colors.input,
          },
          wave: {
            "&::after": {
              background: `linear-gradient(90deg, transparent, ${
                isLight ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.04)"
              }, transparent)`,
            },
          },
        },
      },

      // TOOLTIP
      MuiTooltip: {
        defaultProps: { arrow: true },
        styleOverrides: {
          tooltip: {
            backgroundColor: isLight ? colors.paper : "#2E3238",
            color: colors.textPrimary,
            borderRadius: "12px",
            fontSize: "0.75rem",
            fontWeight: 600,
            padding: "8px 12px",
            boxShadow: shadows.outerSm(colors.clayShadow, isLight),
          },
          arrow: { color: isLight ? colors.paper : "#2E3238" },
        },
      },
    },
  });
};
