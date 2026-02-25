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
      // 1. Defaulting to Outfit via the CSS variable from layout.tsx
      fontFamily: "var(--font-outfit), sans-serif",
      h1: { fontFamily: "var(--font-jakarta), sans-serif" },
      h2: { fontFamily: "var(--font-jakarta), sans-serif" },
      h3: { fontFamily: "var(--font-jakarta), sans-serif" },
      button: {
        // 2. Setting buttons to Outfit (extending your 800 weight requirement)
        fontFamily: "var(--font-outfit), sans-serif",
        fontWeight: 800,
        fontSize: "1rem",
        letterSpacing: "0.02em",
        textTransform: "none",
      },
    },

    clay: {
      card: {
        backgroundColor: colors.bg,
        borderRadius: "32px",
        boxShadow: isLight
          ? `12px 12px 24px #d1d9e6, -12px -12px 24px #ffffff, inset 4px 4px 10px rgba(255,255,255,0.8), inset -4px -4px 10px rgba(0,0,0,0.02)`
          : `12px 12px 24px #0e1014, -8px -8px 20px #2b303b, inset 2px 2px 4px rgba(255,255,255,0.05)`,
        border: isLight
          ? "1px solid rgba(255,255,255,0.7)"
          : "1px solid rgba(255,255,255,0.03)",
      },
      box: {
        backgroundColor: isLight ? "#f0f3f7" : "#1a1d24",
        borderRadius: "24px",
        boxShadow: isLight
          ? "inset 6px 6px 12px #d1d9e6, inset -6px -6px 12px #ffffff"
          : "inset 8px 8px 16px #0e1014, inset -4px -4px 12px #2b303b",
        border: "none",
      },
      button: {
        backgroundColor: colors.bg,
        borderRadius: 24,
        color: colors.textPrimary,
        fontWeight: 700,
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: isLight
          ? "6px 6px 12px #d1d9e6, -6px -6px 12px #ffffff"
          : "8px 8px 16px #0e1014, -4px -4px 12px #2b303b",
        "&:hover": {
          transform: "scale(1.02)",
          boxShadow: isLight
            ? "10px 10px 20px #c2cbd8, -10px -10px 20px #ffffff"
            : "12px 12px 24px #0a0c0f, -6px -6px 15px #2b303b",
        },
        "&:active": {
          transform: "scale(0.98)",
          boxShadow: isLight
            ? "inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #ffffff"
            : "inset 6px 6px 10px #0e1014, inset -4px -4px 10px #2b303b",
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
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: isLight
              ? `16px 16px 32px ${colors.clayShadow}, -16px -16px 32px ${colors.highlight}`
              : `20px 20px 40px ${colors.clayShadow}, -8px -8px 25px rgba(255,255,255,0.03)`,
            border: isLight
              ? "1px solid rgba(255,255,255,0.8)"
              : "1px solid rgba(255,255,255,0.1)",
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true, disableRipple: true },
        styleOverrides: {
          root: {
            borderRadius: "50px",
            padding: "14px 32px",
            transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            textTransform: "none",
            fontWeight: 800,
            // 4. Specifically ensuring buttons use Jakarta for a clean UI
            fontFamily: "var(--font-jakarta), sans-serif",
            boxShadow: isLight
              ? `10px 10px 20px #D1D9E6, -10px -10px 20px #FFFFFF, inset 2px 2px 5px rgba(255, 255, 255, 0.8), inset -2px -2px 5px rgba(209, 217, 230, 0.5)`
              : `12px 12px 24px #1a1d29, -8px -8px 20px #3c4155, inset 2px 2px 5px rgba(255, 255, 255, 0.05), inset -2px -2px 5px rgba(0, 0, 0, 0.2)`,
            "&:hover": {
              transform: "translateY(-3px)",
              boxShadow: isLight
                ? `14px 14px 28px #C1C9D6, -14px -14px 28px #FFFFFF`
                : `16px 16px 32px #151720, -10px -10px 25px #454b62`,
            },
            "&:active": {
              transform: "scale(0.95)",
              boxShadow: isLight
                ? `inset 8px 8px 15px #D1D9E6, inset -8px -8px 15px #FFFFFF`
                : `inset 10px 10px 20px #1a1d29, inset -6px -6px 15px #3c4155`,
            },
          },
          containedPrimary: {
            backgroundColor: accentColor,
            color: "#3D3D3D",
            boxShadow: isLight
              ? `10px 10px 25px rgba(160, 232, 175, 0.5), -10px -10px 20px #FFFFFF, inset 4px 4px 10px rgba(255, 255, 255, 0.4), inset -4px -4px 10px rgba(0, 0, 0, 0.1)`
              : `12px 12px 25px rgba(160, 232, 175, 0.15), -8px -8px 20px #3c4155, inset 4px 4px 10px rgba(255, 255, 255, 0.1), inset -4px -4px 10px rgba(0, 0, 0, 0.3)`,
            "&:hover": {
              backgroundColor: accentColor,
              filter: "brightness(1.04)",
            },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: {
            minHeight: "unset",
            padding: "4px",
            backgroundColor: isLight ? "#f0f3f7" : "#1a1d24",
            borderRadius: "24px",
            boxShadow: isLight
              ? "inset 3px 3px 6px #d1d9e6, inset -3px -3px 6px #ffffff"
              : "inset 4px 4px 8px #0e1014",
            width: "100%",
            "& .MuiTab-root": {
              borderRadius: "20px",
              minHeight: "40px",
              margin: "0 4px",
              transition: "0.3s",
              // 5. Using Jakarta for Tabs
              fontFamily: "var(--font-jakarta), sans-serif",
              fontWeight: 600,
              "&.Mui-selected": {
                backgroundColor: "primary.main",
                color: "white",
              },
            },
          },
          indicator: { display: "none" },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            borderRadius: "20px",
            transition: "all 0.3s ease",
            fontFamily: "var(--font-jakarta), sans-serif",
            "&.Mui-selected": {
              backgroundColor: colors.bg,
              boxShadow: isLight
                ? "4px 4px 10px rgba(0,0,0,0.08)"
                : "4px 4px 10px rgba(0,0,0,0.4)",
              color: accentColor,
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
