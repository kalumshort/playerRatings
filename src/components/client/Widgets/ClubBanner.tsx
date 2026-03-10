"use client";

import React from "react";

import { Box, Typography, Button } from "@mui/material"; // Assuming MUI based on your file structure

export default function GuestClubBanner({ groupData, isGuestView }) {
  if (!isGuestView) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        p: 2,
        backgroundColor: "background.paper", // Uses your theme
        borderTop: "1px solid",
        borderColor: "divider",
        boxShadow: "0px -4px 10px rgba(0,0,0,0.1)",
        zIndex: 1000,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        Viewing <strong>{groupData.name}</strong> as a guest.
      </Typography>
      {/* Add a button to return to their own club if needed */}
      <Button
        variant="text"
        size="small"
        onClick={() => (window.location.href = "/")} // Or your routing logic
      >
        Back to My Club
      </Button>
    </Box>
  );
}
