"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  Link,
  CircularProgress,
  useTheme,
} from "@mui/material";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useRouter } from "next/navigation";
import { handleCreateAccount } from "@/lib/firebase/auth-actions";

interface AuthTabsProps {
  groupId?: string;
  mode?: "auth" | "signup"; // "auth" shows both, "signup" locks to Join
}

export default function AuthTabs({ groupId, mode = "auth" }: AuthTabsProps) {
  const theme = useTheme();
  // If mode is signup, force tab to 0 (Join) and stay there
  const [tab, setTab] = useState(mode === "signup" ? 0 : 0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState({ text: "", isError: false });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const isSignupOnly = mode === "signup";

  const getFriendlyError = (code: string) => {
    switch (code) {
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/email-already-in-use":
        return "An account with this email already exists.";
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Incorrect email or password.";
      case "auth/weak-password":
        return "Password must be at least 6 characters long.";
      case "auth/too-many-requests":
        return "Too many attempts. Please try again later.";
      default:
        return "Something went wrong. Please try again.";
    }
  };

  const isFormInvalid = !email.trim() || !password.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setMessage({
        text: "Please enter both email and password.",
        isError: true,
      });
      return;
    }

    setLoading(true);
    setMessage({ text: "", isError: false });

    try {
      if (tab === 0) {
        // Sign Up Flow - Handles group joining via Server Action
        await handleCreateAccount({ email, password, groupId });
        router.push("/");
      } else {
        // Standard Login Flow - No groupId passed here per your requirement
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setMessage({ text: getFriendlyError(err.code), isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email) {
      setMessage({ text: "Enter email to reset password.", isError: true });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage({
        text: "Check your email for the reset link!",
        isError: false,
      });
    } catch (err: any) {
      setMessage({ text: getFriendlyError(err.code), isError: true });
    }
  };

  return (
    <Box sx={{ width: "100%", maxWidth: 400, mx: "auto" }}>
      {/* Hide Tabs if in signup-only mode */}
      {!isSignupOnly && (
        <Tabs
          value={tab}
          onChange={(_, v) => {
            setTab(v);
            setMessage({ text: "", isError: false });
          }}
          variant="fullWidth"
          sx={{ mb: 3 }}
        >
          <Tab label="Join" />
          <Tab label="Login" />
        </Tabs>
      )}

      <form onSubmit={handleSubmit}>
        <TextField
          label="Email"
          type="email"
          fullWidth
          margin="dense"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
          sx={{ mb: 1 }}
        />
        <TextField
          label="Password"
          type="password"
          fullWidth
          margin="dense"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          required
          sx={{ mb: 1 }}
        />

        {tab === 1 && !isSignupOnly && (
          <Box sx={{ textAlign: "right", mb: 2 }}>
            <Link
              component="button"
              variant="caption"
              onClick={handleReset}
              type="button"
              disabled={loading}
              sx={{ color: "text.secondary", textDecoration: "none" }}
            >
              Forgot Password?
            </Link>
          </Box>
        )}

        {message.text && (
          <Typography
            variant="caption"
            sx={{
              mt: 1,
              mb: 2,
              display: "block",
              textAlign: "center",
              color: message.isError ? "error.main" : "success.main",
              fontWeight: 500,
            }}
          >
            {message.text}
          </Typography>
        )}

        <Button
          variant="contained"
          type="submit"
          fullWidth
          // Disable if loading OR if the form is invalid
          disabled={loading || isFormInvalid}
          sx={{
            py: 1.5,
            borderRadius: theme.spacing(1.5),
            boxShadow: theme.shadows[2],
            // Optional: Add a visual cue for the disabled state via theme alpha
            "&.Mui-disabled": {
              backgroundColor: theme.palette.action.disabledBackground,
              color: theme.palette.action.disabled,
            },
          }}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : tab === 0 ? (
            "Create Account"
          ) : (
            "Login"
          )}
        </Button>
      </form>
    </Box>
  );
}
