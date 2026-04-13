"use client";

import React, { useState } from "react";
import { Box, Typography, Button, styled, alpha, Stack } from "@mui/material";
import AuthDialog from "../Auth/AuthDialog";
import JoinGroupDialog from "../Groups/JoinGroupDialog";

const BannerContainer = styled(Box)(({ theme }) => ({
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderTop: `1px solid ${theme.palette.divider}`,
  boxShadow: `0px -4px 10px ${alpha(theme.palette.common.black, 0.1)}`,
  zIndex: 1000,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  textAlign: "center",
  backdropFilter: "blur(8px)",
}));

interface GuestClubBannerProps {
  groupData: {
    id: string;
    name: string;
    isGroupOpen: boolean;
    groupType: "club" | "group";
  };
  isGuestView: boolean;
  userId?: string | null;
}

export default function GuestClubBanner({
  groupData,
  isGuestView,
  userId,
}: GuestClubBannerProps) {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  if (!isGuestView) return null;

  const handleBackToClub = () => {
    window.location.href = "/";
  };

  const handleJoinClick = () => {
    setIsAuthOpen(true);
  };

  return (
    <>
      <BannerContainer>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Viewing <strong>{groupData.name}</strong> as a guest.
        </Typography>

        <Stack direction="row" spacing={1}>
          {userId ? (
            <>
              <Button
                size="small"
                onClick={handleBackToClub}
                variant="outlined"
                sx={{ borderRadius: 2 }}
              >
                Back to My Club
              </Button>
              {groupData.isGroupOpen && (
                <Button
                  size="small"
                  onClick={() => setIsJoinOpen(true)} // Opens membership dialog
                  variant="contained" // Switched to contained for primary action
                  sx={{ borderRadius: 2 }}
                >
                  Join Group
                </Button>
              )}
            </>
          ) : (
            (groupData.isGroupOpen || groupData.groupType === "club") && (
              <Button
                size="small"
                onClick={handleJoinClick} // Opens auth dialog
                variant="contained"
                disableElevation
                sx={{ borderRadius: 2 }}
              >
                {groupData.groupType === "club" ? "Join Club" : "Join Group"}
              </Button>
            )
          )}
        </Stack>
      </BannerContainer>

      {/* Auth Dialog for Logged Out */}
      {!userId && (
        <AuthDialog
          open={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          group={{
            id: groupData.id,
            name: groupData.name,
          }}
        />
      )}

      {/* Join Dialog for Logged In */}
      {userId && (
        <JoinGroupDialog
          open={isJoinOpen}
          onClose={() => setIsJoinOpen(false)}
          groupData={{
            id: groupData.id,
            name: groupData.name,
            groupType: groupData.groupType,
          }}
          userData={{ uid: userId }}
        />
      )}
    </>
  );
}
