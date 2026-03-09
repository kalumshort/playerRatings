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

export default function ProfileSettings() {
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

  return (
    <Box sx={{ maxWidth: "600px", margin: "auto", p: 2 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 900 }}>
        Account Settings
      </Typography>

      {/* IDENTITY */}
      <Typography
        variant="caption"
        sx={{ color: "text.secondary", ml: 1, fontWeight: 700 }}
      >
        IDENTITY
      </Typography>
      <Paper sx={{ p: 3, mb: 3, mt: 1 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ p: 2, borderRadius: "50%", bgcolor: "action.hover" }}>
            <User />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              {userData.displayName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {userData.email}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* SECURITY */}
      <Typography
        variant="caption"
        sx={{ color: "text.secondary", ml: 1, fontWeight: 700 }}
      >
        SECURITY
      </Typography>
      <Paper sx={{ p: 3, mb: 3, mt: 1 }}>
        <Stack spacing={2.5}>
          <div>
            <TextField
              label="Display Name"
              size="small"
              fullWidth
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <Button
              variant="outlined"
              size="small"
              sx={{ mt: 1 }}
              onClick={handleUpdateName}
              disabled={
                isSaving || displayName.trim() === (userData.displayName ?? "")
              }
            >
              {isSaving ? "Saving..." : "Update Name"}
            </Button>
          </div>

          <Divider />

          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <ShieldCheck size={18} /> Authentication
          </Typography>

          {isSocialOnly ? (
            <Button
              variant="contained"
              color="primary"
              startIcon={<Key size={18} />}
              onClick={() => setAddPwModalOpen(true)}
            >
              Add Password to Account
            </Button>
          ) : (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button
                variant="outlined"
                startIcon={<Mail size={16} />}
                onClick={() => setEmailModalOpen(true)}
              >
                Change Email
              </Button>
              <Button
                variant="outlined"
                startIcon={<Key size={16} />}
                onClick={() => setChangePwModalOpen(true)}
              >
                Change Password
              </Button>
            </Stack>
          )}
        </Stack>
      </Paper>

      {/* PREFERENCES */}
      <Typography
        variant="caption"
        sx={{ color: "text.secondary", ml: 1, fontWeight: 700 }}
      >
        PREFERENCES
      </Typography>
      <Paper sx={{ p: 3, mb: 3, mt: 1 }}>
        <Stack spacing={3}>
          <SwitcherTrigger />
          <Divider />
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              DARK MODE
            </Typography>
            <ThemeToggle />
          </Box>
        </Stack>
      </Paper>

      <ListItemButton onClick={handleSignOut} sx={{ color: "error.main" }}>
        <ListItemIcon sx={{ minWidth: 40, color: "error.main" }}>
          <LogOut size={20} />
        </ListItemIcon>
        <ListItemText primary="Sign Out" />
      </ListItemButton>

      {/* Modals */}
      <UpdateEmailModal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
      />
      <UpdatePasswordModal
        open={changePwModalOpen}
        onClose={() => setChangePwModalOpen(false)}
      />
      <AddPasswordModal
        open={addPwModalOpen}
        onClose={() => setAddPwModalOpen(false)}
      />
    </Box>
  );
}
