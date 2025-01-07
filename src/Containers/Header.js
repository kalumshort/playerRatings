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
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          My App
        </Typography>

        {/* Navigation Links */}
        <Box sx={{ display: { xs: "none", md: "flex" }, gap: 2 }}>
          <Button color="inherit">Home</Button>
          <Button color="inherit">About</Button>
          <Button color="inherit">Services</Button>
          <Button color="inherit">Contact</Button>
        </Box>
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
