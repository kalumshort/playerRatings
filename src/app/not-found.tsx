"use client";

// MUI's Button is a client component, so passing `component={Link}` (a
// function) from a server component fails serialization. This page has no
// server-only work, so it just runs on the client.

import Link from "next/link";
import { Box, Button, Container, Paper, Typography } from "@mui/material";
import SearchOffRoundedIcon from "@mui/icons-material/SearchOffRounded";

export default function NotFound() {
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
              bgcolor: "primary.main",
              color: "primary.contrastText",
              mb: 1,
            }}
          >
            <SearchOffRoundedIcon sx={{ fontSize: 40 }} />
          </Box>

          <Typography variant="h5" fontWeight={900} letterSpacing={-0.5}>
            PAGE NOT FOUND
          </Typography>

          <Typography color="text.secondary" variant="body1" sx={{ px: 2 }}>
            We couldn't find that page. The club, fixture or player may have
            moved, or the link may be out of date.
          </Typography>

          <Button
            variant="contained"
            component={Link}
            href="/"
            sx={{ mt: 2 }}
          >
            Back to 11Votes
          </Button>
        </Paper>
      </Box>
    </Container>
  );
}
