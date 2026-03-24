"use client";

import React from "react";
import { Box, Typography, Paper, Divider } from "@mui/material";
import GroupInviteGenerator from "./GroupInviteGenerator";
import GroupVisibilityToggle from "./GroupVisibilityToggle";
import GroupPrivacySettings from "./GroupPrivacySettings";
import { GroupDataListener } from "../Listeners/GroupDataListener";

interface GroupViewerProps {
  group: any;
}

export default function GroupViewer({ group }: GroupViewerProps) {
  return (
    <Box>
      <GroupDataListener groupId={group.groupId} />
      <Paper sx={{ p: 3 }}>
        <Typography
          variant="subtitle2"
          color="text.secondary"
          gutterBottom
          sx={{ fontWeight: 700 }}
        >
          Management Console for {group.name}
        </Typography>

        {/* Feature 1: Invite Generation */}
        <GroupInviteGenerator groupId={group.groupId} />

        <Divider sx={{ my: 3 }} />

        <GroupPrivacySettings group={group} />

        {/* Future Management Controls */}
        <Box sx={{ py: 2, textAlign: "center" }}>
          <Typography variant="body2" color="text.disabled">
            Member Lists and Club Stats coming soon...
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
