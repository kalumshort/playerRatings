import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  Box,
  Typography,
  styled,
  useTheme,
  useMediaQuery,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
} from "@mui/material";

import {
  Menu as MenuIcon,
  X,
  Home,
  Calendar,
  Trophy,
  User,
  LogOut,
  LayoutDashboard,
  ChevronRight,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "../Firebase/Firebase";

// Hooks & Assets
import useGroupData from "../Hooks/useGroupsData";
import useUserData from "../Hooks/useUserData";
import { useAuth } from "../Providers/AuthContext";

import SiteIconOnly from "../assets/logo/11Votes_Icon_Blue.png";

// Components
import ThemeToggle from "../Components/Theme/ThemeToggle";
import Login from "../Components/Auth/Login";

import { useAppNavigate } from "../Hooks/useAppNavigate";
import GroupExplorer from "./Header/GroupExplorer";
// import { handleAddUserToGroup } from "../Firebase/Auth_Functions";

// --- Styled Components (Glassmorphism) ---
const GlassAppBar = styled(AppBar)(({ theme }) => ({
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  width: "100%",
  background: theme.palette.background.paper, // Using the glass paper from ThemeContext
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  borderBottom: `1px solid ${theme.palette.divider}`,
  zIndex: theme.zIndex.appBar + 1,
  margin: "0!important",
}));

const NavContainer = styled(Box)({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  width: "100%",
  maxWidth: "1300px",
  margin: "0 auto",
});

export default function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const appNavigate = useAppNavigate();
  const { user } = useAuth();
  const { activeGroup } = useGroupData();
  const { isGroupAdmin } = useUserData();

  const accentColor = theme.palette.primary.main;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setDrawerOpen(false);
      appNavigate("/");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const navItems = [
    { text: "Home", icon: <Home size={20} />, path: "/" },
    { text: "Schedule", icon: <Calendar size={20} />, path: "/schedule" },
    {
      text: "Player Ratings",
      icon: <Trophy size={20} />,
      path: "/player-stats",
    },
    { text: "Settings", icon: <User size={20} />, path: "/profile" },
  ];

  return (
    <>
      <GlassAppBar elevation={0}>
        <Toolbar sx={{ height: isMobile ? 64 : 80, px: 2 }}>
          <NavContainer>
            {/* Logo Logic */}
            <Box
              component="img"
              src={SiteIconOnly}
              alt="11Votes"
              sx={{
                height: isMobile ? "40px" : "50px",
                cursor: "pointer",
                transition: "transform 0.2s",
                "&:hover": { transform: "scale(1.02)" },
              }}
              onClick={() => appNavigate("/")}
            />

            {/* Desktop Actions vs Mobile Menu */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              {!isMobile && user && (
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", fontWeight: 700 }}
                >
                  {activeGroup?.name}
                </Typography>
              )}

              <IconButton
                onClick={() => setDrawerOpen(true)}
                sx={{
                  color: "text.primary",
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(0,0,0,0.05)",
                  borderRadius: "12px",
                }}
              >
                <MenuIcon size={isMobile ? 24 : 28} />
              </IconButton>
            </Box>
          </NavContainer>
        </Toolbar>
      </GlassAppBar>

      {/* spacer to prevent content from going under fixed header */}
      <Box sx={{ height: isMobile ? 64 : 0 }} />

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: isMobile ? "280px" : "320px",
            background:
              theme.palette.background.gradient ||
              theme.palette.background.default,
            backdropFilter: "blur(20px)",
            borderLeft: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        <Box
          sx={{
            p: 3,
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          {/* <button
            onClick={() =>
              handleAddUserToGroup({
                userData: user,
                groupId: "007",
                role: "admin",
              })
            }
          >
            Test
          </button> */}
          {/* Header of Drawer */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 4,
            }}
          >
            {user && activeGroup ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                {/* <Avatar
                  src={activeGroup.clubBadge}
                  sx={{
                    width: 40,
                    height: 40,
                    border: `2px solid ${accentColor}`,
                  }}
                /> */}
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  {activeGroup.name}
                </Typography>
              </Box>
            ) : (
              <Typography variant="h6" sx={{ color: accentColor }}>
                11VOTES
              </Typography>
            )}
            <IconButton onClick={() => setDrawerOpen(false)}>
              <X size={20} />
            </IconButton>
          </Box>

          {/* Auth State */}
          {!user ? (
            <Login />
          ) : (
            <Box sx={{ flexGrow: 1 }}>
              {/* <ProfileSection setDrawerOpen={setDrawerOpen} /> */}

              <List sx={{ mt: 2 }}>
                {/* Admin Section */}
                {isGroupAdmin && (
                  <Paper
                    sx={{ mb: 2, p: 0.5, backgroundColor: "rgba(0,0,0,0.1)" }}
                  >
                    <ListItemButton
                      onClick={() => {
                        appNavigate("/group-dashboard");
                        setDrawerOpen(false);
                      }}
                      sx={{ borderRadius: "12px" }}
                    >
                      <ListItemIcon sx={{ color: accentColor }}>
                        <LayoutDashboard size={20} />
                      </ListItemIcon>
                      <ListItemText
                        primary="Admin Dashboard"
                        primaryTypographyProps={{
                          variant: "body2",
                          fontWeight: 700,
                        }}
                      />
                    </ListItemButton>
                  </Paper>
                )}

                {/* Standard Nav */}
                {navItems.map((item) => (
                  <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      onClick={() => {
                        appNavigate(item.path);
                        setDrawerOpen(false);
                      }}
                      sx={{
                        borderRadius: "12px",
                        "&:hover": { backgroundColor: `${accentColor}15` },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40, color: accentColor }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{ variant: "body2" }}
                      />
                      <ChevronRight size={16} style={{ opacity: 0.3 }} />
                    </ListItemButton>
                  </ListItem>
                ))}

                {user && <GroupExplorer setDrawerOpen={setDrawerOpen} />}
              </List>
            </Box>
          )}

          {/* Bottom Settings */}
          <Box sx={{ mt: "auto", pt: 2 }}>
            <Divider sx={{ mb: 2, opacity: 0.1 }} />
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Theme
              </Typography>
              <ThemeToggle />
            </Box>

            {user && (
              <ListItemButton
                onClick={handleLogout}
                sx={{ borderRadius: "12px", color: "error.main", mt: 1 }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: "error.main" }}>
                  <LogOut size={20} />
                </ListItemIcon>
                <ListItemText
                  primary="Sign Out"
                  primaryTypographyProps={{ fontWeight: 700 }}
                />
              </ListItemButton>
            )}
          </Box>
        </Box>
      </Drawer>
    </>
  );
}
