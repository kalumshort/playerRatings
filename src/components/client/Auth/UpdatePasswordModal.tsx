"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Stack,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Typography,
  CircularProgress,
} from "@mui/material";
import { X, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner"; // ← Sonner import
import { auth } from "@/lib/firebase/client";
import {
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  AuthError,
} from "firebase/auth";
import {
  isPasswordStrong,
  getPasswordHelperText,
} from "@/lib/utils/password-policy";

export default function UpdatePasswordModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Don't leave plaintext passwords in state after the dialog closes, and
  // don't reopen onto a stale pre-filled form.
  useEffect(() => {
    if (!open) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
      setLoading(false);
    }
  }, [open]);

  // Client-side validation — shared with signup and the social link flow.
  const passwordsMatch = newPassword === confirmPassword && newPassword !== "";
  const passwordStrong = isPasswordStrong(newPassword);
  const isFormValid =
    passwordStrong && passwordsMatch && currentPassword !== "";

  const handleSubmit = async () => {
    if (!auth.currentUser || !isFormValid) return;

    setLoading(true);

    try {
      // Step 1: Re-authenticate
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email!,
        currentPassword,
      );
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Step 2: Update password
      await updatePassword(auth.currentUser, newPassword);

      // Optional: reload to help sync global auth state
      await auth.currentUser?.reload();

      // Success toast (global)
      toast.success("Password updated successfully!", {
        description: "You may need to sign in again in some cases.",
        duration: 4000,
      });

      // Close immediately — the toast is global and outlives the dialog.
      // Deferring the close left the submit button re-enabled on a valid form.
      onClose();
    } catch (err: unknown) {
      console.error("Password update failed:", err);

      const errorCode = (err as AuthError)?.code;
      let message = "Failed to update password. Please try again.";

      switch (errorCode) {
        case "auth/wrong-password":
        case "auth/invalid-credential":
          message = "Current password is incorrect.";
          break;
        case "auth/requires-recent-login":
          message =
            "Your session is too old. Please sign out and sign back in, then try again.";
          break;
        case "auth/weak-password":
          message =
            "New password is too weak. Use at least 8 characters with better complexity.";
          break;
        case "auth/user-not-found":
        case "auth/user-token-expired":
          message = "User session invalid. Please sign in again.";
          break;
        case "auth/operation-not-allowed":
          message =
            "Password updates are not enabled in your Firebase project.";
          break;
        case "auth/too-many-requests":
          message =
            "Too many attempts. Please wait a few minutes and try again.";
          break;
        default:
          if ((err as AuthError)?.message?.includes("network")) {
            message = "Network error. Check your connection and try again.";
          }
      }

      // Error toast (global)
      toast.error(message, {
        duration: 6000,
      });

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
          pr: 1,
        }}
      >
        Change Password
        <IconButton onClick={onClose} size="small" aria-label="Close">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            label="Current Password"
            type={showCurrent ? "text" : "password"}
            fullWidth
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="Toggle password visibility"
                    onClick={() => setShowCurrent(!showCurrent)}
                    edge="end"
                    size="small"
                  >
                    {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            disabled={loading}
          />

          <TextField
            label="New Password"
            type={showNew ? "text" : "password"}
            fullWidth
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            error={newPassword !== "" && !passwordStrong}
            helperText={getPasswordHelperText(newPassword)}
            FormHelperTextProps={{
              sx: { color: passwordStrong ? "success.main" : undefined },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="Toggle password visibility"
                    onClick={() => setShowNew(!showNew)}
                    edge="end"
                    size="small"
                  >
                    {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            disabled={loading}
          />

          <TextField
            label="Confirm New Password"
            type={showConfirm ? "text" : "password"}
            fullWidth
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={confirmPassword !== "" && !passwordsMatch}
            helperText={
              confirmPassword !== "" && !passwordsMatch
                ? "Passwords do not match"
                : ""
            }
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="Toggle password visibility"
                    onClick={() => setShowConfirm(!showConfirm)}
                    edge="end"
                    size="small"
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            disabled={loading}
          />

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ textAlign: "center", display: "block" }}
          >
            After updating, you may need to sign in again with the new password.
          </Typography>

          <Button
            variant="contained"
            fullWidth
            onClick={handleSubmit}
            disabled={loading || !isFormValid}
            size="large"
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Update Password"
            )}
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
