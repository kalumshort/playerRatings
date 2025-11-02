import React, { useState } from "react";

import {
  Drawer,
  IconButton,
  Toolbar,
  Box,
  Container,
  Paper,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
// import whiteLogo from "../assets/logo/11votes-nobg-clear-white.png";
// import blackLogo from "../assets/logo/11votes-logo-clear-nobg-black.png";
import SiteIconText from "../assets/logo/11Votes_IconText.png";
import SiteIconTextBlack from "../assets/logo/11Votes_IconBlackText.png";

import { styled } from "@mui/system";
import ThemeToggle from "../Components/Theme/ThemeToggle";
import { useTheme } from "../Components/Theme/ThemeContext";

import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

import { useAuth } from "../Providers/AuthContext";

import ProfileSection from "../Components/Auth/ProfileSection";

import Login from "../Components/Auth/Login";
import { useNavigate } from "react-router-dom";
import useGroupData from "../Hooks/useGroupsData";
import useUserData from "../Hooks/useUserData";

const HeaderContainer = styled("div")(({ theme }) => ({
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1000,
  backgroundColor: theme.palette.background.paper,
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
            src={theme.themeMode === "dark" ? SiteIconText : SiteIconTextBlack}
            alt="Logo"
            style={{ width: "120px", cursor: "pointer" }}
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
            <MenuIcon />
          </IconButton>
        </Box>
      </Toolbar>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => toggleDrawer(false)}
      >
        <DrawerContentComponent setDrawerOpen={setDrawerOpen} />
      </Drawer>
    </HeaderContainer>
  );
}

export const DrawerContent = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  height: "100%", // Make the drawer take the full height
  justifyContent: "space-between", // Pushes content to the top and bottom
  padding: theme.spacing(2),
}));

export const SettingsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  marginTop: "auto", // Ensures the content stays at the bottom of the drawer
}));

export const SettingRow = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center", // Centers the content vertically in the row
  backgroundColor: "background.paper",
  margin: "10px 0px 5px 0px",
}));

export function DrawerContentComponent({ setDrawerOpen }) {
  const { user } = useAuth();
  const { isGroupAdmin } = useUserData();

  return (
    <DrawerContent
      sx={{ width: "300px", backgroundColor: "background.default" }}
    >
      {!user && (
        <Container maxWidth="xs">
          <Login />
        </Container>
      )}
      {user && (
        <>
          <ProfileSection setDrawerOpen={setDrawerOpen} />
          {isGroupAdmin && (
            <DrawerGroupAdminContainer setDrawerOpen={setDrawerOpen} />
          )}
          <DrawerGroupContainer setDrawerOpen={setDrawerOpen} />
        </>
      )}

      <SettingsContainer>
        <SettingRow>
          <Box></Box>
          <ThemeToggle />
        </SettingRow>
        {/* {user && (
          <SettingRow>
            <Box></Box>
            <Logout />
          </SettingRow>
        )} */}
      </SettingsContainer>
    </DrawerContent>
  );
}

function DrawerGroupContainer({ setDrawerOpen }) {
  const navigate = useNavigate();
  const { activeGroup } = useGroupData();

  const handleSeasonStatsClick = () => {
    setDrawerOpen(false);
    navigate("/season-stats");
  };
  return (
    <Paper style={{ marginTop: "30px", padding: "10px" }}>
      <SettingRow
        style={{ borderBottom: "1px solid grey", paddingBottom: "10px" }}
      >
        <h5
          style={{ padding: "0px", margin: "5px 0px", color: "grey" }}
          className=""
        >
          Active Group
        </h5>
        <Box style={{ fontSize: "15px" }}>{activeGroup?.name}</Box>
      </SettingRow>
      <SettingRow
        onClick={handleSeasonStatsClick}
        style={{ cursor: "pointer" }}
      >
        <Box>Player Stats</Box>
        <ArrowForwardIosIcon fontSize="small" />
      </SettingRow>
    </Paper>
  );
}
function DrawerGroupAdminContainer({ setDrawerOpen }) {
  const navigate = useNavigate();

  const handleNavLink = () => {
    setDrawerOpen(false);
    navigate("/group-dashboard");
  };
  return (
    <Paper style={{ marginTop: "30px", padding: "10px" }}>
      <SettingRow
        style={{ borderBottom: "1px solid grey", paddingBottom: "10px" }}
      >
        <h5
          style={{ padding: "0px", margin: "5px 0px", color: "grey" }}
          className=""
        >
          Group Admin
        </h5>
      </SettingRow>
      <SettingRow onClick={handleNavLink} style={{ cursor: "pointer" }}>
        <Box>Dashboard</Box>
        <ArrowForwardIosIcon fontSize="small" />
      </SettingRow>
    </Paper>
  );
}
