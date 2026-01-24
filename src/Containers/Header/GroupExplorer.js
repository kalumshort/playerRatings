import React, { useState } from "react";
import {
  Box,
  Typography,
  useTheme,
  Avatar,
  Tooltip,
  Zoom,
  Dialog,
  DialogContent,
  TextField,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Globe, Lock, Plus, Search, X } from "lucide-react";

// Hooks & Firebase
import useGroupData from "../../Hooks/useGroupsData";
import useUserData from "../../Hooks/useUserData";
import {
  updateUserField,
  handleAddUserToGroup,
} from "../../Firebase/Auth_Functions";
import { teamList } from "../../Hooks/Helper_Functions";

/**
 * GroupExplorer
 * Combined Group Switcher & Team Search Modal
 * Architecture: Clean, Tactile, and Global Theme-compliant.
 */
const GroupExplorer = ({ setDrawerOpen }) => {
  const { groupData, userHomeGroup } = useGroupData();
  const { userData } = useUserData();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelectChange = async (groupId) => {
    if (!userData?.uid) return;
    await updateUserField(userData.uid, "activeGroup", groupId);
    setDrawerOpen(false);
  };

  const groupsArray = groupData ? Object.values(groupData) : [];
  const sortedGroups = [...groupsArray].sort((a, b) =>
    a.groupId === userHomeGroup?.groupId ? -1 : 1,
  );

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 3,
        mt: 2,
      }}
    >
      {/* 1. PRIVATE GROUPS TRAY */}
      <GroupTray
        title="Private Groups"
        icon={<Lock size={14} />}
        groups={sortedGroups.filter((g) => g.visibility === "private")}
        activeId={userHomeGroup?.groupId}
        onSelect={handleSelectChange}
      />

      {/* 2. FOLLOWED CLUBS TRAY */}
      <GroupTray
        title="Followed Clubs"
        icon={<Globe size={14} />}
        groups={sortedGroups.filter((g) => g.visibility === "public")}
        activeId={userHomeGroup?.groupId}
        onSelect={handleSelectChange}
        showAdd
        onAdd={() => setIsModalOpen(true)}
      />

      {/* 3. INTEGRATED TEAM SELECTION MODAL */}
      <TeamSelectionModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userData={userData}
        setDrawerOpen={setDrawerOpen}
      />
    </Box>
  );
};

/**
 * GroupTray: The horizontal scrollable "Carved" track
 */
const GroupTray = ({
  title,
  icon,
  groups,
  activeId,
  onSelect,
  showAdd,
  onAdd,
}) => {
  const theme = useTheme();
  if (groups.length === 0 && !showAdd) return null;

  return (
    <Box sx={{ px: 1 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: 1.5,
          opacity: 0.8,
        }}
      >
        {icon}
        <Typography
          variant="caption"
          sx={{
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: 1.2,
            color: "text.secondary",
            fontSize: "0.65rem",
          }}
        >
          {title}
        </Typography>
      </Box>

      <Box
        sx={{
          ...theme.clay.box,
          p: 1.5,
          display: "flex",
          gap: 2,
          overflowX: "auto",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
          maskImage: "linear-gradient(to right, black 85%, transparent 100%)",
        }}
      >
        {groups.map((group) => {
          const isActive = group.groupId === activeId;
          return (
            <Tooltip
              title={group.name}
              key={group.groupId}
              TransitionComponent={Zoom}
              arrow
            >
              <Box
                onClick={() => onSelect(group.groupId)}
                sx={{
                  minWidth: 70,
                  height: 70,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  borderRadius: "20px",
                  transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  backgroundColor: "background.paper",
                  ...(isActive
                    ? {
                        boxShadow:
                          "inset 4px 4px 10px rgba(0,0,0,0.1), inset -4px -4px 10px #ffffff",
                        bgcolor: "rgba(0,0,0,0.02)",
                        transform: "scale(0.92)",
                      }
                    : {
                        boxShadow:
                          theme.palette.mode === "light"
                            ? "6px 6px 12px #d1d9e6, -4px -4px 10px #ffffff"
                            : "6px 6px 12px #1b1e28, -4px -4px 10px #2b303b",
                        "&:hover": { transform: "translateY(-4px)" },
                      }),
                }}
              >
                <Avatar
                  src={(group.logo || group.imageURL)?.replace(/"/g, "")}
                  imgProps={{ style: { objectFit: "contain" } }}
                  sx={{
                    width: 44,
                    height: 44,
                    filter: isActive ? "none" : "grayscale(0.3)",
                    opacity: isActive ? 1 : 0.8,
                    borderRadius: "0px",
                  }}
                />
              </Box>
            </Tooltip>
          );
        })}

        {showAdd && (
          <Box
            onClick={onAdd}
            sx={{
              minWidth: 70,
              height: 70,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "20px",
              border: "2px dashed",
              borderColor: "divider",
              color: "text.secondary",
              cursor: "pointer",
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: "background.paper",
                borderColor: "primary.main",
                color: "primary.main",
                transform: "scale(1.05)",
              },
            }}
          >
            <Plus size={24} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

/**
 * TeamSelectionModal: The Search & Join UI
 */
const TeamSelectionModal = ({ open, onClose, userData, setDrawerOpen }) => {
  const theme = useTheme();
  const [search, setSearch] = useState("");

  const filteredTeams = teamList.filter((team) =>
    team.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleJoin = async (group) => {
    await handleAddUserToGroup({ userData, groupId: group.teamId });
    onClose();
    setDrawerOpen(false);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: "32px",
          bgcolor: "background.default",
          backgroundImage: "none",
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
        <Typography variant="h6" sx={{ fontWeight: 900 }}>
          FIND YOUR TEAM
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ bgcolor: "background.paper" }}
        >
          <X size={18} />
        </IconButton>
      </Box>

      <DialogContent sx={{ pt: 0 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search Club..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            mb: 3,
            "& .MuiOutlinedInput-root": {
              borderRadius: "20px",
              bgcolor: "background.paper",
              boxShadow: "inset 2px 2px 5px rgba(0,0,0,0.05)",
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={18} />
              </InputAdornment>
            ),
          }}
        />

        <Box
          sx={{
            maxHeight: "400px",
            overflowY: "auto",
            pr: 1,
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
          }}
        >
          {filteredTeams.map((team) => (
            <Box
              key={team.teamId}
              onClick={() => handleJoin(team)}
              sx={{
                display: "flex",
                alignItems: "center",
                p: 1.5,
                borderRadius: "20px",
                cursor: "pointer",
                bgcolor: "background.paper",
                boxShadow:
                  theme.palette.mode === "light"
                    ? "4px 4px 8px #d1d9e6"
                    : "4px 4px 8px #1b1e28",
                transition: "transform 0.2s",
                "&:hover": { transform: "scale(1.02)" },
              }}
            >
              <Avatar
                src={team.logo?.replace(/"/g, "")}
                imgProps={{ style: { objectFit: "contain" } }}
                sx={{ width: 40, height: 40, mr: 2, borderRadius: "0px" }}
              />
              <Typography sx={{ fontWeight: 700 }}>{team.name}</Typography>
            </Box>
          ))}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default GroupExplorer;
