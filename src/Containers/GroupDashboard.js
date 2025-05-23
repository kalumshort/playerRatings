import React, { useState, useEffect, useRef } from "react";
import useUserData from "../Hooks/useUserData";
import useGroupData from "../Hooks/useGroupsData";
import {
  Box,
  Button,
  Paper,
  TextField,
  IconButton,
  Popper,
  Typography,
} from "@mui/material";
import { SettingRow } from "./Header";
import { updateGroupField } from "../Firebase/Auth_Functions";
import { ColorPicker } from "./Helpers";
import {
  fetchInviteLink,
  firebaseAddDoc,
  firebaseDeleteDoc,
} from "../Firebase/Firebase";
import { generateCustomId } from "../Hooks/Helper_Functions";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAlert } from "../Components/HelpfulComponents";

export default function GroupDashboard() {
  const { userData } = useUserData();
  const { activeGroup } = useGroupData();
  const [inviteLinkDoc, setInviteLink] = useState(null);

  const [formData, setFormData] = useState({
    name: activeGroup.name,
    slug: activeGroup.slug,
    accentColor: activeGroup.accentColor,
  });
  const [changedFields, setChangedFields] = useState({
    name: false,
    slug: false,
    accentColor: false,
  });
  const [openDeletePopper, setOpenDeletePopper] = useState(false);
  const anchorRef = useRef(null);
  const showAlert = useAlert();

  // Fetch invite link when activeGroup changes
  useEffect(() => {
    const fetchInviteLinkForGroup = async () => {
      const inviteDoc = await fetchInviteLink(activeGroup);
      if (inviteDoc) {
        setInviteLink(inviteDoc);
      }
    };
    if (activeGroup) {
      fetchInviteLinkForGroup();
    }
  }, [activeGroup]);

  // Reset form data and changed fields on activeGroup change
  useEffect(() => {
    setFormData({
      name: activeGroup.name,
      slug: activeGroup.slug,
      accentColor: activeGroup.accentColor,
    });
    setChangedFields({
      name: false,
      slug: false,
      accentColor: false,
    });
  }, [activeGroup]);

  const handleFieldChange = (field) => (e) => {
    const value = e.target.value;
    setFormData((prevData) => ({ ...prevData, [field]: value }));
    setChangedFields((prevChangedFields) => ({
      ...prevChangedFields,
      [field]: value !== activeGroup[field],
    }));
  };

  const handleUpdateGroupDetails = async () => {
    const updatedFields = [];
    for (let field in formData) {
      if (formData[field] !== activeGroup[field]) {
        await updateGroupField(activeGroup.id, field, formData[field]);
        updatedFields.push(field);
      }
    }
    if (updatedFields.length > 0) {
      console.log("Updated fields:", updatedFields);
    }
  };

  const isButtonDisabled = Object.values(changedFields).every(
    (changed) => !changed
  );

  const handleCreateGroupInviteLink = async () => {
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
      setOpenDeletePopper(false);
      showAlert("Group invite link created successfully.");
    } catch (error) {
      showAlert(`Failed to create invite link: ${error.message}`);
    }
  };

  const handleCopyInviteLink = async () => {
    if (inviteLinkDoc?.inviteLink) {
      try {
        await navigator.clipboard.writeText(inviteLinkDoc.inviteLink);
        showAlert("Group Invite Link Copied.");
      } catch (error) {
        console.error("Error copying link:", error);
      }
    }
  };

  const handleToggleDeletePopper = () => {
    setOpenDeletePopper((prev) => !prev);
  };

  const handleCancelDelete = () => {
    setOpenDeletePopper(false);
  };

  const handleDeleteInviteLink = async () => {
    const result = await firebaseDeleteDoc({
      path: "groupInviteLinks",
      id: inviteLinkDoc.id,
    });
    if (result.success) {
      setInviteLink(null);
      showAlert("Invite link successfully deleted.");
    } else {
      showAlert(`Failed to delete invite link: ${result.message}`);
    }
  };

  return (
    <>
      <Paper
        style={{ marginTop: "30px", padding: "10px" }}
        className="containerMargin"
      >
        <SettingRow
          style={{ borderBottom: "1px solid grey", paddingBottom: "10px" }}
        >
          <h5 style={{ padding: "0px", margin: "5px 0px", color: "grey" }}>
            Settings
          </h5>
        </SettingRow>
        <SettingRow>
          <Box>Group Link</Box>
          {inviteLinkDoc?.inviteLink ? (
            <Box style={{ display: "flex", gap: "20px" }}>
              <Button onClick={handleCopyInviteLink} variant="contained">
                Copy Link
              </Button>
              <IconButton
                color="primary"
                aria-label="delete invite link"
                ref={anchorRef}
                onClick={handleToggleDeletePopper}
              >
                <DeleteIcon />
              </IconButton>
              <Popper
                open={openDeletePopper}
                anchorEl={anchorRef.current}
                placement="bottom-start"
                sx={{ zIndex: 1300 }}
              >
                <Paper elevation={3} sx={{ padding: 2 }}>
                  <Typography variant="body1" gutterBottom>
                    Confirm Group Link Delete?
                  </Typography>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Button
                      onClick={handleDeleteInviteLink}
                      color="white"
                      variant="outlined"
                    >
                      Yes
                    </Button>
                    <Button
                      onClick={handleCancelDelete}
                      color="white"
                      variant="outlined"
                    >
                      No
                    </Button>
                  </Box>
                </Paper>
              </Popper>
            </Box>
          ) : (
            <Button onClick={handleCreateGroupInviteLink} variant="contained">
              Create Link
            </Button>
          )}
        </SettingRow>
      </Paper>

      <Paper
        style={{ marginTop: "30px", padding: "10px" }}
        className="containerMargin"
      >
        <SettingRow
          style={{ borderBottom: "1px solid grey", paddingBottom: "10px" }}
        >
          <h5 style={{ padding: "0px", margin: "5px 0px", color: "grey" }}>
            Customisation
          </h5>
        </SettingRow>
        <SettingRow>
          <Box>Group Name</Box>
          <TextField
            value={formData.name}
            onChange={handleFieldChange("name")}
            variant="outlined"
            size="small"
            sx={{ marginLeft: "10px", width: "150px" }}
          />
        </SettingRow>
        <SettingRow>
          <Box>Accent Colour</Box>
          <ColorPicker
            value={formData.accentColor}
            onChange={(newColor) =>
              handleFieldChange("accentColor")({ target: { value: newColor } })
            }
          />
        </SettingRow>
        <SettingRow
          sx={{ display: "flex", justifyContent: "flex-end", marginTop: 2 }}
        >
          <Button
            variant="contained"
            color="primary"
            onClick={handleUpdateGroupDetails}
            disabled={isButtonDisabled}
          >
            Update
          </Button>
        </SettingRow>
      </Paper>
    </>
  );
}
