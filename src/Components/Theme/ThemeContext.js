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
                },
                text: {
                  primary: "#000000",
                  secondary: "#555555",
                },
              }
            : {
                background: {
                  default: "#121212",
                  paper: "#1e1e1e",
                },
                text: {
                  primary: "#ffffff",
                  secondary: "#aaaaaa",
                },
              }),
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
