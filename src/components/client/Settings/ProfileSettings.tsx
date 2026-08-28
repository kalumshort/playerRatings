"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  useMediaQuery,
  useTheme,
  Grid,
} from "@mui/material";
import { User, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// Components
import AccountTab from "./AccountTab";
import GroupsTab from "./GroupsTab";
import UpdateEmailModal from "@/components/client/Auth/UpdateEmailModal";
import UpdatePasswordModal from "@/components/client/Auth/UpdatePasswordModal";
import AddPasswordModal from "@/components/client/Auth/SocialAddPasswordModal";

export default function ProfileSettings() {
  const { user, userLoading } = useAuth();
  const theme = useTheme();

  // Use MUI Breakpoints to determine layout
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [activeTab, setActiveTab] = useState(0);

  // Modal States
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [changePwModalOpen, setChangePwModalOpen] = useState(false);
  const [addPwModalOpen, setAddPwModalOpen] = useState(false);

  if (userLoading) {
    return (
      <Box sx={{ textAlign: "center", py: theme.spacing(8) }}>
        <Typography color="text.secondary">
          Loading account settings...
        </Typography>
      </Box>
    );
  }

  if (!user) return null;

  // Desktop View: Split Screen 50/50
  if (isDesktop) {
    return (
      <Box
        sx={{
          width: "100%",
          maxWidth: "1200px",
          margin: "auto",
          p: theme.spacing(4),
        }}
      >
        <Grid container spacing={4}>
          <Grid size={{ xs: 6 }}>
            <Typography
              variant="h5"
              sx={{ mb: 3, fontWeight: 800, color: "text.primary" }}
            >
              Account Settings
            </Typography>
            <AccountTab
              onOpenEmail={() => setEmailModalOpen(true)}
              onOpenPassword={() => setChangePwModalOpen(true)}
              onOpenSocialAdd={() => setAddPwModalOpen(true)}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Typography
              variant="h5"
              sx={{ mb: 3, fontWeight: 800, color: "text.primary" }}
            >
              Your Groups
            </Typography>
            <GroupsTab />
          </Grid>
        </Grid>
        {/* Render Modals at Root */}
        <SettingsModals
          state={{ emailModalOpen, changePwModalOpen, addPwModalOpen }}
          handlers={{
            setEmailModalOpen,
            setChangePwModalOpen,
            setAddPwModalOpen,
          }}
        />
      </Box>
    );
  }

  // Mobile View: Original Tabbed Layout
  return (
    <Box sx={{ maxWidth: "600px", margin: "auto", p: theme.spacing(2) }}>
      <Tabs
        value={activeTab}
        onChange={(_, val) => setActiveTab(val)}
        sx={{
          mb: 3,
          "& .MuiTabs-indicator": {
            height: 3,
            borderRadius: theme.shape.borderRadius,
          },
        }}
      >
        <Tab
          icon={<User size={18} />}
          iconPosition="start"
          label="Account"
          sx={{ fontWeight: 700, minHeight: 48 }}
        />
        <Tab
          icon={<Users size={18} />}
          iconPosition="start"
          label="Groups"
          sx={{ fontWeight: 700, minHeight: 48 }}
        />
      </Tabs>

      {activeTab === 0 ? (
        <AccountTab
          onOpenEmail={() => setEmailModalOpen(true)}
          onOpenPassword={() => setChangePwModalOpen(true)}
          onOpenSocialAdd={() => setAddPwModalOpen(true)}
        />
      ) : (
        <GroupsTab />
      )}

      <SettingsModals
        state={{ emailModalOpen, changePwModalOpen, addPwModalOpen }}
        handlers={{
          setEmailModalOpen,
          setChangePwModalOpen,
          setAddPwModalOpen,
        }}
      />
    </Box>
  );
}

/**
 * Extracted Modals to keep the main component clean
 */
function SettingsModals({ state, handlers }: any) {
  return (
    <>
      <UpdateEmailModal
        open={state.emailModalOpen}
        onClose={() => handlers.setEmailModalOpen(false)}
      />
      <UpdatePasswordModal
        open={state.changePwModalOpen}
        onClose={() => handlers.setChangePwModalOpen(false)}
      />
      <AddPasswordModal
        open={state.addPwModalOpen}
        onClose={() => handlers.setAddPwModalOpen(false)}
      />
    </>
  );
}
