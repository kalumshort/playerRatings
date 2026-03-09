"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Stack,
  TextField,
  Button,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import { X } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import {
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  linkWithCredential,
} from "firebase/auth";

export default function UpdateCredentialsModal({
  open,
  onClose,
  initialTab = "email",
  isSocialOnly,
}: {
  open: boolean;
  onClose: () => void;
  initialTab?: "email" | "password";
  isSocialOnly?: boolean;
}) {
  const [tab, setTab] = useState<"email" | "password">(initialTab);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newValue, setNewValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!auth.currentUser || !newValue) return;

    setLoading(true);
    setError(null);

    try {
      if (isSocialOnly && tab === "password") {
        // LINKING: Social users have no password, so we link the new one directly
        const credential = EmailAuthProvider.credential(
          auth.currentUser.email!,
          newValue,
        );
        await linkWithCredential(auth.currentUser, credential);
      } else {
        // UPDATING: Existing users must re-authenticate with their current password
        if (!currentPassword) {
          throw new Error(
            "Current password is required to verify your identity.",
          );
        }
        const credential = EmailAuthProvider.credential(
          auth.currentUser.email!,
          currentPassword,
        );
        await reauthenticateWithCredential(auth.currentUser, credential);

        if (tab === "email") {
          await updateEmail(auth.currentUser, newValue);
        } else {
          await updatePassword(auth.currentUser, newValue);
        }
      }
      onClose();
    } catch (err: any) {
      console.error("Auth operation failed:", err);
      setError(
        err.message || "Operation failed. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {isSocialOnly && tab === "password"
          ? "Set Account Password"
          : `Update ${tab === "email" ? "Email" : "Password"}`}
        <IconButton onClick={onClose}>
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {/* Toggle between Email/Password only if not a social-only user */}
          {!isSocialOnly && (
            <ToggleButtonGroup
              fullWidth
              value={tab}
              exclusive
              onChange={(_, v) => v && setTab(v)}
            >
              <ToggleButton value="email">Email</ToggleButton>
              <ToggleButton value="password">Password</ToggleButton>
            </ToggleButtonGroup>
          )}

          {error && <Alert severity="error">{error}</Alert>}

          {/* Confirm current password is ONLY needed for updates, not for linking */}
          {!(isSocialOnly && tab === "password") && (
            <TextField
              label="Confirm Current Password"
              type="password"
              fullWidth
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          )}

          <TextField
            label={
              isSocialOnly && tab === "password"
                ? "Choose a New Password"
                : tab === "email"
                  ? "New Email Address"
                  : "New Password"
            }
            type={tab === "email" ? "email" : "password"}
            fullWidth
            onChange={(e) => setNewValue(e.target.value)}
          />

          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading || !newValue}
            size="large"
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : isSocialOnly && tab === "password" ? (
              "Link Password"
            ) : (
              "Save Changes"
            )}
          </Button>

          {isSocialOnly && tab === "password" && (
            <Typography
              variant="caption"
              color="text.secondary"
              textAlign="center"
            >
              Linking a password allows you to log in via email in addition to
              Google.
            </Typography>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
