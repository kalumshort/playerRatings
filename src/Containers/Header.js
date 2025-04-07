import React, { useState } from "react";

import { Drawer, IconButton, Toolbar, Box, Divider } from "@mui/material";

import SettingsIcon from "@mui/icons-material/Settings";
import whiteLogo from "../assets/logo/11votes-nobg-clear-white.png";
import blackLogo from "../assets/logo/11votes-logo-clear-nobg-black.png";

import { styled } from "@mui/system";
import ThemeToggle from "../Components/Theme/ThemeToggle";
import { useTheme } from "../Components/Theme/ThemeContext";

import { useAuth } from "../Providers/AuthContext";
import AuthTabs from "../Components/Auth/AuthTabs";
import ProfileSection from "../Components/Auth/ProfileSection";
import Logout from "../Components/Auth/Logout";

const HeaderContainer = styled("div")(({ theme }) => ({
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1000,
  backgroundColor: theme.palette.background.paper,
  borderBottom: "1px solid",
  borderColor: theme.palette.background.accent,
}));

export default function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();

  const toggleDrawer = (open) => {
    setDrawerOpen(open);
  };

  return (
    <HeaderContainer>
      <Toolbar style={{ height: 90 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            maxWidth: "1300px",
            width: "100%",
            margin: "auto",
          }}
        >
          <img
            src={theme.themeMode === "dark" ? whiteLogo : blackLogo}
            alt="Logo"
            style={{ height: "70px", width: "70px", cursor: "pointer" }}
            onClick={() => {
              window.history.pushState({}, "", "/");
              window.dispatchEvent(new PopStateEvent("popstate"));
            }}
          />

          <IconButton
            color="inherit"
            aria-label="settings"
            onClick={() => toggleDrawer(true)}
            size="large"
          >
            <SettingsIcon />
          </IconButton>
        </Box>
      </Toolbar>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => toggleDrawer(false)}
      >
        <DrawerContentComponent />
      </Drawer>
    </HeaderContainer>
  );
}

const DrawerContent = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  height: "100%", // Make the drawer take the full height
  justifyContent: "space-between", // Pushes content to the top and bottom
}));

const SettingsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  marginTop: "auto", // Ensures the content stays at the bottom of the drawer
}));

const SettingRow = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center", // Centers the content vertically in the row
}));

export function DrawerContentComponent() {
  const { user } = useAuth();

  return (
    <DrawerContent sx={{ width: "300px" }}>
      <Box>{!user && <AuthTabs />}</Box>
      <Box>{user && <ProfileSection />}</Box>
      <Divider />

      {/* Settings Section at the bottom */}
      <SettingsContainer>
        <SettingRow>
          <Box>Theme</Box>
          <ThemeToggle />
        </SettingRow>
        <SettingRow>
          <Box></Box>
          <Logout />
        </SettingRow>
      </SettingsContainer>
    </DrawerContent>
  );
}
