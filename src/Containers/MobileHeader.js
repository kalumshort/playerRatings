import { useState } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  Box,
  Typography,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import GroupsIcon from "@mui/icons-material/Groups";
import SettingsIcon from "@mui/icons-material/Settings";
import ThemeToggle from "../Components/Theme/ThemeToggle";
import { useNavigate } from "react-router-dom";

export default function MobileHeader() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <AppBar position="fixed" sx={{ top: "auto", bottom: 0 }}>
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

      {/* Settings Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 250, p: 2 }}>
          <Typography variant="h6">Settings</Typography>
          {/* Add settings options here */}
          <ThemeToggle />
        </Box>
      </Drawer>
    </>
  );
}
