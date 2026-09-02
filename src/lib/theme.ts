import React from "react";
import { createTheme, Theme, alpha } from "@mui/material/styles";

// ─── PASTEL PALETTE ─────────────────────────────────────────────────────────
// Surfaces form a four-step ramp per mode: bg < sunken < paper <= raised in
// dark, and sunken < bg < paper in light. The old values put page and card at
// 1.06:1 in dark and 1.10:1 in light — below the ~1.2:1 needed to see an edge —
// while `input` sat *lighter* than `paper` in dark, which inverted every
// segmented control (selected pill darker than its own track).
//
// Ratios below are WCAG 2.1 and were checked against the whole table, not
// eyeballed. Do not nudge one value alone; card/page, sunken/card and the
// hairline are load-bearing together.
export const PALETTE = {
  light: {
    bg: "#ECECF0", // card/page 1.18:1
    sunken: "#E4E4EA", // sunken/card 1.27:1
    paper: "#FFFFFF",
    raised: "#FFFFFF", // light signals "raised" with shadow, not value
    textPrimary: "#18181B",
    // Darkened from #71717A: on the new page it was 4.10:1, and it was already
    // failing at 4.40:1 on the old input colour.
    textSecondary: "#62626B", // 5.12:1 on page, 4.77:1 on sunken
    hairline: "rgba(0,0,0,0.12)", // 1.32:1 against paper
    // A raised surface needs a stronger edge than a divider drawn inside one:
    // the white card sits on the #ECECF0 page at 1.18:1, so at the hairline's
    // 0.12 the boundary is doing almost nothing. 0.18 reads as a clean edge
    // (1.53:1 on the card, 1.30:1 against the page) without turning into a
    // drawn outline the way 0.24+ does.
    edge: "rgba(0,0,0,0.18)",
  },
  dark: {
    bg: "#09090B",
    sunken: "#121216", // sunken/card 1.14:1
    paper: "#1F1F25", // card/page 1.21:1
    raised: "#2A2A31",
    textPrimary: "#FAFAFA",
    textSecondary: "#A1A1AA", // 6.40:1 on card, 5.56:1 on raised
    hairline: "rgba(255,255,255,0.10)", // 1.35:1 against paper
    // Dark already separates its surfaces by value (card/page 1.21:1) and the
    // shadow reads against a near-black page, so the edge stays at the hairline.
    edge: "rgba(255,255,255,0.10)",
  },
  primary: "#93BFEC",
  secondary: "#B9A3CC",
  success: "#86D69A",
  error: "#E89A9A",
  warning: "#E7C189",
  info: "#B0A2EC",
  coral: "#EFB6C8",
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
  // Live manager mode's own vocabulary. Previously the hot/cold badge borrowed
  // `form.poor` for hot and `form.inForm` for cold — the rendered colours were
  // right but the token NAMES said the opposite ("poor" on your best player,
  // "in form" on your worst), and there was no way to express intensity.
  //
  // Three ascending steps per direction, so a badge can say how hot, not just
  // that it is hot. `*Ink` is the foreground for a tinted (not gradient) fill
  // and is >= 4.5:1 on its own `*Tint`.
  heat: {
    infernoStart: "#FF8A3D",
    infernoEnd: "#C62828",
    fireStart: "#FFA751",
    fireEnd: "#E65100",
    warmStart: "#FFC978",
    warmEnd: "#EF8B2C",
    hotSolid: "#E65100",
    hotTint: "#FFF1E3",
    hotInk: "#8A3200",

    frozenStart: "#4FC3F7",
    frozenEnd: "#01579B",
    chillyStart: "#81D4FA",
    chillyEnd: "#0277BD",
    coldSolid: "#0277BD",
    coldTint: "#E4F5FE",
    coldInk: "#01466F",

    /** Sub demand. Deliberately not `error.main` — the pastel #E89A9A cannot
     *  carry a filling pressure ring against the pitch. */
    subDemand: "#D32F2F",
    subDemandTint: "#FDECEC",
    subDemandInk: "#8E1B1B",
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
type HeatPalette = {
  infernoStart: string;
  infernoEnd: string;
  fireStart: string;
  fireEnd: string;
  warmStart: string;
  warmEnd: string;
  hotSolid: string;
  hotTint: string;
  hotInk: string;
  frozenStart: string;
  frozenEnd: string;
  chillyStart: string;
  chillyEnd: string;
  coldSolid: string;
  coldTint: string;
  coldInk: string;
  subDemand: string;
  subDemandTint: string;
  subDemandInk: string;
};

declare module "@mui/material/styles" {
  interface Palette {
    coral: Palette["primary"];
    form: FormPalette;
    motm: MotmPalette;
    cards: CardsPalette;
    event: EventPalette;
    heat: HeatPalette;
  }
  interface PaletteOptions {
    coral?: PaletteOptions["primary"];
    form?: FormPalette;
    motm?: MotmPalette;
    cards?: CardsPalette;
    event?: EventPalette;
    heat?: HeatPalette;
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

// ─── SURFACE HELPERS ────────────────────────────────────────────────────────
// Lifts a surface off whatever sits behind it. Both modes get a shadow AND a
// border: dark mode previously returned `boxShadow: "none"` and leaned entirely
// on a 0.06-alpha hairline, so it had no working separation at all.
//
// Light mode used to contradict that and return `border: "none"`, leaning
// entirely on shadows at 0.07/0.05 alpha. Those are almost invisible over the
// #ECECF0 page — a white card on it is only 1.18:1 — so cards had no readable
// edge, while `clay.box` and Paper's `flat` variant DID draw one. That mismatch
// is why light mode looked half-finished: some surfaces were outlined and the
// main ones weren't.
//
// Takes the `edge` token, not `hairline`. They're different jobs: hairline is
// palette.divider (64 call sites, drawn INSIDE a surface), edge bounds a raised
// surface against the page and needs more weight in light mode. Nudge
// PALETTE.light.edge to taste — 0.24 reads as a deliberate outline, 0.12 all
// but disappears.
//
// Signature kept stable so existing call sites (`clay("lg")`, `clayMixin("sm", ...)`) keep working.
type ClaySize = "lg" | "md" | "sm";
const clayMixin = (
  size: ClaySize,
  isLight: boolean,
  edge: string,
): React.CSSProperties => {
  const blur = size === "lg" ? 3 : size === "md" ? 2 : 1;
  // The border is unconditional now, so "both modes get an edge" is structural
  // rather than something two branches have to keep agreeing on. Only the
  // shadow differs: it carries real weight on a near-black page, and has to
  // stay feather-light on a light one or every card looks smudged.
  return {
    border: `1px solid ${edge}`,
    boxShadow: isLight
      ? `0 1px ${blur}px rgba(0,0,0,0.07), 0 ${blur}px ${blur * 2}px rgba(0,0,0,0.05)`
      : `0 1px ${blur}px rgba(0,0,0,0.5), 0 ${blur}px ${blur * 2}px rgba(0,0,0,0.35)`,
  };
};

// ─── THEME FACTORY ──────────────────────────────────────────────────────────
export const getTheme = (
  mode: "light" | "dark",
  accentColor: string = PALETTE.primary,
): Theme => {
  const isLight = mode === "light";
  const colors = isLight ? PALETTE.light : PALETTE.dark;
  const clay = (size: ClaySize) => clayMixin(size, isLight, colors.edge);
  // Semi-transparent so a hover reads the same on a card, a well or the page.
  // A fixed colour used to darken on one surface and lighten on another.
  const hover = isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.07)";

  return createTheme({
    // ─── PALETTE ──────────────────────────────────────────────────
    palette: {
      mode,
      primary: { main: accentColor, contrastText: "#3D3D3D" },
      secondary: { main: PALETTE.secondary },
      background: { default: colors.bg, paper: colors.paper },
      text: { primary: colors.textPrimary, secondary: colors.textSecondary },
      // Was unset, so MUI defaulted it to 0.12 alpha while MuiDivider's own
      // override used 0.06–0.07. 64 call sites read this token and disagreed
      // with the component; both now come from one value.
      divider: colors.hairline,
      success: { main: PALETTE.success },
      error: { main: PALETTE.error },
      warning: { main: PALETTE.warning },
      info: { main: PALETTE.info },
      coral: { main: PALETTE.coral },
      form: DOMAIN.form,
      motm: DOMAIN.motm,
      cards: DOMAIN.cards,
      event: DOMAIN.event,
      heat: DOMAIN.heat,
    },

    shape: { borderRadius: 10 },

    // ─── CLAY TOKENS (back-compat for `theme.clay?.card / .box / .button`) ───
    // borderRadius uses string "Npx" so the same object works in both `sx`
    // (where numeric values get multiplied by theme.shape.borderRadius) and
    // `styled()` callbacks (raw CSS).
    clay: {
      card: {
        backgroundColor: colors.paper,
        borderRadius: "12px",
        ...clay("lg"),
      },
      box: {
        backgroundColor: colors.sunken,
        borderRadius: "10px",
        boxShadow: "none",
        border: `1px solid ${colors.hairline}`,
      },
      button: {
        backgroundColor: colors.paper,
        borderRadius: "8px",
        color: colors.textPrimary,
        fontWeight: 700,
        transition: "all 0.15s ease",
        ...clay("sm"),
        "&:hover": { filter: "brightness(1.04)" },
        "&:active": { filter: "brightness(0.96)" },
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

      // APP BAR — flat: subtle 1px bottom divider
      MuiAppBar: {
        defaultProps: { elevation: 0, color: "transparent" },
        styleOverrides: {
          root: {
            // `paper`, not `bg`: the bar sits over the page and needs to read
            // as a distinct surface. The divider below is its only other edge.
            backgroundColor: colors.paper,
            backgroundImage: "none",
            borderBottom: `1px solid ${colors.hairline}`,
            boxShadow: "none",
          },
        },
      },

      MuiToolbar: {
        styleOverrides: {
          root: { minHeight: "64px !important" },
        },
      },

      // PAPER — the main surface, with variants
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundImage: "none",
            backgroundColor: colors.paper,
            borderRadius: 12,
            transition: "background-color 0.3s ease, border-color 0.3s ease",
            ...clay("lg"),
          },
        },
        variants: [
          {
            props: { variant: "sm" },
            style: {
              backgroundImage: "none",
              backgroundColor: colors.paper,
              borderRadius: 10,
              transition: "background-color 0.3s ease, border-color 0.3s ease",
              ...clayMixin("md", isLight, colors.edge),
            },
          },
          {
            props: { variant: "pill" },
            style: {
              backgroundImage: "none",
              backgroundColor: colors.paper,
              borderRadius: 10,
              transition: "background-color 0.3s ease, border-color 0.3s ease",
              ...clayMixin("sm", isLight, colors.edge),
            },
          },
          {
            props: { variant: "flat" },
            style: {
              backgroundImage: "none",
              backgroundColor: colors.sunken,
              borderRadius: 10,
              boxShadow: "none",
              border: `1px solid ${colors.hairline}`,
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

      // AVATAR — plain rounded square (components opt-in to circular via sx)
      MuiAvatar: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            // backgroundColor: colors.sunken,
            border: "none",
            boxShadow: "none",
          },
          img: { objectFit: "contain", width: "100%", height: "100%" },
        },
      },

      // DIVIDER
      MuiDivider: {
        styleOverrides: {
          // borderColor now inherits palette.divider — see the note there.
          root: { margin: "4px 0" },
        },
      },

      // CHIP — flat tag
      MuiChip: {
        defaultProps: { variant: "filled" },
        styleOverrides: {
          root: {
            borderRadius: 6,
            fontWeight: 700,
            fontSize: "0.75rem",
            height: 26,
            transition: "all 0.15s ease",
            backgroundColor: colors.sunken,
            border: "none",
            boxShadow: "none",
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
            // Was #1b5e35 — a green copy-pasted from colorSuccess below, on a
            // lavender chip.
            color: isLight ? "#4a3663" : PALETTE.secondary,
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

      // BUTTONS — flat, tight radius, brightness-only feedback
      MuiButton: {
        defaultProps: { disableElevation: true, disableRipple: true },
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: "10px 20px",
            textTransform: "none",
            fontWeight: 700,
            fontFamily: "var(--font-jakarta), sans-serif",
            transition:
              "background-color 0.15s ease, filter 0.15s ease, border-color 0.15s ease",
            boxShadow: "none",
            border: "none",
            "&:hover": { filter: "brightness(1.05)" },
            "&:active": { filter: "brightness(0.96)" },
            "&.Mui-disabled": {
              boxShadow: "none",
              border: "none",
              opacity: 0.5,
            },
          },
          containedPrimary: {
            backgroundColor: accentColor,
            color: "#09090B",
            "&:hover": {
              backgroundColor: accentColor,
              filter: "brightness(1.05)",
            },
          },
          containedSecondary: {
            backgroundColor: PALETTE.secondary,
            color: "#09090B",
            "&:hover": {
              backgroundColor: PALETTE.secondary,
              filter: "brightness(1.05)",
            },
          },
          outlined: {
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: colors.hairline,
            "&:hover": {
              borderColor: isLight
                ? "rgba(0,0,0,0.22)"
                : "rgba(255,255,255,0.24)",
              backgroundColor: hover,
            },
          },
          text: {
            boxShadow: "none",
            border: "none",
            "&:hover": {
              boxShadow: "none",
              backgroundColor: alpha(accentColor, 0.08),
            },
          },
          sizeSmall: {
            padding: "6px 14px",
            fontSize: "0.8rem",
          },
          sizeLarge: { padding: "12px 28px", fontSize: "1rem" },
        },
      },

      MuiIconButton: {
        defaultProps: { disableRipple: true },
        styleOverrides: {
          root: {
            borderRadius: 8,
            transition: "background-color 0.15s ease, filter 0.15s ease",
            "&:hover": { backgroundColor: hover },
            "&:active": { filter: "brightness(0.96)" },
          },
        },
      },

      // INPUTS — flat filled surface, focus ring instead of inset shadow
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            backgroundColor: colors.sunken,
            boxShadow: "none",
            transition: "box-shadow 0.15s ease, background-color 0.15s ease",
            "& .MuiOutlinedInput-notchedOutline": { border: "none" },
            "&:hover .MuiOutlinedInput-notchedOutline": { border: "none" },
            "&.Mui-focused": {
              boxShadow: `0 0 0 2px ${accentColor}`,
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              border: "none",
            },
            "&.Mui-error": {
              boxShadow: `0 0 0 2px ${PALETTE.error}`,
            },
          },
          input: {
            fontWeight: 500,
            "&::placeholder": { opacity: 0.5 },
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
            borderRadius: 8,
            margin: "2px 6px",
            fontWeight: 500,
            transition: "background-color 0.15s ease",
            "&:hover": { backgroundColor: hover },
            "&.Mui-selected": {
              backgroundColor: alpha(accentColor, 0.15),
              color: accentColor,
              fontWeight: 700,
              "&:hover": { backgroundColor: alpha(accentColor, 0.22) },
            },
          },
        },
      },

      // MENU / POPOVER — the one place `raised` earns its place: a menu is a
      // Paper floating over a card, so at `paper` it was the same colour as the
      // thing it covered and only the shadow told them apart.
      MuiMenu: {
        styleOverrides: {
          paper: { backgroundColor: colors.raised, backgroundImage: "none" },
          list: { padding: "8px" },
        },
      },

      MuiPopover: {
        styleOverrides: {
          paper: { backgroundColor: colors.raised, backgroundImage: "none" },
        },
      },

      // TABS — recessed track, raised selected pill (see MuiTab below)
      MuiTabs: {
        styleOverrides: {
          root: {
            minHeight: 44,
            width: "100%",
            padding: "4px",
            backgroundColor: colors.sunken,
            // The track reads clearly inside a card, but sits at only ~1.07:1
            // directly on the page, where several screens put it. The hairline
            // gives it an edge on any surface.
            border: `1px solid ${colors.hairline}`,
            // Fully rounded track. The pills below match it, so the segmented
            // control reads as one shape instead of square tabs in a rounded box.
            borderRadius: 999,
            boxShadow: "none",
            overflow: "hidden",
          },
          scroller: {
            overflow: "auto !important",
            borderRadius: 999,
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
            borderRadius: 999, // matches the MuiTabs track above
            minHeight: 34,
            margin: "0 2px",
            transition: "background-color 0.2s ease, color 0.2s ease",
            fontFamily: "var(--font-jakarta), sans-serif",
            fontWeight: 700,
            textTransform: "none",
            color: colors.textSecondary,
            // paper > sunken in both modes now, so the pill reads as raised.
            // It used to be the other way round in dark: the selected tab was
            // darker than its own track.
            "&.Mui-selected": {
              backgroundColor: colors.paper,
              color: accentColor,
              ...clayMixin("sm", isLight, colors.edge),
            },
          },
        },
      },

      // TOGGLE BUTTON — recessed track, raised selected pill
      MuiToggleButtonGroup: {
        styleOverrides: {
          root: {
            backgroundColor: colors.sunken,
            borderRadius: 10,
            boxShadow: "none",
            padding: "3px",
            border: `1px solid ${colors.hairline}`, // same reason as MuiTabs
            gap: "2px",
          },
          grouped: {
            border: "none !important",
            borderRadius: "8px !important",
            margin: "0 !important",
          },
        },
      },

      MuiToggleButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            border: "none",
            fontWeight: 600,
            textTransform: "none",
            fontFamily: "var(--font-jakarta), sans-serif",
            transition: "background-color 0.2s ease, color 0.2s ease",
            color: colors.textSecondary,
            "&.Mui-selected": {
              backgroundColor: colors.paper,
              color: accentColor,
              fontWeight: 700,
              ...clayMixin("sm", isLight, colors.edge),
              "&:hover": { backgroundColor: colors.paper },
            },
          },
        },
      },

      // BOTTOM NAVIGATION — flat with 1px top divider
      MuiBottomNavigation: {
        styleOverrides: {
          root: {
            backgroundColor: colors.paper,
            borderTop: isLight
              ? "1px solid rgba(0,0,0,0.06)"
              : "1px solid rgba(255,255,255,0.06)",
            boxShadow: "none",
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
          root: { borderRadius: 8, marginBottom: 2 },
        },
      },

      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            margin: "2px 6px",
            transition: "background-color 0.15s ease, color 0.15s ease",
            "&:hover": { backgroundColor: hover },
            "&.Mui-selected": {
              backgroundColor: alpha(accentColor, 0.12),
              color: accentColor,
              "&:hover": { backgroundColor: alpha(accentColor, 0.18) },
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
            // `paper`, not `bg`: the drawer floats over the page, so painting
            // it the page colour left it with no edge of its own.
            backgroundColor: colors.paper,
            backgroundImage: "none",
            borderRadius: "12px 0 0 12px",
            border: `1px solid ${colors.hairline}`,
            borderRight: "none",
            boxShadow: isLight
              ? "-4px 0 16px rgba(0,0,0,0.08)"
              : "-4px 0 16px rgba(0,0,0,0.5)",
          },
        },
      },

      // DIALOG
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 14,
            backgroundColor: colors.paper,
            backgroundImage: "none",
            margin: 16,
            ...clay("lg"),
          },
          root: {
            "& .MuiBackdrop-root": {
              backdropFilter: "blur(8px)",
              // 0.15 was too weak to detach a white dialog from a light page,
              // and the page is darker now.
              backgroundColor: isLight ? "rgba(0,0,0,0.32)" : "rgba(0,0,0,0.6)",
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
            backgroundColor: isLight ? "#E4E4E7" : "#27272A",
            opacity: "1 !important" as any,
            boxShadow: "none",
          },
          thumb: {
            boxShadow: isLight
              ? "0 1px 2px rgba(0,0,0,0.12)"
              : "0 1px 2px rgba(0,0,0,0.5)",
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
            borderRadius: 10,
            border: "none",
            fontWeight: 500,
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
          filledSuccess: { backgroundColor: PALETTE.success, color: "#09090B" },
          filledError: { backgroundColor: PALETTE.error, color: "#09090B" },
          filledWarning: { backgroundColor: PALETTE.warning, color: "#09090B" },
          filledInfo: { backgroundColor: PALETTE.info, color: "#09090B" },
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
            backgroundColor: colors.sunken,
            boxShadow: "none",
          },
          bar: { borderRadius: 999, backgroundColor: accentColor },
        },
      },

      MuiSkeleton: {
        defaultProps: { animation: "wave" },
        styleOverrides: {
          root: {
            borderRadius: 8,
            backgroundColor: colors.sunken,
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

      // TOOLTIP — flat
      MuiTooltip: {
        defaultProps: { arrow: true },
        styleOverrides: {
          // #27272A in both modes was fine on the old #141416 card but sits at
          // 1.06:1 on the new one, so a tooltip overlapping a card vanished.
          tooltip: {
            backgroundColor: isLight ? "#27272A" : "#3A3A42",
            color: "#FAFAFA",
            borderRadius: 6,
            fontSize: "0.75rem",
            fontWeight: 500,
            padding: "6px 10px",
            border: "none",
            boxShadow: "none",
          },
          arrow: { color: isLight ? "#27272A" : "#3A3A42" },
        },
      },
    },
  });
};
