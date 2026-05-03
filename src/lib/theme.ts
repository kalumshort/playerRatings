import React from "react";
import { createTheme, Theme, alpha } from "@mui/material/styles";

// ─── PASTEL PALETTE ─────────────────────────────────────────────────────────
export const PALETTE = {
  light: {
    bg: "#FDFBF7",
    paper: "#FFFFFF",
    textPrimary: "#4A4A4A",
    textSecondary: "#8C8C8C",
    clayShadow: "#C4B49A",
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
  primary: "#A2D2FF",
  secondary: "#CDB4DB",
  success: "#A0E8AF",
  error: "#FFADAD",
  warning: "#FFD6A5",
  info: "#C9B8FF",
  coral: "#FFC8DD",
} as const;

// ─── DOMAIN SEMANTIC TOKENS ─────────────────────────────────────────────────
const DOMAIN = {
  form: {
    good: "linear-gradient(135deg, #66bb6a 0%, #1b5e20 100%)",
    poor: "linear-gradient(135deg, #ff7043 0%, #bf360c 100%)",
    inForm: "linear-gradient(135deg, #42a5f5 0%, #0d47a1 100%)",
    goodSolid: "#43a047",
    poorSolid: "#e64a19",
    inFormSolid: "#1e88e5",
  },
  motm: {
    goldStart: "#FFE27A",
    goldEnd: "#F5B300",
    gold: "#FFD700",
    bronze: "#7A4F00",
    bronzeAccent: "#B7791F",
  },
  cards: {
    yellow: "#F6E05E",
    yellowText: "#744210",
    yellowBg: "#FEF3C7",
    red: "#FEB2B2",
    redText: "#742A2A",
    redBg: "#FED7D7",
  },
  event: {
    goal: "#A0E8AF",
    goalText: "#2F5C34",
    goalBg: "#C6F6D5",
    assist: "#A2D2FF",
    assistText: "#2B4C6F",
    sub: "#C9B8FF",
    subText: "#3D2A8C",
  },
} as const;

// ─── TYPE AUGMENTATION ──────────────────────────────────────────────────────
type FormPalette = {
  good: string;
  poor: string;
  inForm: string;
  goodSolid: string;
  poorSolid: string;
  inFormSolid: string;
};
type MotmPalette = {
  goldStart: string;
  goldEnd: string;
  gold: string;
  bronze: string;
  bronzeAccent: string;
};
type CardsPalette = {
  yellow: string;
  yellowText: string;
  yellowBg: string;
  red: string;
  redText: string;
  redBg: string;
};
type EventPalette = {
  goal: string;
  goalText: string;
  goalBg: string;
  assist: string;
  assistText: string;
  sub: string;
  subText: string;
};

declare module "@mui/material/styles" {
  interface Palette {
    coral: Palette["primary"];
    form: FormPalette;
    motm: MotmPalette;
    cards: CardsPalette;
    event: EventPalette;
  }
  interface PaletteOptions {
    coral?: PaletteOptions["primary"];
    form?: FormPalette;
    motm?: MotmPalette;
    cards?: CardsPalette;
    event?: EventPalette;
  }
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

declare module "@mui/material/Paper" {
  interface PaperPropsVariantOverrides {
    sm: true;
    pill: true;
    flat: true;
  }
}

// ─── SHADOW HELPERS ─────────────────────────────────────────────────────────
// Claymorphism mixin (raised surfaces): single drop shadow + thick border + inset highlights
type ClaySize = "lg" | "md" | "sm";
const clayMixin = (
  size: ClaySize,
  isLight: boolean,
  clayShadow: string,
): React.CSSProperties => {
  const drop = size === "lg" ? 7 : size === "md" ? 5 : 4;
  return {
    border: isLight
      ? "2.5px solid rgba(255,255,255,0.82)"
      : "2px solid rgba(255,255,255,0.07)",
    boxShadow: isLight
      ? `0 ${drop}px 0 0 ${clayShadow}, inset 0 2px 0 rgba(255,255,255,0.95), inset 0 -2px 0 rgba(0,0,0,0.04)`
      : `0 ${drop}px 0 0 ${clayShadow}, inset 0 2px 0 rgba(255,255,255,0.08), inset 0 -2px 0 rgba(0,0,0,0.4)`,
  };
};

// Neumorphism inset helpers (kept for inputs, tabs, toggle group — recessed feel)
const innerShadow = (isLight: boolean) =>
  isLight
    ? "inset 4px 4px 8px #C6CEDA, inset -4px -4px 8px #FFFFFF"
    : "inset 4px 4px 8px #0B0E12, inset -4px -4px 8px rgba(255,255,255,0.03)";

const innerFocusShadow = (accentColor: string, isLight: boolean) =>
  isLight
    ? `inset 3px 3px 6px #C6CEDA, inset -3px -3px 6px #FFFFFF, 0 0 0 2px ${accentColor}`
    : `inset 4px 4px 8px #0B0E12, 0 0 0 2px ${accentColor}`;

// ─── THEME FACTORY ──────────────────────────────────────────────────────────
export const getTheme = (
  mode: "light" | "dark",
  accentColor: string = PALETTE.primary,
): Theme => {
  const isLight = mode === "light";
  const colors = isLight ? PALETTE.light : PALETTE.dark;
  const clay = (size: ClaySize) => clayMixin(size, isLight, colors.clayShadow);

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
      coral: { main: PALETTE.coral },
      form: DOMAIN.form,
      motm: DOMAIN.motm,
      cards: DOMAIN.cards,
      event: DOMAIN.event,
    },

    shape: { borderRadius: 18 },

    // ─── CLAY TOKENS (back-compat for `theme.clay?.card / .box / .button`) ───
    clay: {
      card: {
        backgroundColor: colors.paper,
        borderRadius: 18,
        ...clay("lg"),
      },
      box: {
        backgroundColor: colors.input,
        borderRadius: 18,
        boxShadow: innerShadow(isLight),
        border: "none",
      },
      button: {
        backgroundColor: colors.paper,
        borderRadius: 100,
        color: colors.textPrimary,
        fontWeight: 800,
        transition: "all 0.18s cubic-bezier(0.2, 0, 0, 1)",
        ...clay("sm"),
        "&:hover": {
          transform: "translateY(-1px)",
          boxShadow: isLight
            ? `0 5px 0 0 ${colors.clayShadow}, inset 0 2px 0 rgba(255,255,255,0.95), inset 0 -2px 0 rgba(0,0,0,0.04)`
            : `0 5px 0 0 ${colors.clayShadow}, inset 0 2px 0 rgba(255,255,255,0.08), inset 0 -2px 0 rgba(0,0,0,0.4)`,
        },
        "&:active": {
          transform: "translateY(2px)",
          boxShadow: isLight
            ? `0 2px 0 0 ${colors.clayShadow}, inset 0 2px 0 rgba(255,255,255,0.95), inset 0 -2px 0 rgba(0,0,0,0.04)`
            : `0 2px 0 0 ${colors.clayShadow}, inset 0 2px 0 rgba(255,255,255,0.08), inset 0 -2px 0 rgba(0,0,0,0.4)`,
        },
      },
    },

    // ─── TYPOGRAPHY ───────────────────────────────────────────────
    typography: {
      fontFamily: "var(--font-outfit), sans-serif",
      h1: {
        fontFamily: "var(--font-jakarta), sans-serif",
        fontWeight: 800,
        fontSize: "2rem",
        letterSpacing: "-0.025em",
      },
      h2: {
        fontFamily: "var(--font-jakarta), sans-serif",
        fontWeight: 800,
        fontSize: "1.5rem",
        letterSpacing: "-0.015em",
      },
      h3: {
        fontFamily: "var(--font-jakarta), sans-serif",
        fontWeight: 700,
        fontSize: "1.25rem",
      },
      h4: {
        fontFamily: "var(--font-jakarta), sans-serif",
        fontWeight: 700,
        fontSize: "1.125rem",
      },
      h5: {
        fontFamily: "var(--font-jakarta), sans-serif",
        fontWeight: 700,
        fontSize: "1rem",
      },
      h6: {
        fontFamily: "var(--font-jakarta), sans-serif",
        fontWeight: 700,
        fontSize: "0.9rem",
      },
      button: {
        fontFamily: "var(--font-outfit), sans-serif",
        fontWeight: 800,
        fontSize: "0.95rem",
        letterSpacing: "0.01em",
        textTransform: "none",
      },
      body1: { fontSize: "1rem", lineHeight: 1.6 },
      body2: { fontSize: "0.875rem", lineHeight: 1.5 },
      caption: { fontWeight: 600, letterSpacing: 0.3, fontSize: "0.75rem" },
      overline: { fontWeight: 800, letterSpacing: 1.5, fontSize: "0.65rem" },
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

      MuiButtonBase: {
        defaultProps: { disableRipple: true },
      },

      // APP BAR — claymorphism: solid bg, bottom drop shadow
      MuiAppBar: {
        defaultProps: { elevation: 0, color: "transparent" },
        styleOverrides: {
          root: {
            backgroundColor: colors.bg,
            backgroundImage: "none",
            borderBottom: isLight
              ? "2px solid rgba(255,255,255,0.82)"
              : "2px solid rgba(255,255,255,0.07)",
            boxShadow: isLight
              ? `0 4px 0 0 ${colors.clayShadow}`
              : `0 4px 0 0 ${colors.clayShadow}`,
          },
        },
      },

      MuiToolbar: {
        styleOverrides: {
          root: { minHeight: "64px !important" },
        },
      },

      // PAPER — the main clay surface, with variants
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundImage: "none",
            backgroundColor: colors.paper,
            borderRadius: 26,
            transition: "all 0.3s cubic-bezier(0.2, 0, 0, 1)",
            ...clay("lg"),
          },
        },
        variants: [
          {
            props: { variant: "sm" },
            style: {
              backgroundImage: "none",
              backgroundColor: colors.paper,
              borderRadius: 18,
              transition: "all 0.3s cubic-bezier(0.2, 0, 0, 1)",
              ...clayMixin("md", isLight, colors.clayShadow),
            },
          },
          {
            props: { variant: "pill" },
            style: {
              backgroundImage: "none",
              backgroundColor: colors.paper,
              borderRadius: 100,
              transition: "all 0.3s cubic-bezier(0.2, 0, 0, 1)",
              ...clayMixin("sm", isLight, colors.clayShadow),
            },
          },
          {
            props: { variant: "flat" },
            style: {
              backgroundImage: "none",
              backgroundColor: colors.input,
              borderRadius: 18,
              boxShadow: "none",
              border: isLight
                ? "1px solid rgba(196,180,154,0.3)"
                : "1px solid rgba(255,255,255,0.06)",
            },
          },
        ],
      },

      // CARD — inherits from Paper
      MuiCard: {
        defaultProps: { elevation: 0 },
      },

      MuiCardContent: {
        styleOverrides: {
          root: {
            "&:last-child": { paddingBottom: 16 },
          },
        },
      },

      // AVATAR — small clay
      MuiAvatar: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 12,
            ...clayMixin("sm", isLight, colors.clayShadow),
          }),
          img: { objectFit: "contain", width: "100%", height: "100%" },
        },
      },

      // DIVIDER
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: isLight
              ? "rgba(0,0,0,0.07)"
              : "rgba(255,255,255,0.06)",
            margin: "4px 0",
          },
        },
      },

      // CHIP — pill, small clay
      MuiChip: {
        defaultProps: { variant: "filled" },
        styleOverrides: {
          root: {
            borderRadius: 100,
            fontWeight: 800,
            fontSize: "0.75rem",
            height: 28,
            transition: "all 0.2s ease",
            backgroundColor: colors.input,
            ...clayMixin("sm", isLight, colors.clayShadow),
            "&:hover": { filter: "brightness(1.04)" },
          },
          label: { paddingLeft: "12px", paddingRight: "12px" },
          colorPrimary: {
            backgroundColor: alpha(accentColor, 0.18),
            color: accentColor,
            border: "none",
            boxShadow: "none",
          },
          colorSecondary: {
            backgroundColor: alpha(PALETTE.secondary, 0.18),
            color: isLight ? "#1b5e35" : PALETTE.secondary,
            border: "none",
            boxShadow: "none",
          },
          colorSuccess: {
            backgroundColor: alpha(PALETTE.success, 0.18),
            color: isLight ? "#1b5e35" : PALETTE.success,
            border: "none",
            boxShadow: "none",
          },
          colorError: {
            backgroundColor: alpha(PALETTE.error, 0.18),
            color: isLight ? "#b5000a" : PALETTE.error,
            border: "none",
            boxShadow: "none",
          },
          colorWarning: {
            backgroundColor: alpha(PALETTE.warning, 0.22),
            color: isLight ? "#7c5a00" : PALETTE.warning,
            border: "none",
            boxShadow: "none",
          },
          colorInfo: {
            backgroundColor: alpha(PALETTE.info, 0.18),
            color: isLight ? "#3d2a8c" : PALETTE.info,
            border: "none",
            boxShadow: "none",
          },
        },
      },

      // BUTTONS — pill, claymorphism, press-down on active
      MuiButton: {
        defaultProps: { disableElevation: true, disableRipple: true },
        styleOverrides: {
          root: {
            borderRadius: 100,
            padding: "12px 28px",
            textTransform: "none",
            fontWeight: 800,
            fontFamily: "var(--font-jakarta), sans-serif",
            transition: "all 0.18s cubic-bezier(0.2, 0, 0, 1)",
            ...clayMixin("sm", isLight, colors.clayShadow),
            "&:hover": {
              transform: "translateY(-1px)",
              boxShadow: isLight
                ? `0 5px 0 0 ${colors.clayShadow}, inset 0 2px 0 rgba(255,255,255,0.95), inset 0 -2px 0 rgba(0,0,0,0.04)`
                : `0 5px 0 0 ${colors.clayShadow}, inset 0 2px 0 rgba(255,255,255,0.08), inset 0 -2px 0 rgba(0,0,0,0.4)`,
            },
            "&:active": {
              transform: "translateY(2px)",
              boxShadow: isLight
                ? `0 2px 0 0 ${colors.clayShadow}, inset 0 2px 0 rgba(255,255,255,0.95), inset 0 -2px 0 rgba(0,0,0,0.04)`
                : `0 2px 0 0 ${colors.clayShadow}, inset 0 2px 0 rgba(255,255,255,0.08), inset 0 -2px 0 rgba(0,0,0,0.4)`,
            },
            "&.Mui-disabled": {
              boxShadow: "none",
              border: "none",
              opacity: 0.6,
            },
          },
          containedPrimary: {
            backgroundColor: accentColor,
            color: "#1A1C1E",
            "&:hover": {
              backgroundColor: accentColor,
              filter: "brightness(1.05)",
            },
          },
          containedSecondary: {
            backgroundColor: PALETTE.secondary,
            color: "#1A1C1E",
            "&:hover": {
              backgroundColor: PALETTE.secondary,
              filter: "brightness(1.05)",
            },
          },
          outlined: {
            borderColor: isLight ? colors.clayShadow : "rgba(255,255,255,0.12)",
            "&:hover": {
              borderColor: isLight
                ? colors.clayShadow
                : "rgba(255,255,255,0.18)",
            },
          },
          text: {
            boxShadow: "none",
            border: "none",
            "&:hover": {
              boxShadow: "none",
              backgroundColor: alpha(accentColor, 0.08),
            },
            "&:active": { boxShadow: "none", transform: "none" },
          },
          sizeSmall: {
            padding: "8px 18px",
            fontSize: "0.8rem",
          },
          sizeLarge: { padding: "16px 36px", fontSize: "1.05rem" },
        },
      },

      MuiIconButton: {
        defaultProps: { disableRipple: true },
        styleOverrides: {
          root: {
            borderRadius: 14,
            transition: "all 0.18s cubic-bezier(0.2, 0, 0, 1)",
            "&:hover": {
              backgroundColor: colors.input,
              transform: "translateY(-1px)",
            },
            "&:active": { transform: "scale(0.93)" },
          },
        },
      },

      // INPUTS — keep neumorphic recessed feel (hybrid)
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 18,
            backgroundColor: colors.input,
            boxShadow: innerShadow(isLight),
            transition: "box-shadow 0.25s cubic-bezier(0.2, 0, 0, 1)",
            "& .MuiOutlinedInput-notchedOutline": { border: "none" },
            "&:hover .MuiOutlinedInput-notchedOutline": { border: "none" },
            "&.Mui-focused": {
              boxShadow: innerFocusShadow(accentColor, isLight),
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              border: "none",
            },
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
            borderRadius: 12,
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

      // TABS — keep neumorphic recessed container (hybrid)
      MuiTabs: {
        styleOverrides: {
          root: {
            minHeight: 48,
            width: "100%",
            padding: "6px",
            backgroundColor: colors.input,
            borderRadius: 24,
            boxShadow: innerShadow(isLight),
            overflow: "hidden",
          },
          scroller: {
            overflow: "auto !important",
            borderRadius: 24,
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
            borderRadius: 20,
            minHeight: 36,
            margin: "0 4px",
            transition: "all 0.3s cubic-bezier(0.2, 0, 0, 1)",
            fontFamily: "var(--font-jakarta), sans-serif",
            fontWeight: 700,
            textTransform: "none",
            color: colors.textSecondary,
            "&.Mui-selected": {
              backgroundColor: colors.paper,
              color: accentColor,
              ...clayMixin("sm", isLight, colors.clayShadow),
            },
          },
        },
      },

      // TOGGLE BUTTON — keep neumorphic recessed group (hybrid)
      MuiToggleButtonGroup: {
        styleOverrides: {
          root: {
            backgroundColor: colors.input,
            borderRadius: 24,
            boxShadow: innerShadow(isLight),
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
            borderRadius: 20,
            border: "none",
            fontWeight: 700,
            textTransform: "none",
            fontFamily: "var(--font-jakarta), sans-serif",
            transition: "all 0.3s cubic-bezier(0.2, 0, 0, 1)",
            color: colors.textSecondary,
            "&.Mui-selected": {
              backgroundColor: colors.paper,
              color: accentColor,
              fontWeight: 800,
              ...clayMixin("sm", isLight, colors.clayShadow),
              "&:hover": { backgroundColor: colors.paper },
            },
          },
        },
      },

      // BOTTOM NAVIGATION — clay top edge
      MuiBottomNavigation: {
        styleOverrides: {
          root: {
            backgroundColor: colors.paper,
            borderTop: isLight
              ? "2px solid rgba(255,255,255,0.82)"
              : "2px solid rgba(255,255,255,0.07)",
            boxShadow: isLight
              ? `0 -4px 0 0 ${colors.clayShadow}`
              : `0 -4px 0 0 ${colors.clayShadow}`,
          },
        },
      },

      MuiBottomNavigationAction: {
        styleOverrides: {
          root: {
            color: colors.textSecondary,
            "&.Mui-selected": { color: accentColor },
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
          root: { borderRadius: 16, marginBottom: 2 },
        },
      },

      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 18,
            margin: "4px 8px",
            transition: "all 0.25s cubic-bezier(0.2, 0, 0, 1)",
            "&:hover": { backgroundColor: colors.input },
            "&.Mui-selected": {
              backgroundColor: colors.bg,
              boxShadow: innerShadow(isLight),
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
          root: { minWidth: 40, color: colors.textSecondary },
        },
      },

      // DRAWER
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: colors.bg,
            backgroundImage: "none",
            borderRadius: "32px 0 0 32px",
            border: isLight
              ? "2.5px solid rgba(255,255,255,0.82)"
              : "2px solid rgba(255,255,255,0.07)",
            borderRight: "none",
            boxShadow: isLight
              ? `-7px 0 0 0 ${colors.clayShadow}`
              : `-7px 0 0 0 ${colors.clayShadow}`,
          },
        },
      },

      // DIALOG
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 26,
            backgroundColor: colors.paper,
            backgroundImage: "none",
            margin: 16,
            ...clay("lg"),
          },
          root: {
            "& .MuiBackdrop-root": {
              backdropFilter: "blur(8px)",
              backgroundColor: isLight
                ? "rgba(0,0,0,0.15)"
                : "rgba(0,0,0,0.55)",
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
            borderRadius: 999,
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
            borderRadius: 16,
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
            borderRadius: 999,
            height: 6,
            backgroundColor: colors.input,
            boxShadow: isLight
              ? "inset 2px 2px 4px #C6CEDA"
              : "inset 2px 2px 4px #0B0E12",
          },
          bar: { borderRadius: 999, backgroundColor: accentColor },
        },
      },

      MuiSkeleton: {
        defaultProps: { animation: "wave" },
        styleOverrides: {
          root: {
            borderRadius: 12,
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

      // TOOLTIP — small clay
      MuiTooltip: {
        defaultProps: { arrow: true },
        styleOverrides: {
          tooltip: {
            backgroundColor: isLight ? colors.paper : "#2E3238",
            color: colors.textPrimary,
            borderRadius: 12,
            fontSize: "0.75rem",
            fontWeight: 600,
            padding: "8px 12px",
            ...clayMixin("sm", isLight, colors.clayShadow),
          },
          arrow: { color: isLight ? colors.paper : "#2E3238" },
        },
      },
    },
  });
};
