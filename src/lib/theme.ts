// theme.ts
import { createTheme, Theme } from "@mui/material/styles";

// ─── PALETTE ────────────────────────────────────────────────────────────────
export const PALETTE = {
  light: {
    bg: "#FDFBF7",
    paper: "#FFFFFF",
    textPrimary: "#4A4A4A",
    textSecondary: "#8C8C8C",
    clayShadow: "#D1D9E6",
    highlight: "#FFFFFF",
    accent: "#A0E8AF",
  },
  dark: {
    bg: "#1A1C1E",
    paper: "#24272B",
    textPrimary: "#ECECEC",
    textSecondary: "#B0B3C7",
    clayShadow: "#0D0E10",
    highlight: "rgba(255, 255, 255, 0.05)",
    accent: "#A0E8AF",
  },
  secondary: "#A0E8AF",
  primary: "#A2D2FF",
  coral: "#FFC8DD",
  success: "#A0E8AF",
  error: "#FFADAD",
  warning: "#FFD6A5",
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

// ─── THEME FACTORY ──────────────────────────────────────────────────────────
export const getTheme = (
  mode: "light" | "dark",
  accentColor: string = PALETTE.primary,
): Theme => {
  const isLight = mode === "light";
  const colors = isLight ? PALETTE.light : PALETTE.dark;

  return createTheme({
    palette: {
      mode,
      primary: { main: accentColor, contrastText: "#3D3D3D" },
      secondary: { main: PALETTE.secondary },
      background: { default: colors.bg, paper: colors.paper },
      text: { primary: colors.textPrimary, secondary: colors.textSecondary },
      success: { main: PALETTE.success },
      error: { main: PALETTE.error },
      warning: { main: PALETTE.warning },
    },

    shape: { borderRadius: 16 },

    typography: {
      // Global default: Outfit
      fontFamily: "var(--font-outfit), sans-serif",

      h1: {
        fontFamily: "var(--font-jakarta), sans-serif",
        fontWeight: 800,
        letterSpacing: "-0.025em", // Tighten for a premium, bold feel
      },
      h2: {
        fontFamily: "var(--font-jakarta), sans-serif",
        fontWeight: 700,
        letterSpacing: "-0.015em",
      },
      h3: {
        fontFamily: "var(--font-jakarta), sans-serif",
        fontWeight: 700,
      },

      // UI Element Styling
      button: {
        fontFamily: "var(--font-outfit), sans-serif",
        fontWeight: 700, // Reduced from 800 to prevent 'heavy' look
        fontSize: "0.95rem",
        letterSpacing: "0.01em",
        textTransform: "none",
      },

      // Standardizing body readability
      body1: {
        fontSize: "1rem",
        lineHeight: 1.6,
      },
      body2: {
        fontSize: "0.875rem",
        lineHeight: 1.5,
      },
    },

    clay: {
      card: {
        backgroundColor: colors.bg,
        borderRadius: "32px",
        // Softer, wider shadows for a "puffy" clay feel
        boxShadow: isLight
          ? `8px 8px 16px ${colors.clayShadow}, -8px -8px 16px #FFFFFF, inset 0 0 0 1px rgba(255,255,255,0.8)`
          : `8px 8px 16px #0B0E12, -8px -8px 16px rgba(255,255,255,0.03), inset 0 0 0 1px rgba(255,255,255,0.05)`,
        border: "none", // Using inner border highlight instead
      },
      box: {
        // Subtle background shift for the "recessed" look
        backgroundColor: isLight ? "#E8EDF2" : "#14171D",
        borderRadius: "24px",
        // Softer inset shadow for depth without "staining" the interior
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
        // Balanced, light-touch elevation
        boxShadow: isLight
          ? "6px 6px 12px #C6CEDA, -6px -6px 12px #FFFFFF"
          : "6px 6px 12px #0B0E12, -6px -6px 12px rgba(255,255,255,0.03)",
        "&:hover": {
          transform: "translateY(-2px)", // Vertical lift feels more natural than scaling
          boxShadow: isLight
            ? "8px 8px 16px #C6CEDA, -8px -8px 16px #FFFFFF"
            : "8px 8px 16px #0B0E12, -8px -8px 16px rgba(255,255,255,0.05)",
        },
        "&:active": {
          transform: "scale(0.98)",
          // Use inset shadow only on active to signal a "click"
          boxShadow: isLight
            ? "inset 4px 4px 8px #C6CEDA, inset -4px -4px 8px #FFFFFF"
            : "inset 4px 4px 8px #0B0E12, inset -4px -4px 8px rgba(255,255,255,0.05)",
        },
      },
    },

    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: colors.bg,
            transition: "background-color 0.4s ease",
            // 3. Ensuring global body uses Outfit
            fontFamily: "var(--font-outfit), sans-serif",
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: colors.bg,
            border: "none",
            borderRadius: "40px 0 0 40px",
            boxShadow: isLight
              ? "-15px 0 30px #d1d9e6"
              : "-15px 0 30px #0e1014",
            backgroundImage: "none",
          },
        },
      },
      MuiAvatar: {
        styleOverrides: {
          root: { borderRadius: "8px" },
          img: { objectFit: "contain", width: "100%", height: "100%" },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            margin: "8px",
            backgroundImage: "none",
            backgroundColor: colors.paper,
            borderRadius: "32px",
            // Modernized transition for a "weightier" feel
            transition: "all 0.3s cubic-bezier(0.2, 0, 0, 1)",
            // Use subtle, diffused shadows rather than harsh offsets
            boxShadow: isLight
              ? `10px 10px 20px ${colors.clayShadow}, -10px -10px 20px ${colors.highlight}`
              : `12px 12px 24px ${colors.clayShadow}, -6px -6px 15px rgba(255, 255, 255, 0.03)`,
            // Subtle border for definition without visual clutter
            border: isLight
              ? "1px solid rgba(255, 255, 255, 0.9)"
              : "1px solid rgba(255, 255, 255, 0.05)",
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true, disableRipple: true },
        styleOverrides: {
          root: {
            borderRadius: "24px",
            padding: "12px 28px",
            textTransform: "none",
            fontWeight: 700,
            fontFamily: "var(--font-jakarta), sans-serif",
            // Smooth, responsive transition
            transition: "all 0.3s cubic-bezier(0.2, 0, 0, 1)",
            // Modern Clay: Soft outer shadow + thin inner highlight border
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
            // Soft, diffuse glow for action buttons
            boxShadow: `0 8px 16px ${accentColor}40`,
            "&:hover": {
              backgroundColor: accentColor,
              filter: "brightness(1.05)",
              boxShadow: `0 12px 20px ${accentColor}60`,
            },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: {
            minHeight: "48px",
            width: "100%",
            padding: "6px",
            backgroundColor: isLight ? "#E8EDF2" : "#14171D", // Using new palette base
            borderRadius: "24px",
            // Recessed track effect
            boxShadow: isLight
              ? "inset 4px 4px 8px #C6CEDA, inset -4px -4px 8px #FFFFFF"
              : "inset 4px 4px 8px #0B0E12, inset -4px -4px 8px rgba(255,255,255,0.03)",
          },
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
              // Floating "clay" card look
              backgroundColor: colors.paper,
              color: accentColor,
              boxShadow: isLight
                ? "4px 4px 8px #C6CEDA, -4px -4px 8px #FFFFFF"
                : "4px 4px 8px #0B0E12, -4px -4px 8px rgba(255,255,255,0.05)",
            },
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: "18px",
            margin: "4px 8px",
            "&.Mui-selected": {
              backgroundColor: colors.bg,
              boxShadow: isLight
                ? "inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #ffffff"
                : "inset 6px 6px 12px #0e1014",
              color: accentColor,
            },
          },
        },
      },
    },
  });
};
