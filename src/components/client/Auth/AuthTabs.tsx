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
} from "@mui/material";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";

import { useRouter } from "next/navigation";

import { handleCreateAccount } from "@/lib/firebase/auth-actions";

/**
 * Firebase error codes are deliberately not surfaced verbatim — codes like
 * `auth/user-not-found` let an attacker enumerate which emails have accounts.
 */
function friendlyAuthError(code: string | undefined): string {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-email":
      return "Incorrect email or password.";
    case "auth/email-already-in-use":
      return "That email can't be used. Try signing in instead.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Sign-in was cancelled.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export default function AuthTabs({ groupId }: { groupId?: string }) {
  const [tab, setTab] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState({ text: "", isError: false });
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (tab === 0) {
        await handleCreateAccount({ email, password, groupId });
        router.push("/");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        // AuthListener in AuthContext will handle the redirect or UI change
      }
    } catch (err: any) {
      setMessage({ text: friendlyAuthError(err?.code), isError: true });
    }
  };

  const handleReset = async () => {
    if (!email) return setMessage({ text: "Enter email first", isError: true });

    // Always report the same outcome so this can't be used to probe for accounts.
    const neutral = "If that email is registered, a reset link is on its way.";
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage({ text: neutral, isError: false });
    } catch (err: any) {
      const isRateLimited = err?.code === "auth/too-many-requests";
      setMessage({
        text: isRateLimited ? friendlyAuthError(err.code) : neutral,
        isError: isRateLimited,
      });
    }
  };

  return (
    <Box>
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="fullWidth"
        sx={{ mb: 2 }}
      >
        <Tab label="Join" />
        <Tab label="Login" />
      </Tabs>

      <form onSubmit={handleSubmit}>
        <TextField
          label="Email"
          fullWidth
          margin="dense"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="Password"
          type="password"
          fullWidth
          margin="dense"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {tab === 1 && (
          <Box sx={{ textAlign: "right", mt: 0.5 }}>
            <Link
              component="button"
              variant="caption"
              onClick={handleReset}
              type="button"
            >
              Forgot Password?
            </Link>
          </Box>
        )}

        {message.text && (
          <Typography
            variant="caption"
            color={message.isError ? "error" : "success.main"}
            sx={{ mt: 1, display: "block" }}
          >
            {message.text}
          </Typography>
        )}

        <Button
          variant="contained"
          type="submit"
          fullWidth
          sx={{ mt: 3, borderRadius: "12px", py: 1 }}
        >
          {tab === 0 ? "Create Account" : "Welcome Back"}
        </Button>
      </form>
    </Box>
  );
}
