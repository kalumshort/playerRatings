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

// Create a Context for the theme
const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
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
                  default: "#ffffff",
                  paper: "#f7f7f7",
                  gradient: "linear-gradient(135deg, #ffffff, #eaeaea)",
                },
                text: {
                  primary: "#111111",
                  secondary: "#555555",
                  disabled: "#9e9e9e",
                  shadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
                },
                primary: {
                  main: "#DA291C",
                  contrastText: "#ffffff",
                },
                secondary: {
                  main: "#f5f5f5",
                  contrastText: "#000000",
                },
              }
            : {
                background: {
                  default: "#121212",
                  paper: "#1e1e1e",
                  gradient: "linear-gradient(135deg, #1e1e1e, #3d3d3d)",
                },
                text: {
                  primary: "#f5f5f5",
                  secondary: "#aaaaaa",
                  disabled: "#666666",
                  shadow: "0 1px 3px rgba(0, 0, 0, 0.8)",
                },
                primary: {
                  main: "#DA291C",
                  contrastText: "#ffffff",
                },
                secondary: {
                  main: "#2c2c2c",
                  contrastText: "#ffffff",
                },
              }),
        },

        shape: {
          borderRadius: 16, // Modern rounded corners
        },

        shadows: Array(25).fill(
          themeMode === "light"
            ? "0px 4px 12px rgba(0, 0, 0, 0.08)"
            : "0px 4px 12px rgba(0, 0, 0, 0.5)"
        ),

        typography: {
          fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
          fontWeightRegular: 400,
          fontWeightMedium: 500,
          fontWeightBold: 700,
          button: {
            textTransform: "none",
            fontWeight: 600,
          },
        },

        components: {
          MuiPaper: {
            styleOverrides: {
              rounded: {
                borderRadius: 16,
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                boxShadow:
                  themeMode === "light"
                    ? "0 2px 6px rgba(0, 0, 0, 0.15)"
                    : "0 2px 6px rgba(0, 0, 0, 0.6)",
                textTransform: "none",
              },
            },
          },
        },
      }),
    [themeMode] // Recreate the theme when themeMode changes
  );

  // Render a loading state or nothing until the themeMode has been set
  if (themeMode === null) {
    return null; // You can optionally render a loading spinner here
  }

  return (
    <ThemeContext.Provider value={{ themeMode, toggleTheme }}>
      <MUIThemeProvider theme={theme}>{children}</MUIThemeProvider>
    </ThemeContext.Provider>
  );
};

// Custom hook to use the ThemeContext
export const useTheme = () => useContext(ThemeContext);
