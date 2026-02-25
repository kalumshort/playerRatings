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
      setMessage({ text: err.message, isError: true });
    }
  };

  const handleReset = async () => {
    if (!email) return setMessage({ text: "Enter email first", isError: true });
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage({ text: "Reset email sent!", isError: false });
    } catch (err: any) {
      setMessage({ text: err.message, isError: true });
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
