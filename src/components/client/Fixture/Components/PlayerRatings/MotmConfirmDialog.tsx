"use client";

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  useTheme,
  alpha,
  Stack,
  Typography,
} from "@mui/material";
import { HelpOutlineRounded, WarningRounded } from "@mui/icons-material";

interface MotmConfirmProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function MotmConfirmDialog({
  open,
  onClose,
  onConfirm,
}: MotmConfirmProps) {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          backgroundColor: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: "blur(12px)",
          borderRadius: "28px",
          border: `1px solid ${theme.palette.divider}`,
          maxWidth: "380px",
          p: 2,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <HelpOutlineRounded color="warning" />
          <Typography variant="h6" fontWeight={900}>
            No Star Man?
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <DialogContentText
          sx={{
            color: "text.secondary",
            fontWeight: 600,
            lineHeight: 1.5,
          }}
        >
          You haven't selected a **Man of the Match**. Are you sure you want to
          lock in your ratings without picking a standout performer?
        </DialogContentText>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          sx={{
            fontWeight: 800,
            color: "text.secondary",
            borderRadius: "12px",
          }}
        >
          Wait, go back
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="primary"
          autoFocus
          sx={{
            fontWeight: 900,
            borderRadius: "12px",
            px: 3,
            boxShadow: theme.shadows[4],
          }}
        >
          Submit Anyway
        </Button>
      </DialogActions>
    </Dialog>
  );
}
