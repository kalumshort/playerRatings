"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
  Button,
  Box,
  IconButton,
  CircularProgress,
  useTheme,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import GroupsIcon from "@mui/icons-material/Groups";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer"; // Added for Club context

import { useRouter } from "next/navigation";
import { handleAddUserToGroup } from "@/lib/firebase/client-actions";

interface JoinGroupDialogProps {
  open: boolean;
  onClose: () => void;
  groupData: {
    id: string;
    name: string;
    groupType: "club" | "group"; // Now required for messaging logic
  };
  userData: {
    uid: string;
  };
}

export default function JoinGroupDialog({
  open,
  onClose,
  groupData,
  userData,
}: JoinGroupDialogProps) {
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isClub = groupData.groupType === "club";

  const handleJoin = async () => {
    setLoading(true);
    setError(null);

    const result = await handleAddUserToGroup({
      userData,
      groupId: groupData.id,
    });

    if (result.success) {
      router.refresh();
      onClose();
    } else {
      setError(result.message);
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: theme.spacing(3),
          padding: theme.spacing(1),
          boxShadow: theme.shadows[15],
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight="bold">
            {isClub ? "Join the Squad" : "Join Community"}
          </Typography>
          {!loading && (
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ textAlign: "center", py: 2 }}>
          {/* Dynamic Icon based on groupType */}
          {isClub ? (
            <SportsSoccerIcon
              sx={{
                fontSize: 60,
                color: "primary.main",
                mb: 2,
                opacity: 0.9,
              }}
            />
          ) : (
            <GroupsIcon
              sx={{
                fontSize: 60,
                color: "primary.main",
                mb: 2,
                opacity: 0.9,
              }}
            />
          )}

          <Typography variant="body1" sx={{ mb: 3, px: 1 }}>
            {isClub ? (
              <>
                Ready to back your club? Join <strong>{groupData.name}</strong>{" "}
                to influence the match-day consensus and see how your squad
                ranks.
              </>
            ) : (
              <>
                Join <strong>{groupData.name}</strong> to contribute to communal
                voting and help drive the group's tactical choices.
              </>
            )}
          </Typography>

          {error && (
            <Alert
              severity="error"
              sx={{ mb: 3, borderRadius: theme.spacing(1) }}
            >
              {error}
            </Alert>
          )}

          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={handleJoin}
            disabled={loading}
            sx={{
              py: 1.5,
              borderRadius: theme.spacing(2),
              fontWeight: "bold",
              textTransform: "none",
              boxShadow: theme.shadows[2],
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              `Join ${groupData.name}`
            )}
          </Button>

          <Button
            fullWidth
            variant="text"
            onClick={onClose}
            disabled={loading}
            sx={{ mt: 1, color: "text.secondary" }}
          >
            Maybe Later
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
