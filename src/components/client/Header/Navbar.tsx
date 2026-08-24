"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Toolbar, IconButton, Box, Typography, useTheme } from "@mui/material";
import { Menu as MenuIcon } from "lucide-react";
import { GlassAppBar, NavContainer } from "./Header.styles";
import BackButton from "./BackButton";
// import useGroupData from "@/hooks/useGroupsData";

interface NavbarProps {
  setDrawerOpen: (open: boolean) => void;
  isMobile: boolean;
}

export default function Navbar({ setDrawerOpen, isMobile }: NavbarProps) {
  const theme = useTheme();
  //   const { activeGroup } = useGroupData();

  return (
    <GlassAppBar>
      <Toolbar sx={{ height: isMobile ? 64 : 80, px: 2 }}>
        <NavContainer>
          {/* Logo + back. The back button sits alongside the logo, not inside
              it: it used to be a child of the logo's click handler, so every
              tap on "back" also fired the logo's navigation. */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {/*
              Always "/", never the current club. The logo is the way out of a
              club, and pointing it at /{clubSlug} trapped a signed-out visitor
              on a public club page with no route back to the site. A signed-in
              member loses nothing: "/" redirects them to their own club anyway.

              A real <Link> rather than router.push so it opens in a new tab,
              gets a status-bar preview, and works before hydration.
            */}
            <Box
              component={Link}
              href="/"
              aria-label="11Votes home"
              sx={{
                display: "flex",
                alignItems: "center",
                transition: "0.2s",
                "&:hover": { opacity: 0.8 },
              }}
            >
              <Image
                src="/assets/logo/11Votes_Icon_Blue.png" // Next.js knows this is in 'public'
                alt="11Votes Logo"
                width={50}
                height={50}
                priority
              />
            </Box>
            <BackButton />
          </Box>

          {/* Actions */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {/* {!isMobile && user && activeGroup && (
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", fontWeight: 700 }}
              >
                {activeGroup.name}
              </Typography>
            )} */}

            <IconButton
              aria-label="Open navigation menu"
              onClick={() => setDrawerOpen(true)}
              sx={{
                color: "text.primary",
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(0,0,0,0.05)",
                borderRadius: "12px",
              }}
            >
              <MenuIcon size={isMobile ? 24 : 28} />
            </IconButton>
          </Box>
        </NavContainer>
      </Toolbar>
    </GlassAppBar>
  );
}
