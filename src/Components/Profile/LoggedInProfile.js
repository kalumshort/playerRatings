import React, { useState, useEffect } from "react";
import {
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Stack,
  styled,
  useTheme as useMuiTheme,
  Divider,
  Switch,
} from "@mui/material";
import {
  User,
  Save,
  Hash,
  PlusCircle,
  Layout,
  Sun,
  Moon,
  Palette,
} from "lucide-react";
import { useDispatch } from "react-redux";

// Logic & Context Imports
import { updateUserField } from "../../Firebase/Auth_Functions";
import useUserData from "../../Hooks/useUserData";
import useGroupData from "../../Hooks/useGroupsData";
import { useTheme } from "../../Components/Theme/ThemeContext"; // Import your custom theme hook
import { clearTeamSquads } from "../../redux/Reducers/teamSquads";
import { clearRatings } from "../../redux/Reducers/playerRatingsReducer";
import { clearFixtures } from "../../redux/Reducers/fixturesReducer";

// Component Imports

import CustomSelect from "../Inputs/CustomSelect";
import Logout from "../Auth/Logout";

// --- Styled Components ---
const ProfileHeader = styled(Box)(({ theme }) => ({
  background:
    theme.palette.mode === "dark"
      ? "rgba(255, 255, 255, 0.03)"
      : "rgba(0, 0, 0, 0.02)",
  padding: theme.spacing(4, 2),
  borderRadius: "24px",
  border: `1px solid ${theme.palette.divider}`,
  marginBottom: theme.spacing(3),
  backdropFilter: "blur(10px)",
}));

const GlassSection = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: "24px",
}));

const InputLabel = styled(Typography)(({ theme }) => ({
  fontSize: "0.75rem",
  fontWeight: 700,
  textTransform: "uppercase",
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(1),
  display: "flex",
  alignItems: "center",
  gap: "8px",
}));

export default function LoggedInProfile() {
  const dispatch = useDispatch();
  const muiTheme = useMuiTheme();
  const { themeMode, toggleTheme } = useTheme(); // Access the global theme toggle

  const { userData } = useUserData();
  const { groupData, activeGroup } = useGroupData();
  const accentColor = activeGroup?.accentColor || muiTheme.palette.primary.main;

  const [formData, setFormData] = useState({
    displayName: userData?.displayName || "",
  });

  const [groupCodeInput] = useState("");
  const [changedFields, setChangedFields] = useState({ displayName: false });

  useEffect(() => {
    if (userData) {
      setChangedFields({
        displayName: formData.displayName !== userData.displayName,
      });
    }
  }, [formData, userData]);

  const handleFieldChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleUpdate = async () => {
    if (!changedFields.displayName) return;
    await updateUserField(userData.uid, "displayName", formData.displayName);
  };

  const handleSelectChange = async (event) => {
    const newGroupId = event.target.value;
    await updateUserField(userData.uid, "activeGroup", newGroupId);
    dispatch(clearTeamSquads());
    dispatch(clearRatings());
    dispatch(clearFixtures());
  };

  if (!userData) return null;

  const options = Object.values(groupData || {}).map((group) => ({
    label: group.name,
    value: group.groupId,
    imageURL: group.imageURL,
  }));

  return (
    <Box sx={{ maxWidth: "600px", margin: "auto", px: 2, py: 4 }}>
      {/* 1. Identity Header */}
      <ProfileHeader>
        <Stack alignItems="center" spacing={2}>
          {/* <UploadAvatar userData={userData} /> */}
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h4" sx={{ fontFamily: "'VT323', monospace" }}>
              {userData.displayName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {userData.email}
            </Typography>
          </Box>
          <Box
            sx={{
              px: 2,
              py: 0.5,
              borderRadius: "20px",
              backgroundColor: `${accentColor}20`,
              border: `1px solid ${accentColor}`,
              color: accentColor,
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            {activeGroup?.name || "Free Agent"}
          </Box>
        </Stack>
      </ProfileHeader>

      {/* 3. Personal Settings Section */}
      <GlassSection>
        <Stack spacing={3}>
          <Box>
            <InputLabel>
              <User size={14} /> Display Name
            </InputLabel>
            <TextField
              fullWidth
              value={formData.displayName}
              onChange={handleFieldChange("displayName")}
              variant="outlined"
              size="small"
              placeholder="Enter your name"
            />
          </Box>

          <Button
            fullWidth
            variant="contained"
            startIcon={<Save size={18} />}
            onClick={handleUpdate}
            disabled={!changedFields.displayName}
            sx={{ borderRadius: "12px", py: 1.2 }}
          >
            Save Account Changes
          </Button>
        </Stack>
      </GlassSection>

      {/* 4. Club Ecosystem Section */}
      <GlassSection>
        <Stack spacing={4}>
          <Box>
            <InputLabel>
              <Layout size={14} /> Active Club View
            </InputLabel>
            <CustomSelect
              options={options}
              value={activeGroup?.groupId}
              onChange={handleSelectChange}
            />
          </Box>

          <Divider sx={{ opacity: 0.1 }} />

          <Box>
            <InputLabel sx={{ color: muiTheme.palette.text.disabled }}>
              <Hash size={14} /> Private Group Access
            </InputLabel>
            <Stack direction="row" spacing={1}>
              <TextField
                fullWidth
                value={groupCodeInput}
                placeholder="Enter Invite Code"
                variant="outlined"
                size="small"
                disabled
              />
              <Button variant="outlined" disabled sx={{ borderRadius: "8px" }}>
                Join
              </Button>
            </Stack>
          </Box>

          <Box sx={{ opacity: 0.6 }}>
            <InputLabel sx={{ color: muiTheme.palette.text.disabled }}>
              <PlusCircle size={14} /> Community Creation
            </InputLabel>
            <Button
              fullWidth
              variant="outlined"
              disabled
              sx={{ borderStyle: "dashed" }}
            >
              Create Your Own Group (Coming Soon)
            </Button>
          </Box>
        </Stack>
      </GlassSection>

      {/* 2. Visual Experience Section (NEW) */}
      <GlassSection>
        <Stack spacing={2}>
          <Box>
            <InputLabel>
              <Palette size={14} /> Visual Experience
            </InputLabel>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor:
                  muiTheme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.03)"
                    : "rgba(0,0,0,0.03)",
                p: 2,
                borderRadius: "16px",
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                {themeMode === "dark" ? (
                  <Moon size={20} color={accentColor} />
                ) : (
                  <Sun size={20} color={accentColor} />
                )}
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {themeMode === "dark" ? "Dark Mode" : "Light Mode"}
                </Typography>
              </Stack>
              <Switch
                checked={themeMode === "dark"}
                onChange={toggleTheme}
                color="primary"
              />
            </Box>
          </Box>
        </Stack>
      </GlassSection>

      {/* 5. Logout Action */}
      <Box sx={{ mt: 2, textAlign: "center" }}>
        <Logout />
      </Box>
    </Box>
  );
}
