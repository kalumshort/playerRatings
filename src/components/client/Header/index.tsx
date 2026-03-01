"use client";

import React from "react";
import { Box, useTheme, useMediaQuery } from "@mui/material";
import Navbar from "./Navbar";
import NavDrawer from "./NavDrawer";
import { useDrawer } from "./DrawerContext";

export default function Header() {
  const { isOpen, toggleDrawer } = useDrawer();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <>
      {/* Pass the toggle function to your navbar */}
      <Navbar setDrawerOpen={toggleDrawer} isMobile={isMobile} />
      <Box sx={{ height: isMobile ? 64 : 80 }} />
      <NavDrawer
        open={isOpen}
        onClose={() => toggleDrawer(false)}
        isMobile={isMobile}
      />
    </>
  );
}
