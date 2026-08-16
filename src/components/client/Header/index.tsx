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
      {/*
        Pure CSS breakpoints, not useMediaQuery: without ssrMatchMedia the hook
        returns false during SSR, so this spacer rendered at 80px on the server
        and snapped to 64px after hydration — a visible jump on every mobile
        page load. The media query is correct before any JS runs.
      */}
      <Box sx={{ height: { xs: 64, md: 80 } }} />
      <NavDrawer
        open={isOpen}
        onClose={() => toggleDrawer(false)}
        isMobile={isMobile}
      />
    </>
  );
}
