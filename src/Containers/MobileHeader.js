import { useState } from "react";
import { AppBar, Toolbar, IconButton, Drawer, styled } from "@mui/material";

import { useNavigate } from "react-router-dom";
import { DrawerContentComponent } from "./Header";

import blackLogo from "../assets/logo/11votes-logo-clear-nobg-black.png";
import whiteLogo from "../assets/logo/11votes-nobg-clear-white.png";
import MenuIcon from "@mui/icons-material/Menu";
import { useTheme } from "../Components/Theme/ThemeContext";

export default function MobileHeader() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();

  const Logo = styled("img")({
    height: "50px",
  });

  return (
    <>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          backgroundColor: "background.paper",
          color: "text.primary",
        }}
      >
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 4,
            height: "70px",
          }}
        >
          <Logo
            src={theme.themeMode === "dark" ? whiteLogo : blackLogo}
            alt="11Votes Logo"
            onClick={() => navigate(`/`)}
          />

          <IconButton color="inherit" onClick={() => setDrawerOpen(true)}>
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <DrawerContentComponent setDrawerOpen={setDrawerOpen} />
      </Drawer>
    </>
  );
}
