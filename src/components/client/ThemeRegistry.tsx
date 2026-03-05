"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { getTheme, PALETTE } from "@/lib/theme";

const ThemeContext = createContext({
  themeMode: "dark",
  toggleTheme: () => {},
  accentColor: PALETTE.primary,
});

export const use11VotesTheme = () => useContext(ThemeContext);

export default function ThemeRegistry({
  children,
  initialTheme, // Receives the value from the Server (Layout)
}: {
  children: React.ReactNode;
  initialTheme: "light" | "dark";
}) {
  // 1. Initialize state with the server-provided theme
  const [themeMode, setThemeMode] = useState<"light" | "dark">(initialTheme);
  const [accentColor, setAccentColor] = useState(PALETTE.primary);

  // Sync with localStorage on mount (optional backup)
  useEffect(() => {
    const saved = localStorage.getItem("themeMode") as "light" | "dark";
    if (saved && saved !== themeMode) {
      setThemeMode(saved);
    }
  }, [themeMode]);

  const toggleTheme = () => {
    const newMode = themeMode === "light" ? "dark" : "light";
    setThemeMode(newMode);

    // 2. Save to localStorage for persistence
    localStorage.setItem("themeMode", newMode);

    // 3. Save to Cookie so the Server can see it on the next request
    document.cookie = `themeMode=${newMode}; path=/; max-age=31536000; SameSite=Lax`;
  };

  const theme = useMemo(
    () => getTheme(themeMode, accentColor),
    [themeMode, accentColor],
  );

  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <ThemeContext.Provider value={{ themeMode, toggleTheme, accentColor }}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </ThemeContext.Provider>
    </AppRouterCacheProvider>
  );
}
