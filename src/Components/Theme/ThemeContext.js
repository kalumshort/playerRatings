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

import playerCardBgBlackBanner from "../../assets/appAssets/playerBackgroundBaseBlackBanner.png";
import playerCardBgWhiteBanner from "../../assets/appAssets/playerBackgroundBaseWhiteBanner.png";
import playerCardBgWhite from "../../assets/appAssets/playerBackgroundBaseWhite.png";
import playerCardBgBlack from "../../assets/appAssets/playerBackgroundBaseBlack.png";

// Create a Context for the theme
const ThemeContext = createContext();

export const ThemeProvider = ({ children, accentColor }) => {
  // Initialize themeMode as 'light' or 'dark' based on localStorage or default to 'light'
  const [themeMode, setThemeMode] = useState("dark"); // Default to 'light'

  // Load theme from localStorage when the app starts
  useEffect(() => {
    const savedTheme = localStorage.getItem("themeMode");
    if (savedTheme) {
      setThemeMode(savedTheme); // Set the saved theme from localStorage
    }
  }, []); // This effect runs only once when the component mounts

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    if (themeMode) {
      localStorage.setItem("themeMode", themeMode); // Save theme to localStorage
    }
  }, [themeMode]); // This effect runs every time themeMode changes

  const toggleTheme = () => {
    setThemeMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
  };

  // Define custom light and dark themes
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: themeMode,
          ...(themeMode === "light"
            ? {
                background: {
                  default: "#f0f2f5", // Soft clean gray-blue
                  paper: "rgba(255, 255, 255, 0.65)", // Highly transparent glass
                  gradient: "linear-gradient(135deg, #ffffff 0%, #f0f4f8 100%)",
                },
                text: {
                  primary: "#1a2027",
                  secondary: "#5A6A85",
                  disabled: "#B0B8C4",
                },
                primary: {
                  main: accentColor,
                  contrastText: "#000000",
                },
                secondary: {
                  main: "#000000",
                  contrastText: "#ffffff",
                },
                divider: "rgba(0,0,0,0.04)",
              }
            : {
                background: {
                  default: "#09090b", // Rich black-gray
                  paper: "rgba(24, 24, 27, 0.6)", // Dark smoked glass
                  gradient: "linear-gradient(135deg, #18181b 0%, #09090b 100%)",
                },
                text: {
                  primary: "#ffffff",
                  secondary: "#A1A1AA",
                  disabled: "#52525B",
                },
                primary: {
                  main: accentColor,
                  contrastText: "#000000",
                },
                secondary: {
                  main: "#ffffff",
                  contrastText: "#000000",
                },
                divider: "rgba(255,255,255,0.06)",
              }),
        },

        shape: {
          borderRadius: 24, // Very modern, soft curves
        },

        shadows: Array(25).fill("none"), // Reset default shadows to avoid conflicts

        typography: {
          // Retro Fonts Preserved
          fontFamily: "'Space Mono', 'Courier New', monospace",
          fontWeightRegular: 400,
          fontWeightMedium: 700,
          fontWeightBold: 700,

          h1: {
            fontFamily: "'VT323', monospace",
            textTransform: "uppercase",
            letterSpacing: "1px",
            lineHeight: 1,
          },
          h2: {
            fontFamily: "'VT323', monospace",
            textTransform: "uppercase",
            letterSpacing: "1px",
            lineHeight: 1.1,
          },
          h3: {
            fontFamily: "'VT323', monospace",
            textTransform: "uppercase",
            letterSpacing: "1px",
          },
          h4: {
            fontFamily: "'VT323', monospace",
            textTransform: "uppercase",
            letterSpacing: "1px",
          },
          h5: {
            fontFamily: "'VT323', monospace",
            textTransform: "uppercase",
            letterSpacing: "1px",
          },
          h6: {
            fontFamily: "'VT323', monospace",
            textTransform: "uppercase",
            letterSpacing: "1px",
          },

          button: {
            fontFamily: "'Graduate', serif",
            textTransform: "uppercase",
            fontWeight: 400,
            fontSize: "1rem",
            letterSpacing: "1px",
          },
          subtitle1: {
            fontFamily: "'Space Mono', monospace",
            letterSpacing: "-0.5px",
          },
          body1: { fontFamily: "'Space Mono', monospace", lineHeight: 1.6 },
        },

        components: {
          // 1. The Glass Card (Neutral Borders Only)
          MuiPaper: {
            styleOverrides: {
              root: {
                backdropFilter: "blur(20px)", // Heavy high-end blur
                WebkitBackdropFilter: "blur(20px)",
                backgroundImage: "none",
                // Neutral border for "cut glass" look. No accent color here.
                border:
                  themeMode === "light"
                    ? "1px solid rgba(255, 255, 255, 0.8)"
                    : "1px solid rgba(255, 255, 255, 0.08)",
                // Soft diffuse shadow
                boxShadow:
                  themeMode === "light"
                    ? "0 4px 30px rgba(0, 0, 0, 0.03)"
                    : "0 4px 30px rgba(0, 0, 0, 0.2)",
              },
              elevation1: {
                boxShadow:
                  themeMode === "light"
                    ? "0 4px 20px rgba(0,0,0,0.02)"
                    : "0 4px 20px rgba(0,0,0,0.2)",
              },
            },
          },

          // 2. Buttons (Pill shaped, Accent used here)
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 100, // Full pill shape
                textTransform: "uppercase",
                padding: "10px 24px",
                border: "1px solid transparent",
                boxShadow: "none",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  transform: "translateY(-1px)",
                  boxShadow: `0 8px 20px -4px ${accentColor}60`, // Glow only on hover
                },
              },
              containedPrimary: {
                background: accentColor,
                color: "#000", // Retro contrast
                fontWeight: 600,
                "&:hover": {
                  background: accentColor, // Maintain color, just add glow (above)
                },
              },
              outlined: {
                border: `2px solid ${themeMode === "light" ? "#000" : "#fff"}`,
                color: themeMode === "light" ? "#000" : "#fff",
                "&:hover": {
                  border: `2px solid ${accentColor}`,
                  color: accentColor,
                  backgroundColor: "transparent",
                },
              },
            },
          },

          // 3. Inputs (Clean Glass, Neutral Borders)
          MuiOutlinedInput: {
            styleOverrides: {
              root: {
                borderRadius: 16,
                backgroundColor:
                  themeMode === "light"
                    ? "rgba(255,255,255,0.4)"
                    : "rgba(0,0,0,0.2)",
                transition: "all 0.2s ease",
                "& fieldset": {
                  borderWidth: "1px",
                  // Neutral borders
                  borderColor:
                    themeMode === "light"
                      ? "rgba(0,0,0,0.06)"
                      : "rgba(255,255,255,0.08)",
                },
                "&:hover": {
                  backgroundColor:
                    themeMode === "light"
                      ? "rgba(255,255,255,0.7)"
                      : "rgba(0,0,0,0.3)",
                },
                "&.Mui-focused": {
                  backgroundColor:
                    themeMode === "light" ? "#fff" : "rgba(0,0,0,0.4)",
                  boxShadow: `0 4px 20px -2px ${accentColor}30`, // Subtle glow only when typing
                  "& fieldset": {
                    borderWidth: "1px !important",
                    borderColor: `${accentColor} !important`,
                  },
                },
              },
              input: {
                padding: "12px 16px",
              },
            },
          },

          // 4. Overrides for cleaner UI
          MuiInputLabel: {
            styleOverrides: {
              root: {
                fontFamily: "'Space Mono', monospace",
                fontSize: "0.85rem",
                "&.Mui-focused": {
                  color: accentColor,
                },
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 24,
                overflow: "hidden",
              },
            },
          },
        },
      }),
    [themeMode, accentColor]
  );

  // Render a loading state or nothing until the themeMode has been set
  if (themeMode === null) {
    return null; // You can optionally render a loading spinner here
  }

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

// Custom hook to use the ThemeContext
export const useTheme = () => useContext(ThemeContext);
