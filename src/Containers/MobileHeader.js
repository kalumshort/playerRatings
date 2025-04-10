import { useState } from "react";
import { AppBar, Toolbar, IconButton, Drawer, styled } from "@mui/material";

import { useNavigate } from "react-router-dom";
import { DrawerContentComponent } from "./Header";

import whiteLogo from "../assets/logo/11votes-nobg-clear-white.png";
import MenuIcon from "@mui/icons-material/Menu";

export default function MobileHeader() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();

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
            gap: 4,
          }}
        >
          <Logo
            src={whiteLogo}
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
