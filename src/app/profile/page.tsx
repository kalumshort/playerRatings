"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Stack,
  Divider,
  Button,
  ListItemText,
  ListItemIcon,
  ListItemButton,
} from "@mui/material";
import { User, LogOut, ShieldCheck, Mail, Key } from "lucide-react";
import { updateUserField } from "@/lib/firebase/client-user-actions";
import useUserData from "@/Hooks/useUserData";

import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/client/Theme/ThemeToggle";
import SwitcherTrigger from "@/components/client/Groups/SwitcherTrigger";
import UpdateEmailModal from "@/components/client/Auth/UpdateEmailModal";
import UpdatePasswordModal from "@/components/client/Auth/UpdatePasswordModal";
import AddPasswordModal from "@/components/client/Auth/SocialAddPasswordModal";
import { useAuth } from "@/context/AuthContext";
import ProfileSettings from "@/components/client/Settings/ProfileSettings";
import { useDrawer } from "@/components/client/Header/DrawerContext";
import { toast } from "sonner";

export default function ProfileSettingsPage() {
  const { user, userLoading, isSocialOnly, signOut } = useAuth();
  const { userData } = useUserData();

  const [displayName, setDisplayName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [changePwModalOpen, setChangePwModalOpen] = useState(false);
  const [addPwModalOpen, setAddPwModalOpen] = useState(false);

  const router = useRouter();
  const { toggleDrawer } = useDrawer();

  useEffect(() => {
    if (userData?.displayName) {
      setDisplayName(userData.displayName);
    }
  }, [userData]);

  const handleUpdateName = async () => {
    if (!userData?.uid || displayName.trim() === userData.displayName) return;

    setIsSaving(true);
    try {
      await updateUserField(userData.uid, "displayName", displayName.trim());
      toast.success("Display name updated.");
    } catch (err) {
      // Previously try/finally with no catch: a failed save just reset the
      // spinner and left an unhandled rejection.
      console.error("Failed to update display name:", err);
      toast.error("Couldn't update your display name. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(); // uses the context's signOut
    router.push("/");
  };

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
