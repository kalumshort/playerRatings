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
} from "@mui/material/styles";

// Asset Imports (Keep your existing paths)
import playerCardBgBlackBanner from "../../assets/appAssets/playerBackgroundBaseBlackBanner.png";
import playerCardBgWhiteBanner from "../../assets/appAssets/playerBackgroundBaseWhiteBanner.png";
import playerCardBgWhite from "../../assets/appAssets/playerBackgroundBaseWhite.png";
import playerCardBgBlack from "../../assets/appAssets/playerBackgroundBaseBlack.png";

const ThemeContext = createContext();

export const ThemeProvider = ({ children, accentColor = "#00FF87" }) => {
  const [themeMode, setThemeMode] = useState("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("themeMode");
    if (savedTheme) setThemeMode(savedTheme);
  }, []);

  useEffect(() => {
    localStorage.setItem("themeMode", themeMode);
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: themeMode,
          primary: {
            main: accentColor,
            contrastText: "#000000",
          },
          ...(themeMode === "light"
            ? {
                background: {
                  default: "#f0f2f5",
                  paper: "rgba(255, 255, 255, 0.65)",
                  gradient: "linear-gradient(135deg, #ffffff 0%, #f0f4f8 100%)",
                },
                text: {
                  primary: "#1a2027",
                  secondary: "#5A6A85",
                  disabled: "#B0B8C4",
                },
                divider: "rgba(0,0,0,0.06)",
              }
            : {
                background: {
                  default: "#09090b",
                  paper: "rgba(20, 20, 20, 0.6)",
                  gradient: "linear-gradient(135deg, #18181b 0%, #09090b 100%)",
                },
                text: {
                  primary: "#ffffff",
                  secondary: "#A1A1AA",
                  disabled: "#52525B",
                },
                divider: "rgba(255,255,255,0.08)",
              }),
        },

        shape: { borderRadius: 24 },

        typography: {
          fontFamily: "'Space Mono', 'Courier New', monospace",
          h1: {
            fontFamily: "'VT323', monospace",
            textTransform: "uppercase",
            lineHeight: 1,
          },
          h2: {
            fontFamily: "'VT323', monospace",
            textTransform: "uppercase",
            lineHeight: 1.1,
          },
          h3: { fontFamily: "'VT323', monospace", textTransform: "uppercase" },
          h4: { fontFamily: "'VT323', monospace", textTransform: "uppercase" },
          h5: { fontFamily: "'VT323', monospace", textTransform: "uppercase" },
          h6: { fontFamily: "'VT323', monospace", textTransform: "uppercase" },
          button: {
            fontFamily: "'Graduate', serif",
            textTransform: "uppercase",
            fontSize: "1rem",
          },
          body1: { fontFamily: "'Space Mono', monospace", lineHeight: 1.6 },
          caption: { fontFamily: "'Space Mono', monospace" },
        },

        components: {
          // 1. PAPER (Glass Effect)
          MuiPaper: {
            styleOverrides: {
              root: ({ theme }) => {
                const isDark = theme.palette.mode === "dark";

                return {
                  // 1. GRADIENT BACKGROUND (Simulates lighting)
                  // Dark Mode: Deep metallic/glass gradient
                  // Light Mode: Frosted white gradient
                  background: isDark
                    ? "linear-gradient(135deg, rgba(35, 35, 35, 0.9) 0%, rgba(18, 18, 18, 1) 100%)"
                    : "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(245, 245, 245, 1) 100%)",

                  // 2. HEAVY BLUR (Premium Feel)
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",

                  // 3. BORDER (Subtle Outline)
                  // Slightly brighter top-left, darker bottom-right handled by the border color usually,
                  // but here we keep it simple semi-transparent.
                  border: "1px solid",
                  borderColor: isDark
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(255, 255, 255, 0.4)",

                  borderRadius: 24, // More modern, larger curves

                  // 4. THE "GLASS EDGE" (Inner Glow + Drop Shadow)
                  // '0 8px 32px' lifts the card off the page (Depth).
                  // 'inset 0 1px 0' adds a tiny white reflection on the top edge (Thickness).
                  boxShadow: isDark
                    ? "0 8px 32px 0 rgba(0, 0, 0, 0.6), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)"
                    : "0 8px 32px 0 rgba(31, 38, 135, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.6)",

                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  overflow: "hidden",

                  // Optional: Slight hover effect to make it interactive
                  "&:hover": {
                    boxShadow: isDark
                      ? "0 12px 40px 0 rgba(0, 0, 0, 0.8), inset 0 1px 0 0 rgba(255, 255, 255, 0.15)"
                      : "0 12px 40px 0 rgba(31, 38, 135, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.8)",
                  },
                };
              },
            },
          },

          // 2. BUTTONS
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                textTransform: "none",
                fontWeight: 700,
                fontSize: "1rem",
                padding: "8px 22px",
                boxShadow: "none",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: `0 4px 12px ${accentColor}40`,
                },
              },
              containedPrimary: {
                backgroundColor: accentColor,
                color: "#000",
                "&:hover": {
                  backgroundColor: accentColor,
                  filter: "brightness(1.05)",
                },
              },
              outlined: {
                borderWidth: "2px",
                "&:hover": {
                  borderWidth: "2px",
                  borderColor: accentColor,
                  color: accentColor,
                  backgroundColor: "transparent",
                },
              },
            },
          },

          // 3. INPUTS
          MuiOutlinedInput: {
            styleOverrides: {
              root: ({ theme }) => ({
                borderRadius: 16,
                backgroundColor:
                  theme.palette.mode === "light"
                    ? "rgba(255,255,255,0.4)"
                    : "rgba(0,0,0,0.2)",
                transition: "all 0.2s ease",
                "& fieldset": { borderColor: theme.palette.divider },
                "&:hover": {
                  backgroundColor:
                    theme.palette.mode === "light"
                      ? "rgba(255,255,255,0.7)"
                      : "rgba(0,0,0,0.3)",
                },
                "&.Mui-focused": {
                  backgroundColor:
                    theme.palette.mode === "light" ? "#fff" : "rgba(0,0,0,0.4)",
                  boxShadow: `0 4px 20px -2px ${accentColor}30`,
                  "& fieldset": { borderColor: `${accentColor} !important` },
                },
              }),
            },
          },

          // 4. CARDS
          MuiCard: {
            styleOverrides: {
              root: { borderRadius: 24, overflow: "hidden" },
            },
          },

          // 5. TABS (THE NEW ADDITION)
          MuiTabs: {
            styleOverrides: {
              root: ({ theme }) => ({
                minHeight: "44px",
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? "rgba(0,0,0,0.3)"
                    : "rgba(0,0,0,0.05)",
                borderRadius: 24,
                padding: 4,
                alignItems: "center",
              }),
              indicator: {
                display: "none", // Hide the underline for the "Pill" look
              },
            },
          },

          MuiTab: {
            styleOverrides: {
              root: ({ theme }) => ({
                textTransform: "uppercase",
                fontFamily: "'Space Mono', monospace",
                fontWeight: 700,
                fontSize: "0.85rem",
                borderRadius: 20, // Pill shape
                minHeight: "36px",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                color: theme.palette.text.secondary,
                zIndex: 1,

                // Hover State
                "&:hover": {
                  color: theme.palette.text.primary,
                  backgroundColor: theme.palette.action.hover,
                },

                // Active/Selected State
                "&.Mui-selected": {
                  color: "#000000", // Black text for contrast
                  backgroundColor: accentColor, // Neon background
                  boxShadow: `0 4px 12px -2px ${accentColor}60`, // Glow
                },
              }),
            },
          },
        },
      }),
    [themeMode, accentColor]
  );

  const themeBackgroundImageBanner =
    themeMode === "dark" ? playerCardBgBlackBanner : playerCardBgWhiteBanner;
  const themeBackgroundImage =
    themeMode === "dark" ? playerCardBgBlack : playerCardBgWhite;

  return (
    <ThemeContext.Provider
      value={{
        themeBackgroundImageBanner,
        themeBackgroundImage,
        themeMode,
        toggleTheme,
      }}
    >
      <MUIThemeProvider theme={theme}>{children}</MUIThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
