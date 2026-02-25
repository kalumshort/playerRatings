"use client";

import React, { useState } from "react";
import { Box, useTheme, useMediaQuery } from "@mui/material";
import Navbar from "./Navbar";
import NavDrawer from "./NavDrawer";

export default function Header({
  serverIsLoggedIn,
}: {
  serverIsLoggedIn: boolean;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <>
      <Navbar setDrawerOpen={setDrawerOpen} isMobile={isMobile} />

      {/* Spacer to prevent content overlap */}
      <Box sx={{ height: isMobile ? 64 : 80 }} />

      <NavDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        isMobile={isMobile}
      />
    </>
  );
}
