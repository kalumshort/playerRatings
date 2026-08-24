"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Toolbar, IconButton, Box, Typography, useTheme } from "@mui/material";
import { Menu as MenuIcon } from "lucide-react";
import { GlassAppBar, NavContainer } from "./Header.styles";
import BackButton from "./BackButton";

interface NavbarProps {
  setDrawerOpen: (open: boolean) => void;
  isMobile: boolean;
  /** The signed-in fan's own club, resolved on the server. Null when signed
   *  out, or when they have not joined a club yet. */
  homeSlug?: string | null;
}

export default function Navbar({
  setDrawerOpen,
  isMobile,
  homeSlug,
}: NavbarProps) {
  const theme = useTheme();

  // Their own club, not the one in the URL and not "/".
  //
  // "/" is wrong for a signed-in fan: the root page redirects them straight
  // back to their club, and going /club -> / -> /club raced the server
  // redirect against the client one and left the page never rendering.
  // Linking at the real destination removes the round trip entirely.
  //
  // Still "/" while signed out, which is the whole point — a guest on a public
  // club needs a route back to the marketing site.
  const homeHref = homeSlug ? `/${homeSlug}` : "/";

  return (
    <GlassAppBar>
      <Toolbar sx={{ height: isMobile ? 64 : 80, px: 2 }}>
        <NavContainer>
          {/* Logo + back. The back button sits alongside the logo, not inside
              it: it used to be a child of the logo's click handler, so every
              tap on "back" also fired the logo's navigation. */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {/* A real <Link> rather than router.push so it opens in a new tab,
                gets a status-bar preview, and works before hydration. */}
            <Box
              component={Link}
              href={homeHref}
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
