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

export default function ProfileSettingsPage() {
  const { user, userLoading, isSocialOnly, signOut } = useAuth();
  const { userData } = useUserData();

  const [displayName, setDisplayName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [changePwModalOpen, setChangePwModalOpen] = useState(false);
  const [addPwModalOpen, setAddPwModalOpen] = useState(false);

  const router = useRouter();

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

  if (!user || !userData) {
    return null; // or redirect to login
  }

  return <ProfileSettings />;
}
