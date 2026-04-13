"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
  IconButton,
  Box,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Login from "./Login"; // Your existing component

interface GroupContext {
  id: string;
  name: string;
}

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
  group?: GroupContext;
}

export default function AuthDialog({ open, onClose, group }: AuthDialogProps) {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: theme.spacing(3), // Claymorphic rounding
          padding: theme.spacing(2),
          backgroundImage: "none", // Clean slate for our theme
          boxShadow: theme.shadows[10], // Ensure deep elevation
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight="bold">
            {group ? "Join the Squad" : "Welcome Back"}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {group && (
          <Box
            sx={{
              backgroundColor: "action.hover",
              borderRadius: theme.spacing(1.5),
              p: 2,
              mb: 3,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="body2" textAlign="center">
              Sign up now to automatically join <strong>{group.name}</strong>{" "}
              and start voting on match days!
            </Typography>
          </Box>
        )}

        <Login groupId={group?.id} mode={group ? "signup" : "auth"} />
      </DialogContent>
    </Dialog>
  );
}
