import { useState } from "react";
import { AppBar, Toolbar, IconButton, Drawer } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import GroupsIcon from "@mui/icons-material/Groups";
import SettingsIcon from "@mui/icons-material/Settings";

import { useNavigate } from "react-router-dom";
import { DrawerContentComponent } from "./Header";

export default function MobileHeader() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <AppBar
        position="fixed"
        sx={{ top: "auto", bottom: 0, borderRadius: "15px 15px 0px 0px" }}
      >
        <Toolbar
          sx={{ display: "flex", justifyContent: "space-between", gap: 4 }}
        >
          <IconButton color="inherit" onClick={() => navigate(`/`)}>
            <HomeIcon />
          </IconButton>
          <IconButton color="inherit" onClick={() => navigate(`/player-stats`)}>
            <GroupsIcon />
          </IconButton>
          <IconButton color="inherit" onClick={() => setDrawerOpen(true)}>
            <SettingsIcon />
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
