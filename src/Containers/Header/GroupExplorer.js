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
import { Globe, Lock, Plus, Search, X } from "lucide-react";
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

const DrawerGroupSelector = () => {
  const muiTheme = useMuiTheme();
  const dispatch = useDispatch();
  const { groupData, userHomeGroup } = useGroupData();
  const { userData } = useUserData();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelectChange = async (groupId) => {
    if (!userData?.uid) return;
    await updateUserField(userData.uid, "activeGroup", groupId);
    dispatch(clearTeamSquads());
    dispatch(clearRatings());
    dispatch(clearFixtures());
  };

  const groupsArray = groupData ? Object.values(groupData) : [];
  const privateGroups = groupsArray.filter((g) => g.visibility === "private");
  const publicGroups = groupsArray.filter((g) => g.visibility === "public");

  const squareItemStyle = (accentColor, isHome, isAction = false) => ({
    flex: "0 0 auto",
    width: 110,
    height: 110,
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    borderRadius: 3,
    overflow: "hidden",
    cursor: "pointer",
    border: isAction ? "2px dashed" : "1px solid",
    borderColor: isHome
      ? accentColor || muiTheme.palette.primary.main
      : isAction
      ? "rgba(255,255,255,0.2)"
      : "rgba(255,255,255,0.1)",
    backgroundColor: isAction
      ? "transparent"
      : `${accentColor || muiTheme.palette.primary.main}15`,
    backdropFilter: "blur(10px)",
    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
    "&:hover": {
      borderColor: accentColor || muiTheme.palette.primary.main,
      backgroundColor: isAction
        ? "rgba(255,255,255,0.05)"
        : `${accentColor || muiTheme.palette.primary.main}25`,
    },
  });

  return (
    <Box sx={{ width: "100%", py: 1 }}>
      <GroupSection
        title="Private Groups"
        icon={Lock}
        groups={privateGroups}
        onSelect={handleSelectChange}
        userHomeGroup={userHomeGroup}
        muiTheme={muiTheme}
        squareItemStyle={squareItemStyle}
      />
      <GroupSection
        title="Followed Clubs"
        icon={Globe}
        groups={publicGroups}
        showAdd={true}
        onSelect={handleSelectChange}
        onAddClick={() => setIsModalOpen(true)}
        userHomeGroup={userHomeGroup}
        muiTheme={muiTheme}
        squareItemStyle={squareItemStyle}
      />

      {/* The Search Modal */}
      <TeamSelectionModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userData={userData}
      />
    </Box>
  );
};

/**
 * TeamSelectionModal Component
 * Searchable list of all teams to join.
 */
const TeamSelectionModal = ({ open, onClose, userData }) => {
  const [search, setSearch] = useState("");

  // This would typically come from a global Redux state or a hook
  // For now, I'm assuming you have a list of available public groups

  const filteredTeams = teamList.filter((team) =>
    team.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleJoin = async (group) => {
    await handleAddUserToGroup({ userData, groupId: group.teamId });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
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

        <Box sx={{ maxHeight: "400px", overflowY: "auto", pr: 1 }}>
          {filteredTeams.map((team) => (
            <Box
              key={team.groupId}
              onClick={() => handleJoin(team)}
              sx={{
                display: "flex",
                alignItems: "center",
                p: 1.5,
                mb: 1,
                cursor: "pointer",
                transition: "0.2s",
                "&:hover": { background: "rgba(255,255,255,0.05)" },
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

// Reusable Section Component inside DrawerGroupSelector
const GroupSection = ({
  title,
  icon: Icon,
  groups,
  showAdd,
  onSelect,
  onAddClick,
  userHomeGroup,
  muiTheme,
  squareItemStyle,
}) => (
  <Box sx={{ mb: 4 }}>
    <Box sx={{ display: "flex", alignItems: "center", px: 2, gap: 1, mb: 1 }}>
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

    <Box
      sx={{
        display: "flex",
        overflowX: "auto",
        gap: 2,
        pb: 2,
        px: 2,
        mt: 1,
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": { display: "none" },
      }}
    >
      {groups.map((group) => {
        const isHome = userHomeGroup?.groupId === group.groupId;
        const color = group.accentColor || muiTheme.palette.primary.main;
        const cleanLogo = (group.logo || group.imageURL)?.replace(/"/g, "");

        return (
          <Box
            key={group.groupId}
            sx={squareItemStyle(group.accentColor, isHome)}
            onClick={() => onSelect(group.groupId)}
          >
            <Box
              component="img"
              src={cleanLogo}
              sx={{
                position: "absolute",
                width: "120%",
                height: "auto",
                opacity: 0.12,
                filter: "grayscale(100%) brightness(150%)",
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
                lineHeight: 1.1,
                color: "text.primary",
                fontFamily: muiTheme.typography.fontFamily,
              }}
            >
              {group.name}
            </Typography>
            {isHome && (
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

      {showAdd && (
        <Box sx={squareItemStyle(null, false, true)} onClick={onAddClick}>
          <Plus
            size={24}
            style={{
              color: muiTheme.palette.text.secondary,
              marginBottom: "8px",
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
            Add New
            <br />
            Team
          </Typography>
        </Box>
      )}
    </Box>
  </Box>
);

export default DrawerGroupSelector;
