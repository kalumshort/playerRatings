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
} from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const ThemeContext = createContext();

export const ThemeProvider = ({ children, accentColor = "#00FF87" }) => {
  const [themeMode, setThemeMode] = useState("dark");

  // Persist theme preference
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
            dark: alpha(accentColor, 0.7),
            light: alpha(accentColor, 0.1),
            contrastText: themeMode === "dark" ? "#000000" : "#ffffff",
          },
          ...(themeMode === "light"
            ? {
                background: {
                  default: "#F8FAFC", // Modern Slate-50
                  paper: "rgba(255, 255, 255, 0.8)",
                },
                text: {
                  primary: "#0F172A",
                  secondary: "#64748B",
                },
              }
            : {
                background: {
                  default: "#020617", // Deep Navy/Black
                  paper: "rgba(15, 23, 42, 0.6)",
                },
                text: {
                  primary: "#F8FAFC",
                  secondary: "#94A3B8",
                },
              }),
        },

        shape: { borderRadius: 16 },
        //Courier Prime
        typography: {
          // Main UI and Body font (Rounded & Modern)
          fontFamily: "'Plus Jakarta Sans', sans-serif",

          // Heading variants (Geometric & Bold)
          h1: {
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            textTransform: "uppercase",
          },
          h2: {
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            textTransform: "uppercase",
          },
          h3: {
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 700,
            letterSpacing: "-0.02em",
          },
          h4: {
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 700,
            letterSpacing: "-0.01em",
          },
          h5: {
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 600,
          },
          h6: {
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 600,
          },

          // Subtitles & Secondary UI text
          subtitle1: {
            fontWeight: 600,
            lineHeight: 1.5,
            letterSpacing: "0.01em",
          },
          subtitle2: {
            fontWeight: 600,
            fontSize: "0.875rem",
          },

          // Standard Body Text
          body1: {
            fontWeight: 400,
            fontSize: "1rem",
            lineHeight: 1.6,
          },
          body2: {
            fontWeight: 400,
            fontSize: "0.875rem",
            lineHeight: 1.6,
          },

          // Technical/Stat labels (Keeping Space Mono for the 'Data' look)
          caption: {
            fontWeight: 400,
            letterSpacing: "0.02em",
          },

          // Action Elements
          button: {
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          },
        },

        components: {
          MuiCssBaseline: {
            styleOverrides: (theme) => ({
              // Load modern font weights

              body: {
                backgroundColor: theme.palette.background.default,
                color: theme.palette.text.primary,
                transition: "background-color 0.3s ease",
              },
              // Dynamic Scrollbar synced to club accent color
              "::-webkit-scrollbar": { width: "6px" },
              "::-webkit-scrollbar-track": {
                backgroundColor:
                  theme.palette.mode === "dark" ? "#020617" : "#F8FAFC",
              },
              "::-webkit-scrollbar-thumb": {
                backgroundColor: alpha(accentColor, 0.4),
                borderRadius: "10px",
                "&:hover": { backgroundColor: accentColor },
              },
            }),
          },
          MuiPaper: {
            styleOverrides: {
              root: ({ theme }) => ({
                backgroundImage: "none", // Remove default MUI overlay
                backdropFilter: "blur(16px) saturate(180%)",
                WebkitBackdropFilter: "blur(16px) saturate(180%)",
                border: "1px solid",
                borderColor:
                  theme.palette.mode === "dark"
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.08)",
                boxShadow:
                  theme.palette.mode === "dark"
                    ? "0 10px 30px -10px rgba(0,0,0,0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)"
                    : "0 10px 30px -10px rgba(0,0,0,0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.5)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",

                // Margin Logic
                margin: 0, // Default for tablet and desktop
                [theme.breakpoints.down("sm")]: {
                  margin: "8px", // Only applied on mobile
                },
              }),
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                padding: "8px 24px",
                "&:hover": {
                  transform: "translateY(-1px)",
                  boxShadow: `0 8px 20px -6px ${alpha(accentColor, 0.5)}`,
                },
              },
              containedPrimary: {
                // Subtle gradient for primary buttons
                background: `linear-gradient(135deg, ${accentColor} 0%, ${alpha(
                  accentColor,
                  0.8
                )} 100%)`,
              },
            },
          },
          MuiAvatar: {
            styleOverrides: {
              root: ({ theme }) => ({
                borderRadius: "8px",
              }),
            },
          },
          MuiTab: {
            styleOverrides: {
              root: {
                borderRadius: 10,
                margin: "4px",
                minHeight: "40px",
                "&.Mui-selected": {
                  backgroundColor: alpha(accentColor, 0.15),
                  color: accentColor,
                },
              },
            },
          },
          MuiStack: {
            defaultProps: {
              useFlexGap: true,
              spacing: 2, // Default 16px gap between all stacked Papers
            },
          },
          MuiContainer: {
            styleOverrides: {
              root: {
                paddingLeft: "16px",
                paddingRight: "16px",
                "@media (min-width: 600px)": {
                  paddingLeft: "24px",
                  paddingRight: "24px",
                },
              },
            },
          },
        },
      }),
    [themeMode, accentColor]
  );

  const value = useMemo(
    () => ({
      themeMode,
      toggleTheme,
      accentColor,
    }),
    [themeMode, accentColor]
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
