import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  Paper,
  TextField,
  IconButton,
  Popper,
  Typography,
  Divider,
  Stack,
  Fade,
  Tooltip,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  ContentCopy as CopyIcon,
  Group as GroupIcon,
  Info as InfoIcon,
} from "@mui/icons-material";

// Hooks & Firebase
import useUserData from "../Hooks/useUserData";
import useGroupData from "../Hooks/useGroupsData";
import { updateGroupField } from "../Firebase/Auth_Functions";
import {
  fetchInviteLink,
  firebaseAddDoc,
  firebaseDeleteDoc,
} from "../Firebase/Firebase";
import { generateCustomId } from "../Hooks/Helper_Functions";
import { ColorPicker } from "./Helpers";
import { useAlert } from "../Components/HelpfulComponents";

/**
 * SUB-COMPONENT: SettingSection
 * Provides a consistent glassified container for dashboard sections
 */
const SettingSection = ({ title, children, action }) => (
  <Paper
    sx={{
      mt: 3,
      p: 3,
      position: "relative",
      overflow: "visible", // Needed for Popper
    }}
  >
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      mb={2}
    >
      <Typography
        variant="h6"
        sx={{ color: "text.secondary", fontSize: "0.9rem", letterSpacing: 1 }}
      >
        {title}
      </Typography>
      {action}
    </Stack>
    <Divider sx={{ mb: 2, opacity: 0.5 }} />
    <Stack spacing={2.5}>{children}</Stack>
  </Paper>
);

/**
 * SUB-COMPONENT: SettingRow
 * Standardizes the layout for individual settings
 */
const DashboardRow = ({ label, value, icon: Icon }) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      minHeight: "40px",
    }}
  >
    <Stack direction="row" spacing={1.5} alignItems="center">
      {Icon && <Icon sx={{ fontSize: 18, color: "primary.main" }} />}
      <Typography variant="body1" sx={{ fontWeight: 500 }}>
        {label}
      </Typography>
    </Stack>
    <Box sx={{ color: "text.secondary" }}>{value}</Box>
  </Box>
);

export default function GroupDashboard() {
  const { userData } = useUserData();
  const { activeGroup } = useGroupData();
  const [inviteLinkDoc, setInviteLink] = useState(null);
  const [loadingInvite, setLoadingInvite] = useState(false);

  const [formData, setFormData] = useState({
    name: activeGroup?.name || "",
    slug: activeGroup?.slug || "",
    accentColor: activeGroup?.accentColor || "#00FF87",
  });

  const [changedFields, setChangedFields] = useState({
    name: false,
    slug: false,
    accentColor: false,
  });

  const [openDeletePopper, setOpenDeletePopper] = useState(false);
  const anchorRef = useRef(null);
  const showAlert = useAlert();

  useEffect(() => {
    const fetchInviteLinkForGroup = async () => {
      const inviteDoc = await fetchInviteLink(activeGroup);
      if (inviteDoc) setInviteLink(inviteDoc);
    };
    if (activeGroup?.id) fetchInviteLinkForGroup();
  }, [activeGroup]);

  useEffect(() => {
    if (activeGroup) {
      setFormData({
        name: activeGroup.name,
        slug: activeGroup.slug,
        accentColor: activeGroup.accentColor,
      });
      setChangedFields({ name: false, slug: false, accentColor: false });
    }
  }, [activeGroup]);

  const handleFieldChange = (field) => (e) => {
    const value = e.target?.value ?? e; // Handle both event and direct value (colorpicker)
    setFormData((prev) => ({ ...prev, [field]: value }));
    setChangedFields((prev) => ({
      ...prev,
      [field]: value !== activeGroup[field],
    }));
  };

  const handleUpdateGroupDetails = async () => {
    let updated = false;
    for (let field in formData) {
      if (changedFields[field]) {
        await updateGroupField(activeGroup.id, field, formData[field]);
        updated = true;
      }
    }
    if (updated) showAlert("Group configuration updated.");
  };

  const handleCreateGroupInviteLink = async () => {
    setLoadingInvite(true);
    const customId = generateCustomId(activeGroup.name);
    try {
      const docData = await firebaseAddDoc({
        path: "groupInviteLinks",
        data: {
          groupId: activeGroup.id,
          groupName: activeGroup.name,
          inviteCreatedAt: new Date(),
          createdByEmail: userData.email,
          createdById: userData.uid,
          inviteStatus: "active",
          inviteLink: `https://11votes.com/groups/${customId}`,
        },
        id: customId,
      });
      setInviteLink(docData);
      showAlert("Invite link generated!");
    } catch (error) {
      showAlert(`Error: ${error.message}`);
    } finally {
      setLoadingInvite(false);
    }
  };

  const handleCopyInviteLink = async () => {
    if (inviteLinkDoc?.inviteLink) {
      await navigator.clipboard.writeText(inviteLinkDoc.inviteLink);
      showAlert("Link copied to clipboard");
    }
  };

  const handleDeleteInviteLink = async () => {
    const result = await firebaseDeleteDoc({
      path: "groupInviteLinks",
      id: inviteLinkDoc.id,
    });
    if (result.success) {
      setInviteLink(null);
      setOpenDeletePopper(false);
      showAlert("Invite link revoked.");
    }
  };

  if (!activeGroup) return null;

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", py: 4, px: 2 }}>
      {/* Header Card */}
      <Paper sx={{ p: 4, textAlign: "center", mb: 4 }}>
        <Typography variant="h4" color="primary">
          {activeGroup.name}
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.6 }}>
          Admin Dashboard
        </Typography>
      </Paper>

      {/* 1. Subscription Plan */}
      <SettingSection title="Management" icon={InfoIcon}>
        <DashboardRow
          label="Current Plan"
          value="Club Pro"
          icon={SettingsIcon}
        />
        <DashboardRow label="Billing Status" value="Active" />
      </SettingSection>

      {/* 2. Recruitment (Invite Links) */}
      <SettingSection title="Recruitment">
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="body1">Fan Access Link</Typography>
          {inviteLinkDoc ? (
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="contained"
                startIcon={<CopyIcon />}
                onClick={handleCopyInviteLink}
              >
                Copy
              </Button>
              <IconButton
                color="error"
                ref={anchorRef}
                onClick={() => setOpenDeletePopper(true)}
                sx={{ border: "1px solid rgba(255,0,0,0.2)" }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Stack>
          ) : (
            <Button
              variant="outlined"
              onClick={handleCreateGroupInviteLink}
              disabled={loadingInvite}
            >
              {loadingInvite ? "Generating..." : "Generate Invite Link"}
            </Button>
          )}
        </Box>
      </SettingSection>

      {/* 3. Customization */}
      <SettingSection
        title="Identity"
        action={
          <Button
            variant="contained"
            onClick={handleUpdateGroupDetails}
            disabled={!Object.values(changedFields).some(Boolean)}
          >
            Save Changes
          </Button>
        }
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography>Display Name</Typography>
          <TextField
            value={formData.name}
            onChange={handleFieldChange("name")}
            size="small"
            sx={{ width: 200 }}
          />
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography>Consensus Color</Typography>
            <Tooltip title="This color theme will be seen by all fans in this group">
              <InfoIcon sx={{ fontSize: 16, opacity: 0.5 }} />
            </Tooltip>
          </Stack>
          <ColorPicker
            value={formData.accentColor}
            onChange={(color) => handleFieldChange("accentColor")(color)}
          />
        </Box>
      </SettingSection>

      {/* 4. Statistics */}
      <SettingSection title="Audience">
        <DashboardRow
          label="Total Members"
          value="Unlimited"
          icon={GroupIcon}
        />
        <DashboardRow label="Verified Fans" value="na" />
      </SettingSection>

      {/* Revoke Confirmation Popper */}
      <Popper
        open={openDeletePopper}
        anchorEl={anchorRef.current}
        transition
        placement="top-end"
        sx={{ zIndex: 2000 }}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={350}>
            <Paper
              sx={{
                p: 2,
                mt: 1,
                maxWidth: 250,
                border: "1px solid rgba(255,255,255,0.2)",
                boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
              }}
            >
              <Typography variant="body2" sx={{ mb: 2 }}>
                Revoking this link will prevent new fans from joining. Continue?
              </Typography>
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button size="small" onClick={() => setOpenDeletePopper(false)}>
                  Cancel
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  onClick={handleDeleteInviteLink}
                >
                  Confirm
                </Button>
              </Stack>
            </Paper>
          </Fade>
        )}
      </Popper>
    </Box>
  );
}
