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
  Alert,
  CircularProgress,
} from "@mui/material";
import { X, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/context/AuthContext";
import {
  EmailAuthProvider,
  linkWithCredential,
  AuthError,
} from "firebase/auth";
import {
  isPasswordStrong,
  getPasswordHelperText,
} from "@/lib/utils/password-policy";

export default function AddPasswordModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user, refreshUser } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Never leave a plaintext password sitting in state after the dialog goes
  // away, and never reopen onto a stale pre-filled form.
  useEffect(() => {
    if (!open) {
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setShowConfirm(false);
      setLoading(false);
    }
  }, [open]);

  // Linking an email/password credential needs an email to link it to, and
  // Firebase accounts are not guaranteed to have one.
  const accountEmail = user?.email ?? null;

  const strongEnough = isPasswordStrong(password);
  const passwordsMatch = password === confirmPassword && password !== "";
  const isFormValid = Boolean(accountEmail) && strongEnough && passwordsMatch;

  const handleSubmit = async () => {
    if (!auth.currentUser || !accountEmail || !isFormValid || loading) return;

    setLoading(true);

    try {
      const credential = EmailAuthProvider.credential(accountEmail, password);

      await linkWithCredential(auth.currentUser, credential);

      // Tell the auth context to re-read the user, otherwise the account
      // screen keeps offering "Add Password" until a full page refresh.
      await refreshUser();

      toast.success("Password added successfully!", {
        description: "You can now sign in with email + password too.",
        duration: 5000,
      });

      // Close immediately — the toast is global and outlives the dialog.
      // Deferring the close used to leave the button re-enabled on a valid
      // form, so a second click hit `auth/provider-already-linked`.
      onClose();
    } catch (err: unknown) {
      console.error("Failed to link password:", err);

      const errorCode = (err as AuthError)?.code;
      let message = "Failed to add password. Please try again.";

      switch (errorCode) {
        case "auth/weak-password":
          message = "Password is too weak. Please choose a stronger one.";
          break;
        case "auth/operation-not-allowed":
          message =
            "Email/password authentication is not enabled in your Firebase project.";
          break;
        case "auth/provider-already-linked":
          message =
            "This account already has a password. Use Change Password instead.";
          break;
        case "auth/credential-already-in-use":
        case "auth/email-already-in-use":
        case "auth/account-exists-with-different-credential":
          message =
            "This email is already linked to an account. Try signing in differently.";
          break;
        case "auth/requires-recent-login":
          message =
            "Your session is too old for this action. Please sign out and sign back in.";
          break;
        case "auth/invalid-email":
          message = "The email associated with your account appears invalid.";
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

      toast.error(message, {
        duration: 7000,
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
        Set Account Password
        <IconButton onClick={onClose} size="small" aria-label="Close">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {!accountEmail && (
            <Alert severity="warning">
              Your account doesn&apos;t have an email address, so a password
              can&apos;t be added to it.
            </Alert>
          )}

          <TextField
            label="New Password"
            type={showPassword ? "text" : "password"}
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="Toggle password visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            error={password !== "" && !strongEnough}
            helperText={getPasswordHelperText(password)}
            FormHelperTextProps={{
              sx: {
                color: strongEnough ? "success.main" : "text.secondary",
              },
            }}
            disabled={loading || !accountEmail}
          />

          <TextField
            label="Confirm Password"
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
            disabled={loading || !accountEmail}
          />

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ textAlign: "center", display: "block" }}
          >
            This adds email + password sign-in alongside your existing social
            provider (Google, Apple, etc.).
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
              "Add Password"
            )}
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
