import React, { useState } from "react";
import {
  Box,
  Typography,
  useTheme as useMuiTheme,
  Dialog,
  DialogContent,
  TextField,
  InputAdornment,
  Avatar,
  IconButton,
} from "@mui/material";
import {
  Globe,
  Lock,
  Plus,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useDispatch } from "react-redux";

// Hooks & Firebase
import useGroupData from "../../Hooks/useGroupsData";
import {
  updateUserField,
  handleAddUserToGroup,
} from "../../Firebase/Auth_Functions";
import useUserData from "../../Hooks/useUserData";

// Redux Actions
import { clearTeamSquads } from "../../redux/Reducers/teamSquads";
import { clearRatings } from "../../redux/Reducers/playerRatingsReducer";
import { clearFixtures } from "../../redux/Reducers/fixturesReducer";
import { teamList } from "../../Hooks/Helper_Functions";

/**
 * DrawerGroupSelector
 * A Paginated selection UI for the Header Drawer.
 * Optimized for Web/Desktop navigation.
 */
const DrawerGroupSelector = () => {
  const muiTheme = useMuiTheme();
  const dispatch = useDispatch();

  // userHomeGroup represents the active selection in 11Votes context
  const { groupData, userHomeGroup } = useGroupData();
  const { userData } = useUserData();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelectChange = async (groupId) => {
    if (!userData?.uid) return;

    // 1. Update the 'activeGroup' in Firestore
    await updateUserField(userData.uid, "activeGroup", groupId);

    // 2. Clear state to prevent data bleed between clubs
    dispatch(clearTeamSquads());
    dispatch(clearRatings());
    dispatch(clearFixtures());

    // Note: App.js NavigationSync will handle the URL redirect automatically
  };

  // Logic: Transform object to array and sort userHomeGroup (Active) to index 0
  const groupsArray = groupData ? Object.values(groupData) : [];
  const sortedGroups = [...groupsArray].sort((a, b) => {
    if (a.groupId === userHomeGroup?.groupId) return -1;
    if (b.groupId === userHomeGroup?.groupId) return 1;
    return 0;
  });

  const privateGroups = sortedGroups.filter((g) => g.visibility === "private");
  const publicGroups = sortedGroups.filter((g) => g.visibility === "public");

  return (
    <Box sx={{ width: "100%", py: 1 }}>
      <PaginatedGroupSection
        title="Private Groups"
        icon={Lock}
        groups={privateGroups}
        onSelect={handleSelectChange}
        activeGroupId={userHomeGroup?.groupId}
        muiTheme={muiTheme}
      />

      <PaginatedGroupSection
        title="Followed Clubs"
        icon={Globe}
        groups={publicGroups}
        showAdd={true}
        onSelect={handleSelectChange}
        onAddClick={() => setIsModalOpen(true)}
        activeGroupId={userHomeGroup?.groupId}
        muiTheme={muiTheme}
      />

      <TeamSelectionModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userData={userData}
      />
    </Box>
  );
};

/**
 * PaginatedGroupSection Component
 * Renders exactly 2 items per "page" using a Grid layout.
 */
const PaginatedGroupSection = ({
  title,
  icon: Icon,
  groups,
  showAdd,
  onSelect,
  activeGroupId,
  onAddClick,
  muiTheme,
}) => {
  const [startIndex, setStartIndex] = useState(0);

  // Combine groups with the "Add" card if applicable
  const items = [...groups];
  if (showAdd) items.push({ isAction: true });

  const handleNext = () => {
    if (startIndex + 2 < items.length) setStartIndex((prev) => prev + 2);
  };

  const handlePrev = () => {
    if (startIndex > 0) setStartIndex((prev) => prev - 2);
  };

  if (items.length === 0) return null;

  return (
    <Box sx={{ mb: 4, px: 2 }}>
      {/* Header with Navigation Controls */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Icon size={14} color={muiTheme.palette.text.secondary} />
          <Typography
            variant="caption"
            sx={{
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: 1.5,
              color: "text.secondary",
              fontSize: "0.65rem",
            }}
          >
            {title}
          </Typography>
        </Box>

        {items.length > 2 && (
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <IconButton
              onClick={handlePrev}
              disabled={startIndex === 0}
              size="small"
              sx={{ border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <ChevronLeft size={16} />
            </IconButton>
            <IconButton
              onClick={handleNext}
              disabled={startIndex + 2 >= items.length}
              size="small"
              sx={{ border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <ChevronRight size={16} />
            </IconButton>
          </Box>
        )}
      </Box>

      {/* 2-Column Grid */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
        {items.slice(startIndex, startIndex + 2).map((item) => {
          if (item.isAction) {
            return (
              <Box
                key="add-action"
                onClick={onAddClick}
                sx={getActionCardStyle(muiTheme)}
              >
                <Plus
                  size={24}
                  style={{
                    color: muiTheme.palette.text.secondary,
                    marginBottom: "4px",
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    color: "text.secondary",
                    fontSize: "0.6rem",
                    textTransform: "uppercase",
                  }}
                >
                  Add Team
                </Typography>
              </Box>
            );
          }

          const isActive = activeGroupId === item.groupId;
          const color = item.accentColor || muiTheme.palette.primary.main;
          const cleanLogo = (item.logo || item.imageURL)?.replace(/"/g, "");

          return (
            <Box
              key={item.groupId}
              onClick={() => onSelect(item.groupId)}
              sx={getSquareStyle(color, isActive, muiTheme)}
            >
              {/* Ghost Logo Background */}
              <Box
                component="img"
                src={cleanLogo}
                sx={{
                  position: "absolute",
                  height: "110%",
                  opacity: 0.2,
                  filter: "grayscale(100%) ",
                  pointerEvents: "none",
                  zIndex: 0,
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  zIndex: 1,
                  fontWeight: 800,
                  px: 1,
                  textAlign: "center",
                }}
              >
                {item.name}
              </Typography>

              {isActive && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    bgcolor: color,
                    boxShadow: `0 0 10px ${color}`,
                  }}
                />
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

/**
 * TeamSelectionModal Component
 */
const TeamSelectionModal = ({ open, onClose, userData }) => {
  const [search, setSearch] = useState("");

  const filteredTeams = teamList.filter((team) =>
    team.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleJoin = async (group) => {
    // teamList uses teamId as the primary identifier
    await handleAddUserToGroup({ userData, groupId: group.teamId });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          backdropFilter: "blur(20px)",
        },
      }}
    >
      <Box
        sx={{
          p: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" sx={{ fontFamily: "'VT323', monospace" }}>
          FIND YOUR TEAM
        </Typography>
        <IconButton onClick={onClose} size="small">
          <X size={20} />
        </IconButton>
      </Box>
      <DialogContent sx={{ pt: 0 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search Club..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={18} />
              </InputAdornment>
            ),
          }}
        />
        <Box sx={{ maxHeight: "400px", overflowY: "auto" }}>
          {filteredTeams.map((team) => (
            <Box
              key={team.teamId}
              onClick={() => handleJoin(team)}
              sx={{
                display: "flex",
                alignItems: "center",
                p: 1.5,
                mb: 1,
                borderRadius: 2,
                cursor: "pointer",
                "&:hover": { background: "rgba(255,255,255,0.1)" },
              }}
            >
              <Avatar
                src={team.logo?.replace(/"/g, "")}
                sx={{ width: 40, height: 40, mr: 2 }}
              />
              <Typography sx={{ fontWeight: 700 }}>{team.name}</Typography>
            </Box>
          ))}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

// Component Styles
const getSquareStyle = (accentColor, isActive, theme) => ({
  height: 110,
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "16px",
  overflow: "hidden",
  cursor: "pointer",
  border: "1px solid",
  borderColor: isActive ? accentColor : "rgba(255,255,255,0.1)",
  backgroundColor: `${accentColor}${isActive ? "30" : "20"}`,
  backdropFilter: "blur(10px)",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  "&:hover": {
    borderColor: accentColor,
    backgroundColor: `${accentColor}40`,
  },
});

const getActionCardStyle = (theme) => ({
  height: 110,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "16px",
  border: "2px dashed rgba(255,255,255,0.2)",
  cursor: "pointer",
  transition: "all 0.2s ease",
  "&:hover": {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: theme.palette.primary.main,
    "& svg": { transform: "rotate(90deg)" },
  },
  "& svg": { transition: "transform 0.3s ease" },
});

export default DrawerGroupSelector;
