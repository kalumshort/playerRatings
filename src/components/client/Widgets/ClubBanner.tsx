"use client";

import React from "react";
import { Box, Typography, Button, styled, alpha } from "@mui/material";

// Use styled components to keep inline styles minimal and theme-aware
const BannerContainer = styled(Box)(({ theme }) => ({
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderTop: `1px solid ${theme.palette.divider}`,
  // Use theme tokens for shadow
  boxShadow: `0px -4px 10px ${alpha(theme.palette.common.black, 0.1)}`,
  zIndex: 1000,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  textAlign: "center",
}));

export default function GuestClubBanner({ groupData, isGuestView }: any) {
  if (!isGuestView) return null;

  return (
    <BannerContainer>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        Viewing <strong>{groupData.name}</strong> as a guest.
      </Typography>

      <Button
        size="small"
        onClick={() => (window.location.href = "/")}
        variant="outlined"
      >
        Back to My Club
      </Button>
    </BannerContainer>
  );
}
