"use client";

import React from "react";
import { Box, Typography, Divider } from "@mui/material";
import AuthTabs from "./AuthTabs";
import GoogleButton from "./GoogleButton";

export default function Login({ groupId }: { groupId?: string }) {
  return (
    <Box sx={{ width: "100%", maxWidth: 400, mx: "auto" }}>
      <AuthTabs groupId={groupId} />

      <Divider sx={{ my: 3 }}>
        <Typography variant="caption" sx={{ color: "text.secondary", px: 1 }}>
          OR
        </Typography>
      </Divider>

      <GoogleButton groupId={groupId} />
    </Box>
  );
}
