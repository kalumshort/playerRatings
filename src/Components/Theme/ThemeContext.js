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
  alpha,
  lighten,
} from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { motion } from "framer-motion";

// --- 1. PHYSICS ENGINE ---
const buttonMotionVariants = {
  initial: { scale: 1, rotate: 0, y: 0 },
  hover: {
    scale: 1.05,
    y: -3,
    rotate: -2,
    transition: { type: "spring", stiffness: 300, damping: 15 },
  },
  tap: {
    scale: 0.95,
    y: 2,
    rotate: 0,
    transition: { type: "spring", stiffness: 600, damping: 12 },
  },
};

// --- 2. PALETTE ---
const PALETTE = {
  light: {
    bg: "#FDFBF7",
    paper: "#FFFFFF",
    textPrimary: "#4A4A4A",
    textSecondary: "#8C8C8C",
  },
  dark: {
    bg: "#2D3142",
    paper: "#393D50",
    textPrimary: "#F0F0F0",
    textSecondary: "#B0B3C7",
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

    // Create the "Lip" color (darker shade for 3D depth)
    const primaryMain = accentColor;

    return createTheme({
      palette: {
        mode: themeMode,
        primary: { main: primaryMain, contrastText: "#3D3D3D" },
        secondary: { main: PALETTE.secondary },
        background: { default: colors.bg, paper: colors.paper },
        text: { primary: colors.textPrimary, secondary: colors.textSecondary },
      },
      shape: { borderRadius: 32 },

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
            @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');
            body { background-color: ${colors.bg}; transition: background-color 0.4s ease; }
          `,
        },

        // --- BUTTON CONFIGURATION ---
        MuiButton: {
          defaultProps: {
            // 1. PHYSICS (Keep the bounce)
            component: motion.button,
            variants: buttonMotionVariants,
            initial: "initial",
            whileHover: "hover",
            whileTap: "tap",
            disableRipple: true, // Clean interaction
          },
          styleOverrides: {
            root: {
              borderRadius: "50px", // Full Pill Shape
              padding: "12px 32px",
              transition: "all 0.2s ease",
              fontWeight: 800,
              letterSpacing: "0.02em",
              textTransform: "none",
              // Remove default Material elevation
              boxShadow: "none",
              "&:hover": {
                boxShadow: "none",
              },
            },

            // 2. THE CLEAN "CONTAINED" STYLE
            containedPrimary: {
              backgroundColor: primaryMain,
              color: "#3D3D3D",
              border: "none", // Removed the border for a cleaner look

              // No box-shadows at all. Just pure color.
              boxShadow: "none",

              "&:hover": {
                // Just a slight color shift
                backgroundColor: lighten(primaryMain, 0.15),
                boxShadow: "none",
              },
              "&:active": {
                boxShadow: "none",
              },
            },

            // 3. THE "TEXT" STYLE (No background)
            text: {
              backgroundColor: "transparent",
              "&:hover": {
                backgroundColor: alpha(primaryMain, 0.1),
              },
            },
          },
        },

        // Clay Cards
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: "none",
              margin: "8px",
              border: "none",
              boxShadow: isLight
                ? "inset 0px 2px 0px rgba(255, 255, 255, 0.6), 0px 10px 40px -10px rgba(166, 175, 195, 0.3)"
                : "inset 0px 1px 0px rgba(255, 255, 255, 0.1), 0px 10px 40px -10px rgba(0,0,0,0.5)",
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
