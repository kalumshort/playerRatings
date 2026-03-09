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
  InputAdornment,
  Typography,
  CircularProgress,
} from "@mui/material";
import { X, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner"; // ← Sonner for global toasts
import { auth } from "@/lib/firebase/client";
import {
  verifyBeforeUpdateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  AuthError,
} from "firebase/auth";

export default function UpdateEmailModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Basic client-side validation
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim());
  const isFormValid =
    isEmailValid && newEmail.trim() !== "" && currentPassword !== "";

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

      // Step 2: Request email update + verification
      await verifyBeforeUpdateEmail(auth.currentUser, newEmail.trim());

      // Optional: reload to sync global auth state
      await auth.currentUser?.reload();

      // Success toast
      toast.success("Verification email sent!", {
        description:
          "Please check your inbox (and spam) and click the link to confirm the new email address.",
        duration: 6000,
      });

      // Close after short delay so toast is visible
      setTimeout(onClose, 1800);
    } catch (err: unknown) {
      console.error("Email update failed:", err);

      const errorCode = (err as AuthError)?.code;
      let message = "Failed to update email. Please try again.";

      switch (errorCode) {
        case "auth/wrong-password":
        case "auth/invalid-credential":
          message = "Current password is incorrect.";
          break;
        case "auth/requires-recent-login":
          message =
            "Your session is too old. Please sign out and sign back in, then try again.";
          break;
        case "auth/email-already-in-use":
          message = "This email is already in use by another account.";
          break;
        case "auth/invalid-email":
          message = "The new email address is not valid.";
          break;
        case "auth/operation-not-allowed":
          message =
            "Email updates are not enabled in your Firebase project (check Email/Password provider).";
          break;
        case "auth/too-many-requests":
          message =
            "Too many attempts. Please wait a few minutes and try again.";
          break;
        case "auth/user-not-found":
        case "auth/user-token-expired":
          message = "User session invalid. Please sign in again.";
          break;
        default:
          if ((err as AuthError)?.message?.includes("network")) {
            message = "Network error. Check your connection and try again.";
          } else if ((err as AuthError)?.message?.includes("verify")) {
            message =
              "Please verify the new email before the change can take effect.";
          }
      }

      // Error toast
      toast.error(message, {
        duration: 7000,
      });
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
          pr: 1,
        }}
      >
        Change Email
        <IconButton onClick={onClose} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            label="Current Password"
            type={showPassword ? "text" : "password"}
            fullWidth
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            disabled={loading}
          />

          <TextField
            label="New Email Address"
            type="email"
            fullWidth
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            error={newEmail !== "" && !isEmailValid}
            helperText={
              newEmail !== "" && !isEmailValid
                ? "Please enter a valid email address"
                : ""
            }
            disabled={loading}
          />

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ textAlign: "center", display: "block" }}
          >
            A verification email will be sent to the new address. You must click
            the link to complete the change.
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
              "Update Email"
            )}
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
