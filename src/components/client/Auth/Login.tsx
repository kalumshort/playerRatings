"use client";

import React from "react";
import { Box, Typography, Divider, useTheme } from "@mui/material";
import AuthTabs from "./AuthTabs";
import GoogleButton from "./GoogleButton";

interface LoginProps {
  groupId?: string;
  mode?: "auth" | "signup";
}

export default function Login({ groupId, mode = "auth" }: LoginProps) {
  const theme = useTheme();
  const isSignupOnly = mode === "signup";

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 400,
        mx: "auto",
        // Adding a slight fade-in for a premium feel compared to Fanalysis
        animation: "fadeIn 0.3s ease-in-out",
        "@keyframes fadeIn": {
          from: { opacity: 0, transform: "translateY(10px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
      }}
    >
      {/* Pass the mode to AuthTabs. 
          If mode is signup, AuthTabs will hide the "Login" tab automatically.
      */}
      <AuthTabs groupId={groupId} mode={mode} />

      <Divider
        sx={{
          my: theme.spacing(3),
          "&::before, &::after": {
            borderColor: theme.palette.divider,
          },
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            px: 1,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          {isSignupOnly ? "Or Join With" : "OR"}
        </Typography>
      </Divider>

      {/* Ensure GoogleButton is also aware of the groupId 
          to trigger the server-side join logic on callback.
      */}
      <GoogleButton groupId={groupId} />

      {isSignupOnly && (
        <Typography
          variant="caption"
          display="block"
          textAlign="center"
          sx={{ mt: 2, color: "text.disabled" }}
        >
          By joining, you agree to the 11votes community guidelines.
        </Typography>
      )}
    </Box>
  );
}
