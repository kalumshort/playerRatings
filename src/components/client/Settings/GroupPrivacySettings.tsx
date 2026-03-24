"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  useTheme,
  CircularProgress,
} from "@mui/material";
import { Globe, Lock, ShieldCheck } from "lucide-react";
import { getFunctions, httpsCallable } from "firebase/functions";

export default function GroupPrivacySettings({ group }: { group: any }) {
  const theme = useTheme();
  const [loading, setLoading] = useState<string | null>(null);

  // Logic: Map the existing boolean flags from Firestore to our 3 modes
  const currentMode = group.isPublic
    ? group.isGroupOpen
      ? "public"
      : "restricted"
    : "private";

  const updateMode = async (mode: "public" | "restricted" | "private") => {
    setLoading(mode);

    const functions = getFunctions();
    const updatePrivacy = httpsCallable(functions, "updateGroupPrivacy");

    try {
      // We now call the backend function instead of updateDoc
      await updatePrivacy({
        groupId: group.groupId || group.id,
        mode,
      });
    } catch (error) {
      console.error("Cloud Function: Mode update failed", error);
    } finally {
      setLoading(null);
    }
  };

  const modes = [
    {
      id: "public",
      title: "Public",
      desc: "Visible to all. Anyone can join instantly.",
      icon: <Globe size={20} />,
      color: theme.palette.success.main,
    },
    {
      id: "restricted",
      title: "Restricted",
      desc: "Visible to all. Joining requires an invite code.",
      icon: <ShieldCheck size={20} />,
      color: theme.palette.warning.main,
    },
    {
      id: "private",
      title: "Private",
      desc: "Hidden from search. Only invited members can enter.",
      icon: <Lock size={20} />,
      color: theme.palette.error.main,
    },
  ];

  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="caption"
        sx={{
          color: "text.secondary",
          fontWeight: 800,
          ml: 1,
          letterSpacing: 1,
          textTransform: "uppercase",
        }}
      >
        Privacy Strategy
      </Typography>

      <Stack spacing={1.5} sx={{ mt: 1 }}>
        {modes.map((mode) => {
          const isActive = currentMode === mode.id;
          const isProcessing = loading === mode.id;

          return (
            <Paper
              key={mode.id}
              onClick={() =>
                !isActive && !loading && updateMode(mode.id as any)
              }
              sx={{
                p: 2,
                cursor: isActive || loading ? "default" : "pointer",
                borderRadius: theme.shape.borderRadius,
                border: `2px solid ${isActive ? mode.color : "transparent"}`,
                bgcolor: isActive ? "background.paper" : "action.hover",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                position: "relative",
                opacity: loading && !isProcessing ? 0.6 : 1,
                "&:hover": {
                  transform: isActive || loading ? "none" : "translateY(-2px)",
                  boxShadow:
                    isActive || loading ? theme.shadows[1] : theme.shadows[4],
                },
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    color: isActive ? mode.color : "text.disabled",
                    display: "flex",
                    p: 1,
                    bgcolor: isActive ? `${mode.color}15` : "transparent",
                    borderRadius: "50%",
                  }}
                >
                  {isProcessing ? (
                    <CircularProgress size={20} color="inherit" thickness={5} />
                  ) : (
                    mode.icon
                  )}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    {mode.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {mode.desc}
                  </Typography>
                </Box>
                {isActive && !isProcessing && (
                  <Typography
                    variant="caption"
                    sx={{ color: mode.color, fontWeight: 900 }}
                  >
                    ACTIVE
                  </Typography>
                )}
              </Stack>
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );
}
