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
  Alert,
} from "@mui/material";
import { User, LogOut, ShieldCheck, Mail, Key } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import useUserData from "@/Hooks/useUserData";
import { updateUserField } from "@/lib/firebase/client-user-actions";
import ThemeToggle from "@/components/client/Theme/ThemeToggle";
import SwitcherTrigger from "../Groups/SwitcherTrigger";
import useGroupData from "@/Hooks/useGroupData";

interface AccountTabProps {
  onOpenEmail: () => void;
  onOpenPassword: () => void;
  onOpenSocialAdd: () => void;
}

export default function AccountTab({
  onOpenEmail,
  onOpenPassword,
  onOpenSocialAdd,
}: AccountTabProps) {
  const { userData } = useUserData();
  const { groupData } = useGroupData();
  const { isSocialOnly, signOut } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userData?.displayName) setDisplayName(userData.displayName);
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
    await signOut();
    router.push("/");
  };

  if (!userData) return null;

  return (
    <Box>
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

      <Typography
        variant="caption"
        sx={{ color: "text.secondary", ml: 1, fontWeight: 700 }}
      >
        SECURITY
      </Typography>
      <Paper sx={{ p: 3, mb: 3, mt: 1 }}>
        <Stack spacing={2.5}>
          <Box>
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
          </Box>
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
              startIcon={<Key size={18} />}
              onClick={onOpenSocialAdd}
            >
              Add Password to Account
            </Button>
          ) : (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button
                variant="outlined"
                startIcon={<Mail size={16} />}
                onClick={onOpenEmail}
              >
                Change Email
              </Button>
              <Button
                variant="outlined"
                startIcon={<Key size={16} />}
                onClick={onOpenPassword}
              >
                Change Password
              </Button>
            </Stack>
          )}
        </Stack>
      </Paper>

      <Typography
        variant="caption"
        sx={{ color: "text.secondary", ml: 1, fontWeight: 700 }}
      >
        PREFERENCES
      </Typography>

      <Paper sx={{ p: 3, mb: 3, mt: 1 }}>
        {groupData && (
          <Box>
            <SwitcherTrigger />
          </Box>
        )}

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "15px",
          }}
        >
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            DARK MODE
          </Typography>
          <ThemeToggle />
        </Box>
      </Paper>

      <ListItemButton
        onClick={handleSignOut}
        sx={{ color: "error.main", borderRadius: 2 }}
      >
        <ListItemIcon sx={{ minWidth: 40, color: "error.main" }}>
          <LogOut size={20} />
        </ListItemIcon>
        <ListItemText primary="Sign Out" />
      </ListItemButton>
    </Box>
  );
}
