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
} from "@mui/material";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useRouter } from "next/navigation";
import { handleCreateAccount } from "@/lib/firebase/auth-actions";

export default function AuthTabs({ groupId }: { groupId?: string }) {
  const [tab, setTab] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState({ text: "", isError: false });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Helper to map Firebase error codes to user-friendly messages
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic Client-Side Validation
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
        await handleCreateAccount({ email, password, groupId });
        router.push("/");
      } else {
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
      setMessage({
        text: "Please enter your email to reset your password.",
        isError: true,
      });
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
      <Tabs
        value={tab}
        onChange={(_, v) => {
          setTab(v);
          setMessage({ text: "", isError: false });
        }}
        variant="fullWidth"
        sx={{ mb: 2 }}
      >
        <Tab label="Join" />
        <Tab label="Login" />
      </Tabs>

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
        />

        {tab === 1 && (
          <Box sx={{ textAlign: "right", mt: 0.5 }}>
            <Link
              component="button"
              variant="caption"
              onClick={handleReset}
              type="button"
              disabled={loading}
            >
              Forgot Password?
            </Link>
          </Box>
        )}

        {message.text && (
          <Typography
            variant="caption"
            color={message.isError ? "error.main" : "success.main"}
            sx={{ mt: 1, display: "block", textAlign: "center" }}
          >
            {message.text}
          </Typography>
        )}

        <Button variant="contained" type="submit" fullWidth disabled={loading}>
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
