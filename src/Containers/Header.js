import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton,
} from "@mui/material";
// import MenuIcon from "@mui/icons-material/Menu"; // Menu icon for smaller screens
import { styled } from "@mui/system";
import ThemeToggle from "../Components/Theme/ThemeToggle";
import { useNavigate } from "react-router-dom";

const HeaderContainer = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  color: theme.palette.text.primary,
  transition: "background-color 0.3s ease, color 0.3s ease", // Smooth transition for light/dark mode
}));

const Header = () => {
  return (
    <HeaderContainer position="static">
      <Toolbar>
        {/* Logo/Title */}
        <Button
          onClick={() => {
            window.history.pushState({}, "", "/");
            window.dispatchEvent(new PopStateEvent("popstate"));
          }}
        >
          Home
        </Button>

        {/* Navigation Links */}
        <Box sx={{ display: { xs: "none", md: "flex" }, gap: 2 }}></Box>
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Menu Icon for Mobile View */}
        <Box sx={{ display: { xs: "block", md: "none" } }}>
          <IconButton edge="end" color="inherit" aria-label="menu">
            {/* <MenuIcon /> */}
          </IconButton>
        </Box>
      </Toolbar>
    </HeaderContainer>
  );
};

export default Header;
