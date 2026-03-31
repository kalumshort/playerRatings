import React from "react";
import {
  Box,
  Typography,
  Stack,
  Avatar,
  ButtonBase,
  useTheme,
  Paper,
} from "@mui/material";
import { ChevronRight, Settings } from "lucide-react";

export default function GroupListItem({ group }) {
  return (
    <Paper style={{ padding: "20px 10px" }}>
      <ButtonBase
        key={group.groupId}
        onClick={() => {
          /* Navigate to Manage Group Page */
        }}
        sx={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",

          transition: "transform 0.2s ease-in-out",
          "&:hover": {
            transform: "translateY(-2px)",
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar
            src={
              group?.logo ||
              `https://media.api-sports.io/football/teams/${group.groupClubId}.png`
            }
            alt={group.name}
            sx={{
              width: 40,
              height: 40,
            }}
          />
          <Box sx={{ textAlign: "left" }}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, lineHeight: 1.2 }}
            >
              {group.name}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            color: "text.disabled",
          }}
        >
          <Settings size={18} />
          <ChevronRight size={20} />
        </Box>
      </ButtonBase>
    </Paper>
  );
}
