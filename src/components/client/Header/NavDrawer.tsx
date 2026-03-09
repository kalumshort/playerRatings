"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  useTheme,
} from "@mui/material";
import { X, LogOut, LayoutDashboard, ChevronRight } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

import { useAuth } from "@/context/AuthContext";
// import useGroupData from "@/hooks/useGroupsData";
// import useUserData from "@/hooks/useUserData";
import { getNavItems } from "./NavItems";

import Login from "../Auth/Login";
import ThemeToggle from "../Theme/ThemeToggle";
import SwitcherTrigger from "../Groups/SwitcherTrigger";
import useGroupData from "@/Hooks/useGroupData";
import useUserData from "@/Hooks/useUserData";

// import GroupExplorer from "./GroupExplorer";

interface NavDrawerProps {
  open: boolean;
  onClose: () => void;
  isMobile: boolean;
}

export default function NavDrawer({ open, onClose, isMobile }: NavDrawerProps) {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { clubSlug } = useParams();
  const { userData } = useUserData();

  const { activeGroup } = useGroupData();

  //   const { activeGroup } = useGroupData();
  //   const { isGroupAdmin } = useUserData();
  const navItems = getNavItems(clubSlug);

  const accentColor = theme.palette.primary.main;

  const handleLogout = async () => {
    await signOut(auth);
    onClose();
    router.push("/");
  };

  const navigateTo = (path: string) => {
    router.push(path);
    onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: isMobile ? "280px" : "320px",
          background: theme.palette.background.default,
          backdropFilter: "blur(20px)",
          borderLeft: `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      <Box
        sx={{ p: 3, display: "flex", flexDirection: "column", height: "100%" }}
      >
        {/* Drawer Header */}
        {/* <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Typography variant="h6" sx={{ color: accentColor, fontWeight: 800 }}>
            {user && activeGroup ? activeGroup.name : "11VOTES"}
          </Typography>
          <IconButton onClick={onClose}>
            <X size={20} />
          </IconButton>
        </Box> */}

        {!user ? (
          <Login />
        ) : (
          <Box sx={{ flexGrow: 1 }}>
            {/* Admin Section */}
            {/* {isGroupAdmin && (
              <Paper
                sx={{
                  mb: 2,
                  p: 0.5,
                  backgroundColor: "rgba(0,0,0,0.05)",
                  borderRadius: "12px",
                }}
              >
                <ListItemButton
                  onClick={() => navigateTo("/group-dashboard")}
                  sx={{ borderRadius: "12px" }}
                >
                  <ListItemIcon sx={{ color: accentColor }}>
                    <LayoutDashboard size={20} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Admin Dashboard"
                    primaryTypographyProps={{
                      variant: "body2",
                      fontWeight: 700,
                    }}
                  />
                </ListItemButton>
              </Paper>
            )} */}
            {/* Main Nav */}
            <List>
              {navItems.map((item) => (
                <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => navigateTo(item.path)}
                    sx={{
                      borderRadius: "12px",
                      "&:hover": { backgroundColor: `${accentColor}15` },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40, color: accentColor }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{ variant: "body2" }}
                    />
                    <ChevronRight size={16} style={{ opacity: 0.3 }} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
            <Divider sx={{ my: 2, opacity: 0.5 }} />
            {userData.groups && <SwitcherTrigger />}
          </Box>
        )}

        {/* Footer Area */}
        <Box sx={{ mt: "auto", pt: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Theme
            </Typography>
            <ThemeToggle />
          </Box>

          {user && (
            <ListItemButton
              onClick={handleLogout}
              sx={{ borderRadius: "12px", color: "error.main" }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: "error.main" }}>
                <LogOut size={20} />
              </ListItemIcon>
              <ListItemText
                primary="Sign Out"
                primaryTypographyProps={{ fontWeight: 700 }}
              />
            </ListItemButton>
          )}
        </Box>
      </Box>
    </Drawer>
  );
}
