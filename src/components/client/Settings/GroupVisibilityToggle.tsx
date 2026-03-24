"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  CircularProgress,
  Stack,
  Alert,
} from "@mui/material";
import { Globe, Lock } from "lucide-react";
import { getFunctions, httpsCallable } from "firebase/functions";

interface GroupVisibilityToggleProps {
  groupId: string;
  initialVisibility: boolean; // Passed from the group doc
}

export default function GroupVisibilityToggle({
  groupId,
  initialVisibility,
}: GroupVisibilityToggleProps) {
  const [isPublic, setIsPublic] = useState(initialVisibility);
  const [loading, setLoading] = useState(false);

  const handleToggle = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.checked;
    setLoading(true);

    const functions = getFunctions();
    const updateVisibility = httpsCallable(functions, "updateGroupVisibility");

    try {
      await updateVisibility({ groupId, isPublic: newValue });
      setIsPublic(newValue);
    } catch (error) {
      console.error("Failed to update visibility", error);
      // Revert UI state on error
      setIsPublic(!newValue);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="caption"
        sx={{ color: "text.secondary", fontWeight: 700, ml: 0.5 }}
      >
        PRIVACY & ACCESS
      </Typography>

      <Box sx={{ p: 2, mt: 1, borderRadius: 2, bgcolor: "action.hover" }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={2} alignItems="center">
            {isPublic ? (
              <Globe size={20} color="#4caf50" />
            ) : (
              <Lock size={20} color="#f44336" />
            )}
            <Box>
              <Typography variant="body2" fontWeight={700}>
                {isPublic ? "Public Group" : "Private Group"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {isPublic
                  ? "Anyone can view matches and consensus. Only members chat."
                  : "Only members can see any group content."}
              </Typography>
            </Box>
          </Stack>

          {loading ? (
            <CircularProgress size={24} sx={{ m: 1 }} />
          ) : (
            <Switch
              checked={isPublic}
              onChange={handleToggle}
              color="primary"
            />
          )}
        </Stack>
      </Box>

      {isPublic && (
        <Alert severity="info" sx={{ mt: 1, borderRadius: 2, py: 0 }}>
          <Typography variant="caption">
            Public groups tend to grow 3x faster by allowing casual visitors.
          </Typography>
        </Alert>
      )}
    </Box>
  );
}
