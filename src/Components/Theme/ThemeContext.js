import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";
import {
  ThemeProvider as MUIThemeProvider,
  createTheme,
  lighten,
  darken,
} from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { motion } from "framer-motion";

// --- 1. PHYSICS ENGINE (Framer Motion) ---
const buttonMotionVariants = {
  initial: { scale: 1, rotate: 0, y: 0 },
  hover: {
    scale: 1.02, // Subtle lift
    y: -2,
    transition: { type: "spring", stiffness: 300, damping: 15 },
  },
  tap: {
    scale: 0.97, // Physical press
    y: 1,
    transition: { type: "spring", stiffness: 600, damping: 12 },
  },
};

// --- 2. PALETTE ---
const PALETTE = {
  light: {
    bg: "#FDFBF7", // Warm Off-White
    paper: "#FFFFFF",
    textPrimary: "#4A4A4A",
    textSecondary: "#8C8C8C",
    shadowLight: "#FFFFFF",
    shadowDark: "#D1D9E6",
  },
  dark: {
    bg: "#2D3142",
    paper: "#393D50",
    textPrimary: "#F0F0F0",
    textSecondary: "#B0B3C7",
    shadowLight: "#3c4155",
    shadowDark: "#202330",
  },
  primary: "#A0E8AF", // Matcha Green
  secondary: "#A2D2FF", // Periwinkle
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children, accentColor = PALETTE.primary }) => {
  const [themeMode, setThemeMode] = useState("light");

  useEffect(() => {
    const saved = localStorage.getItem("themeMode");
    if (saved) setThemeMode(saved);
  }, []);

  const toggleTheme = () =>
    setThemeMode((p) => (p === "light" ? "dark" : "light"));

  const theme = useMemo(() => {
    const isLight = themeMode === "light";
    const colors = isLight ? PALETTE.light : PALETTE.dark;
    const primaryMain = accentColor;

    // --- 3. CLAY SHADOW GENERATOR ---
    const getClayShadows = (baseColor) => {
      return {
        float: isLight
          ? `10px 10px 20px ${colors.shadowDark}, -10px -10px 20px ${colors.shadowLight}`
          : `8px 8px 16px ${colors.shadowDark}, -8px -8px 16px ${colors.shadowLight}`,
        pressed: isLight
          ? `inset 6px 6px 12px ${darken(baseColor, 0.2)}, inset -6px -6px 12px ${lighten(baseColor, 0.4)}`
          : `inset 4px 4px 8px ${darken(baseColor, 0.5)}, inset -4px -4px 8px ${lighten(baseColor, 0.1)}`,
      };
    };

    const primaryShadows = getClayShadows(primaryMain);
    const surfaceShadows = getClayShadows(colors.bg);

    return createTheme({
      clay: {
        card: {
          backgroundColor: colors.bg,
          boxShadow: surfaceShadows.float,
          border: isLight
            ? "1px solid rgba(255,255,255,0.6)"
            : "1px solid rgba(255,255,255,0.05)",
        },
        box: {
          backgroundColor: colors.bg,
          boxShadow: surfaceShadows.pressed,
          border: isLight ? "1px solid rgba(255,255,255,0.4)" : "none",
        },
        button: {
          backgroundColor: colors.bg,
          borderRadius: 20,
          boxShadow: surfaceShadows.float,
          color: colors.textPrimary,
          "&:active": {
            boxShadow: surfaceShadows.pressed,
          },
        },
      },
      palette: {
        mode: themeMode,
        primary: { main: primaryMain, contrastText: "#3D3D3D" },
        secondary: { main: PALETTE.secondary },
        background: { default: colors.bg, paper: colors.paper },
        text: { primary: colors.textPrimary, secondary: colors.textSecondary },
      },
      shape: { borderRadius: "16px" },

      typography: {
        fontFamily: "'Nunito', 'Quicksand', sans-serif",
        button: {
          fontWeight: 800,
          fontSize: "1rem",
          letterSpacing: "0.02em",
          textTransform: "none",
        },
      },

      components: {
        MuiCssBaseline: {
          styleOverrides: `
            body { background-color: ${colors.bg}; transition: background-color 0.4s ease; }
          `,
        },

        // --- TABS (Global Styles) ---
        MuiTabs: {
          styleOverrides: {
            root: {
              minHeight: "unset", // Removes default huge height
              padding: 0, // Removes padding
            },
            flexContainer: {
              gap: "8px", // Maps to your gap: 0.5 (approx 4px-8px)
              paddingBottom: 0, // Explicitly remove bottom padding
            },
            indicator: {
              display: "none", // Hide the underline
            },
          },
        },

        // --- TAB (Global Styles) ---
        MuiTab: {
          styleOverrides: {
            root: {
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.9rem",
              minHeight: "40px", // Matches your requested height
              borderRadius: "20px",
              color: colors.textSecondary,
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              zIndex: 1,
              padding: "6px 16px", // Horizontal padding
              marginBottom: 0, // Ensure no margin pushes bottom

              "&.Mui-selected": {
                color: primaryMain, // Use the dynamic accent color
                backgroundColor: colors.paper, // White/Dark Grey
                // Soft floating shadow for the active pill
                boxShadow: isLight
                  ? "0 4px 12px rgba(0,0,0,0.08)"
                  : "0 4px 12px rgba(0,0,0,0.4)",
              },
            },
          },
        },

        // --- STANDARD BUTTON ---
        MuiButton: {
          defaultProps: {
            component: motion.button,
            variants: buttonMotionVariants,
            initial: "initial",
            whilehover: "hover",
            whiletap: "tap",
            disableRipple: true,
          },
          styleOverrides: {
            root: {
              borderRadius: "50px",
              padding: "14px 32px",
              boxShadow: primaryShadows.float,
              transition: "box-shadow 0.2s ease, background-color 0.2s ease",
            },
            containedPrimary: {
              backgroundColor: primaryMain,
              color: "#3D3D3D",
              "&:hover": {
                backgroundColor: primaryMain,
                boxShadow: primaryShadows.float,
              },
            },
            text: {
              boxShadow: "none",
              backgroundColor: "transparent",
            },
          },
        },

        // --- LOADING BUTTON ---
        MuiLoadingButton: {
          styleOverrides: {
            root: {
              borderRadius: "50px",
              padding: "14px 32px",
              boxShadow: primaryShadows.float,
              backgroundColor: primaryMain,
              color: "#3D3D3D",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",

              "&.Mui-loading": {
                backgroundColor: primaryMain,
                opacity: 1,
                boxShadow: primaryShadows.pressed,
                paddingLeft: "32px",
              },

              "& .MuiLoadingButton-loadingIndicator": {
                position: "absolute",
                color: "#4A4A4A",
                left: "50%",
                transform: "translate(-50%, -50%)",
              },

              "&.Mui-loading .MuiButton-startIcon, &.Mui-loading .MuiButton-endIcon, &.Mui-loading .MuiButton-label":
                {
                  visibility: "hidden",
                },
            },
          },
        },

        // --- CLAY CARDS ---
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: "none",
              margin: "8px",
              border: "none",
              boxShadow: isLight
                ? "20px 20px 60px #d1d9e6, -20px -20px 60px #ffffff"
                : "20px 20px 60px #1b1e28, -20px -20px 60px #262a38",
            },
          },
        },
      },
    });
  }, [themeMode, accentColor]);

  const value = useMemo(
    () => ({ themeMode, toggleTheme, accentColor }),
    [themeMode, accentColor],
  );

  return (
    <ThemeContext.Provider value={value}>
      <MUIThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
