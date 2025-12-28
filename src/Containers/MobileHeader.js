import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  styled,
  useTheme as useMuiTheme,
} from "@mui/material";

import {
  Menu as MenuIcon,
  X,
  Home,
  Calendar,
  Trophy,
  User,
  LogOut,
} from "lucide-react";
import { auth } from "../Firebase/Firebase";
import { signOut } from "firebase/auth";
import SiteIcon from "../assets/logo/11Votes_Icon_Logo.png";
import useGroupData from "../Hooks/useGroupsData";
import { useAppNavigate } from "../Hooks/useAppNavigate";

const GlassAppBar = styled(AppBar)(({ theme }) => ({
  position: "sticky",
  top: 0,
  width: "100%",
  left: 0,
  right: 0,
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  zIndex: theme.zIndex.appBar,
  boxSizing: "border-box",
  margin: "0!important",
}));

const Logo = styled("img")({
  height: "40px",
  cursor: "pointer",
});

export default function MobileHeader() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const appNavigate = useAppNavigate();
  const theme = useMuiTheme();
  const { activeGroup } = useGroupData();

  const accentColor = activeGroup?.accentColor || theme.palette.primary.main;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      appNavigate("/");
      setDrawerOpen(false);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const navItems = [
    { text: "Home", icon: <Home size={20} />, path: "/" },
    { text: "Schedule", icon: <Calendar size={20} />, path: "/schedule" },
    { text: "Season Stats", icon: <Trophy size={20} />, path: "/season-stats" },
    { text: "Profile", icon: <User size={20} />, path: "/profile" },
  ];

  return (
    <>
      <GlassAppBar elevation={0}>
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            height: "64px",
            px: 2,
            width: "100%",
          }}
        >
          <Logo src={SiteIcon} alt="11Votes" onClick={() => appNavigate("/")} />

          <IconButton
            onClick={() => setDrawerOpen(true)}
            sx={{
              color: "text.primary",
              p: 1,
              borderRadius: "12px",
              backgroundColor:
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(0,0,0,0.05)",
            }}
          >
            <MenuIcon size={24} />
          </IconButton>
        </Toolbar>
      </GlassAppBar>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        // FIX: Ensure the Drawer's zIndex is higher than the AppBar
        sx={{ zIndex: theme.zIndex.drawer + 2 }}
        PaperProps={{
          sx: {
            width: "280px",
            maxWidth: "85vw",
            background:
              theme.palette.background.gradient ||
              theme.palette.background.default,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderLeft: `1px solid ${theme.palette.divider}`,
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <Box sx={{ p: 3, flexGrow: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 4 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Avatar
                src={activeGroup?.clubBadge}
                sx={{
                  width: 44,
                  height: 44,
                  border: `2px solid ${accentColor}`,
                }}
              />
              <Box>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 800, lineHeight: 1.2 }}
                >
                  {activeGroup?.name}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setDrawerOpen(false)}>
              <X size={20} />
            </IconButton>
          </Box>

          <List>
            {navItems.map((item) => (
              <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
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
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>

        <Box sx={{ p: 2 }}>
          <Divider sx={{ mb: 2, opacity: 0.1 }} />
          <ListItemButton
            onClick={handleLogout}
            sx={{ borderRadius: "12px", color: "error.main" }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: "error.main" }}>
              <LogOut size={20} />
            </ListItemIcon>
            <ListItemText
              primary="Sign Out"
              primaryTypographyProps={{ fontWeight: 700 }}
            />
          </ListItemButton>
        </Box>
      </Drawer>
    </>
  );
}
