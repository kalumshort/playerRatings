"use client";

import React from "react";
import { Box, Typography, Button, Paper, Container } from "@mui/material";
import LockTwoToneIcon from "@mui/icons-material/LockTwoTone";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { useRouter } from "next/navigation";
import { useDrawer } from "../client/Header/DrawerContext";

interface PrivateGroupPlaceholderProps {
  name: string;
}

export default function PrivateGroupPlaceholder({
  name,
}: PrivateGroupPlaceholderProps) {
  const router = useRouter();
  const { toggleDrawer } = useDrawer();

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          height: "80vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <Paper
          elevation={0}
          sx={(theme) => ({
            p: 5,

            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          })}
        >
          <Box
            sx={(theme) => ({
              width: 80,
              height: 80,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "primary.main",
              color: "primary.contrastText",
              mb: 1,
            })}
          >
            <LockTwoToneIcon sx={{ fontSize: 40 }} />
          </Box>

          <Typography variant="h5" fontWeight={900} letterSpacing={-0.5}>
            {name.toUpperCase()} IS PRIVATE
          </Typography>

          <Typography color="text.secondary" variant="body1" sx={{ px: 2 }}>
            This fan group is restricted to verified members only. Please sign
            in with an authorized account to view the season schedule and
            voting.
          </Typography>

          <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackRoundedIcon />}
              onClick={() => router.back()}
            >
              Go Back
            </Button>
            <Button variant="contained" onClick={() => toggleDrawer(true)}>
              Sign In
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
