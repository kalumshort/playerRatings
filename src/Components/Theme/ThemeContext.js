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
import CssBaseline from "@mui/material/CssBaseline";

// --- 2. PALETTE ---
const PALETTE = {
  light: {
    bg: "#FDFBF7", // Warm Off-White (Sunday Morning)
    paper: "#FFFFFF", // Pure White for contrast
    textPrimary: "#4A4A4A", // Deep Slate (Easy on the eyes)
    textSecondary: "#8C8C8C",
    clayShadow: "#D1D9E6", // Soft Blue-Grey depth
    highlight: "#FFFFFF", // Clean Light Source
    accent: "#A0E8AF", // Matcha
  },
  dark: {
    bg: "#1A1C1E", // Deep Neutral Slate (Modern & Clean)
    paper: "#24272B", // Elevated Dark Clay
    textPrimary: "#ECECEC", // Off-White Text
    textSecondary: "#B0B3C7",
    clayShadow: "#0D0E10", // Deep Void Shadow
    highlight: "rgba(255, 255, 255, 0.05)", // Soft Rim Glow
    accent: "#A0E8AF", // Matcha (Stays vibrant)
  },
  secondary: "#A0E8AF", // Matcha Green
  primary: "#A2D2FF", // Periwinkle
  coral: "#FFC8DD", // Soft Coral (For error/alerts)
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

    return createTheme({
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
          styleOverrides: `body { background-color: ${colors.bg}; transition: background-color 0.4s ease; }`,
        },

        // --- DRAWER (Soft Panel) ---
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
            root: { objectFit: "contain" },
          },
        },
        // --- PAPER (Standard Clay Cards) ---
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
        // --- BUTTONS ( Marshmallow Action Keys) ---
        MuiButton: {
          defaultProps: { disableElevation: true, disableRipple: true },
          styleOverrides: {
            root: {
              borderRadius: "50px", // Restored your requested 50px
              padding: "14px 32px", // Increased for better tactile "puff"
              transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
              textTransform: "none",
              fontWeight: 800,

              // THE CLAY STACK: [Outer Dark] [Outer Light] [Inner Light Rim] [Inner Dark Depth]
              boxShadow: isLight
                ? `10px 10px 20px #D1D9E6, 
           -10px -10px 20px #FFFFFF, 
           inset 2px 2px 5px rgba(255, 255, 255, 0.8), 
           inset -2px -2px 5px rgba(209, 217, 230, 0.5)`
                : `12px 12px 24px #1a1d29, 
           -8px -8px 20px #3c4155, 
           inset 2px 2px 5px rgba(255, 255, 255, 0.05), 
           inset -2px -2px 5px rgba(0, 0, 0, 0.2)`,

              "&:hover": {
                transform: "translateY(-3px)",
                boxShadow: isLight
                  ? `14px 14px 28px #C1C9D6, -14px -14px 28px #FFFFFF`
                  : `16px 16px 32px #151720, -10px -10px 25px #454b62`,
              },

              "&:active": {
                transform: "scale(0.95)",
                // Inset shadows become primary to look physically "squished"
                boxShadow: isLight
                  ? `inset 8px 8px 15px #D1D9E6, inset -8px -8px 15px #FFFFFF`
                  : `inset 10px 10px 20px #1a1d29, inset -6px -6px 15px #3c4155`,
              },
            },
            containedPrimary: {
              backgroundColor: primaryMain,
              color: "#3D3D3D",
              // Colored Inner/Outer Clay Logic
              boxShadow: isLight
                ? `10px 10px 25px rgba(160, 232, 175, 0.5), 
           -10px -10px 20px #FFFFFF, 
           inset 4px 4px 10px rgba(255, 255, 255, 0.4), 
           inset -4px -4px 10px rgba(0, 0, 0, 0.1)`
                : `12px 12px 25px rgba(160, 232, 175, 0.15), 
           -8px -8px 20px #3c4155, 
           inset 4px 4px 10px rgba(255, 255, 255, 0.1), 
           inset -4px -4px 10px rgba(0, 0, 0, 0.3)`,

              "&:hover": {
                backgroundColor: primaryMain,
                filter: "brightness(1.04)", // Subtle glow on hover
              },
            },
          },
        },
        // --- TABS (Inset Tray & Floating Pill) ---
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
            },
            indicator: { display: "none" },
          },
        },
        MuiTab: {
          styleOverrides: {
            root: {
              borderRadius: "20px",
              transition: "all 0.3s ease",
              "&.Mui-selected": {
                backgroundColor: colors.bg,
                boxShadow: isLight
                  ? "4px 4px 10px rgba(0,0,0,0.08)"
                  : "4px 4px 10px rgba(0,0,0,0.4)",
                color: primaryMain,
              },
            },
          },
        },
        // --- LIST ITEMS (Nav Sidebar Links) ---
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
                color: primaryMain,
              },
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
