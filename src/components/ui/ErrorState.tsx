"use client";

import React from "react";
import { Box, Button, Container, Paper, Typography } from "@mui/material";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { useRouter } from "next/navigation";

interface ErrorStateProps {
  title?: string;
  description?: string;
  /** Next.js error boundary reset(). Omit to hide the retry button. */
  onRetry?: () => void;
  /** Shown in small print — Next.js supplies this on production errors. */
  digest?: string;
}

/**
 * Shared visual for route-level error.tsx boundaries. Mirrors the layout of
 * PrivateGroupPlaceholder so a failure looks like part of the app rather than
 * a raw framework screen.
 */
export default function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this page. That's on us — try again in a moment.",
  onRetry,
  digest,
}: ErrorStateProps) {
  const router = useRouter();

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <Paper
          sx={{
            p: 5,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "error.main",
              color: "common.white",
              mb: 1,
            }}
          >
            <ReportProblemRoundedIcon sx={{ fontSize: 40 }} />
          </Box>

          <Typography variant="h5" fontWeight={900} letterSpacing={-0.5}>
            {title}
          </Typography>

          <Typography color="text.secondary" variant="body1" sx={{ px: 2 }}>
            {description}
          </Typography>

          <Box sx={{ mt: 2, display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackRoundedIcon />}
              onClick={() => router.back()}
            >
              Go Back
            </Button>
            {onRetry && (
              <Button
                variant="contained"
                startIcon={<RefreshRoundedIcon />}
                onClick={onRetry}
              >
                Try Again
              </Button>
            )}
          </Box>

          {digest && (
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ mt: 1, fontFamily: "var(--font-space-mono)" }}
            >
              Reference: {digest}
            </Typography>
          )}
        </Paper>
      </Box>
    </Container>
  );
}
