"use client";

import React from "react";
import {
  Box,
  Button,
  Paper,
  Slide,
  Stack,
  Typography,
  Link as MuiLink,
  alpha,
  useTheme,
} from "@mui/material";
import Link from "next/link";

export interface CookieBannerProps {
  open: boolean;
  onAccept: () => void;
  onReject: () => void;
}

/**
 * The consent prompt.
 *
 * Presentational only — the decision, its storage and its effect on the tag
 * all live in the Analytics component above it. Two equally weighted buttons
 * on purpose: a reject that is harder to find than the accept is the exact
 * pattern the ICO has been issuing warnings over, and a ghost-styled "Reject"
 * next to a filled "Accept" reads as one.
 */
export default function CookieBanner({
  open,
  onAccept,
  onReject,
}: CookieBannerProps) {
  const theme = useTheme();

  return (
    <Slide direction="up" in={open} mountOnEnter unmountOnExit>
      <Box
        // `region` + label rather than `dialog`: this does not trap focus and
        // does not block the page, and announcing it as a dialog would tell
        // screen reader users otherwise.
        role="region"
        aria-label="Cookie consent"
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          // Above the app's own chrome, below MUI modals (1300) so a dialog
          // opened over the top is never obscured by it.
          zIndex: 1200,
          p: { xs: 1.5, sm: 2 },
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <Paper
          elevation={8}
          sx={{
            pointerEvents: "auto",
            width: "100%",
            maxWidth: 900,
            p: { xs: 2, sm: 2.5 },
            borderRadius: "16px",
            border: "1px solid",
            borderColor: "divider",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            bgcolor: alpha(theme.palette.background.paper, 0.92),
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", md: "center" }}
            justifyContent="space-between"
          >
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  fontFamily: "'VT323', monospace",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  color: "text.primary",
                  mb: 0.5,
                }}
              >
                Cookies
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: "'Space Mono', monospace",
                  color: "text.secondary",
                  lineHeight: 1.6,
                }}
              >
                We&apos;d like to use analytics cookies to understand how fans
                use 11Votes, so we can make it better. They are off unless you
                turn them on, and signing in and voting work either way. See our{" "}
                <MuiLink
                  component={Link}
                  href="/privacy"
                  sx={{ color: "primary.main", fontWeight: 700 }}
                >
                  Privacy Policy
                </MuiLink>
                .
              </Typography>
            </Box>

            <Stack
              direction="row"
              spacing={1.5}
              sx={{ flexShrink: 0, "& > *": { flex: { xs: 1, md: "none" } } }}
            >
              <Button
                onClick={onReject}
                variant="outlined"
                color="inherit"
                sx={{ px: 3, whiteSpace: "nowrap" }}
              >
                Reject
              </Button>
              <Button
                onClick={onAccept}
                variant="contained"
                color="primary"
                sx={{ px: 3, whiteSpace: "nowrap" }}
              >
                Accept
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Box>
    </Slide>
  );
}
