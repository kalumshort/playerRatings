"use client";

import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { User } from "lucide-react";
import useUserData from "@/Hooks/useUserData";

import { useAuth } from "@/context/AuthContext";
import ProfileSettings from "@/components/client/Settings/ProfileSettings";
import { useDrawer } from "@/components/client/Header/DrawerContext";

export default function ProfileSettingsPage() {
  const { user, userLoading } = useAuth();
  const { userData } = useUserData();

  const { toggleDrawer } = useDrawer();

  // Show loading or redirect/empty if no user
  if (userLoading) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography>Loading account settings...</Typography>
      </Box>
    );
  }

  // Signed-out visitors used to get a completely blank page here.
  if (!user || !userData) {
    return (
      <Box
        sx={{
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          px: 3,
          gap: 2,
        }}
      >
        <User size={48} strokeWidth={1.5} />
        <Typography variant="h5" fontWeight={900}>
          SIGN IN TO VIEW YOUR PROFILE
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 420 }}>
          Your account settings, groups and voting history live here. Sign in to
          pick up where you left off.
        </Typography>
        <Button variant="contained" onClick={() => toggleDrawer(true)}>
          Sign In
        </Button>
      </Box>
    );
  }

  return <ProfileSettings />;
}
