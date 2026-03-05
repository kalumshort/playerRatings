"use client";

import React from "react";
import { Box, Typography, keyframes } from "@mui/material";
import Image from "next/image";

// Define the spin animation
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// Define the pulse for the logo
const logoPulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
`;

interface SpinnerProps {
  text?: string;
}

export function Spinner({ text }: SpinnerProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        width: "100%",
        position: "fixed",
        top: 0,
        left: 0,
        backgroundColor: "background.default",
        zIndex: 9999,
      }}
    >
      <Box
        sx={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Outer Spinning Ring */}
        <Box
          sx={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            border: "3px solid transparent",
            borderTopColor: "primary.main",
            borderBottomColor: "primary.main",
            animation: `${spin} 1.5s linear infinite`,
          }}
        />

        {/* Inner Spinning Ring (Opposite Direction) */}
        <Box
          sx={{
            position: "absolute",
            width: 70,
            height: 70,
            borderRadius: "50%",
            border: "3px solid transparent",
            borderLeftColor: "secondary.main",
            borderRightColor: "secondary.main",
            animation: `${spin} 1s linear infinite reverse`,
            opacity: 0.7,
          }}
        />

        {/* The Logo Overlay */}
        <Box
          sx={{
            position: "absolute",
            animation: `${logoPulse} 2s ease-in-out infinite`,
          }}
        >
          {/* <Image
            src={whiteLogo}
            alt="11Votes Logo"
            width={45}
            height={45}
            style={{ objectFit: "contain" }}
            priority
          /> */}
        </Box>
      </Box>

      {/* Loading Text */}
      {text && (
        <Typography
          variant="body2"
          sx={{
            mt: 4,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.2rem",
            color: "text.secondary",
            textAlign: "center",
          }}
        >
          {text}
        </Typography>
      )}
    </Box>
  );
}
