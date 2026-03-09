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
import { toast } from "sonner";
import { auth } from "@/lib/firebase/client";
import {
  EmailAuthProvider,
  linkWithCredential,
  AuthError,
} from "firebase/auth";

export default function AddPasswordModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Password strength checks
  const passwordStrength = {
    length: password.length >= 8,
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    hasMixedCase: /[a-z]/.test(password) && /[A-Z]/.test(password),
  };

  const isStrongEnough =
    passwordStrength.length &&
    passwordStrength.hasNumber &&
    passwordStrength.hasSpecial &&
    passwordStrength.hasMixedCase;

  const passwordsMatch = password === confirmPassword && password !== "";
  const isFormValid = isStrongEnough && passwordsMatch;

  const getStrengthMessage = () => {
    if (!password) return "Minimum 8 characters, number, symbol, mixed case";
    if (isStrongEnough) return "Strong password!";
    if (password.length < 8) return "At least 8 characters required";
    return "Include numbers, symbols, uppercase & lowercase letters";
  };

  const handleSubmit = async () => {
    if (!auth.currentUser || !isFormValid) return;

    setLoading(true);

    try {
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email!,
        password,
      );

      await linkWithCredential(auth.currentUser, credential);

      // Reload to help trigger global auth listeners (e.g. context)
      await auth.currentUser?.reload();

      toast.success("Password added successfully!", {
        description: "You can now sign in with email + password too.",
        duration: 5000,
      });

      // Brief delay so toast is visible
      setTimeout(onClose, 1200);
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
        Set Account Password
        <IconButton onClick={onClose} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
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
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            error={password !== "" && !isStrongEnough}
            helperText={getStrengthMessage()}
            FormHelperTextProps={{
              sx: {
                color: isStrongEnough ? "success.main" : "text.secondary",
              },
            }}
            disabled={loading}
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
