"use client";

import { useState } from "react";
import { ButtonBase, Avatar, Box, Typography, Stack } from "@mui/material";
import { ChevronDown, Trophy } from "lucide-react";
import StadiumSwitcher from "./StadiumSwitcher";
import useGroupData from "@/Hooks/useGroupData";
import useUserData from "@/Hooks/useUserData";

export default function SwitcherTrigger() {
  const [open, setOpen] = useState(false);
  const { userData } = useUserData();
  const { groupData, userHomeGroup }: any = useGroupData();
  console.log(userHomeGroup);
  // Use the team's accent color or fallback to primary
  const teamColor = userHomeGroup?.accentColor || "#1976d2";

  return (
    <>
      <ButtonBase
        onClick={() => setOpen(true)}
        sx={{
          p: 1,
          pr: 2,
          borderRadius: "16px",
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          transition: "all 0.2s ease",
          "&:hover": {
            bgcolor: "action.hover",
            borderColor: teamColor,
            transform: "translateY(-1px)",
          },
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          width: "100%",
          justifyContent: "space-evenly",
        }}
      >
        {/* Team Avatar with Status indicator */}
        <Box sx={{ position: "relative" }}>
          <Avatar
            src={userHomeGroup?.logo?.replace(/"/g, "")}
            sx={{
              width: 38,
              height: 38,
              bgcolor: "white",
              p: 0.5,
              border: `2px solid ${teamColor}`,
            }}
          >
            <Trophy size={18} />
          </Avatar>

          {/* Small "switch" icon badge */}
          <Box
            sx={{
              position: "absolute",
              bottom: -2,
              right: -2,
              bgcolor: "primary.main",
              color: "white",
              borderRadius: "50%",
              width: 16,
              height: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid white",
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                bgcolor: "white",
                borderRadius: "50%",
              }}
            />
          </Box>
        </Box>

        {/* Text Info */}
        <Stack spacing={1} alignItems="flex-start" sx={{ textAlign: "left" }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 800,
              fontSize: "0.65rem",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              color: "text.secondary",
              lineHeight: 1,
            }}
          >
            Active Group
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 900, color: "text.primary" }}
            >
              {userHomeGroup?.name || "Select Team"}
            </Typography>
          </Box>
        </Stack>
        <ChevronDown size={14} color="#999" strokeWidth={3} />
      </ButtonBase>

      {/* Modal */}
      <StadiumSwitcher
        open={open}
        onClose={() => setOpen(false)}
        groups={groupData}
        userData={userData}
      />
    </>
  );
}
