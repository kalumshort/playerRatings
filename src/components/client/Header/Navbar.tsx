"use client";

import React from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { Toolbar, IconButton, Box, Typography, useTheme } from "@mui/material";
import { Menu as MenuIcon } from "lucide-react";
import { GlassAppBar, NavContainer } from "./Header.styles";
import { useAuth } from "@/context/AuthContext";
import BackButton from "./BackButton";
// import useGroupData from "@/hooks/useGroupsData";

interface NavbarProps {
  setDrawerOpen: (open: boolean) => void;
  isMobile: boolean;
}

export default function Navbar({ setDrawerOpen, isMobile }: NavbarProps) {
  const router = useRouter();
  const theme = useTheme();
  const { user } = useAuth();
  const { clubSlug } = useParams();
  //   const { activeGroup } = useGroupData();

  return (
    <GlassAppBar elevation={0}>
      <Toolbar sx={{ height: isMobile ? 64 : 80, px: 2 }}>
        <NavContainer>
          {/* Logo */}
          <Box
            onClick={() => router.push(`/${clubSlug}`)}
            sx={{
              cursor: "pointer",
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
