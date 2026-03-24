"use client";

import React, { useState, useMemo } from "react";
import useGroupData from "@/Hooks/useGroupData";
import {
  Box,
  Typography,
  Stack,
  IconButton,
  useTheme,
  Fade,
} from "@mui/material";
import { ArrowLeft } from "lucide-react";
import GroupListItem from "./groupListItem";
import GroupViewer from "./GroupViewer";
import useUserData from "@/Hooks/useUserData";
// Import your new component (we will define the shell below)

export default function GroupsTab() {
  const { groupData } = useGroupData();
  const { userData } = useUserData();

  // Local state to manage the drill-down view
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Memoize the owned groups list to prevent filter runs on every state change
  const ownedGroups = useMemo(() => {
    return Object.values(groupData).filter(
      (group: any) => group.role === "owner",
    );
  }, [groupData]);

  // Find the actual group object for the viewer
  const selectedGroup = useMemo(() => {
    return selectedGroupId ? groupData[selectedGroupId] : null;
  }, [selectedGroupId, groupData]);

  // --- VIEW 1: Group Detail (Viewer) ---
  if (selectedGroup) {
    return (
      <Fade in={true} timeout={300}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 1 }}>
            <IconButton
              onClick={() => setSelectedGroupId(null)}
              sx={{ color: "text.primary" }}
            >
              <ArrowLeft size={20} />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {selectedGroup.name}
            </Typography>
          </Box>

          <GroupViewer group={selectedGroup} />
        </Box>
      </Fade>
    );
  }

  // --- VIEW 2: Group List (Default) ---
  return (
    <Box sx={{ mt: 2 }}>
      <Typography
        variant="caption"
        sx={{
          color: "text.secondary",
          ml: 1,
          fontWeight: 800,
          letterSpacing: "0.05rem",
          textTransform: "uppercase",
        }}
      >
        Group Management
      </Typography>

      <Stack spacing={1.5} sx={{ mt: 1.5 }}>
        {ownedGroups.length > 0 ? (
          ownedGroups.map((group: any) => (
            <Box
              key={group.groupId}
              onClick={() => setSelectedGroupId(group.groupId)}
              sx={{ cursor: "pointer" }}
            >
              <GroupListItem group={group} />
            </Box>
          ))
        ) : (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              You don't manage any groups yet.
            </Typography>
          </Box>
        )}
      </Stack>
    </Box>
  );
}
