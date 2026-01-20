import React, { useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Stack,
  Button,
  FormControl,
  Select,
  MenuItem,
  Tabs,
  Tab,
  SwipeableDrawer,
  Grid,
  Avatar,
  styled,
  useTheme,
} from "@mui/material";
import { CheckCircle, DeleteSweep, Add as AddIcon } from "@mui/icons-material";

// --- EXTERNAL HOOKS & SELECTORS ---
import { selectSquadDataObject } from "../../../../Selectors/squadDataSelectors";
import { selectUserMatchData } from "../../../../Selectors/userDataSelectors";
import { handlePredictTeamSubmit } from "../../../../Firebase/Firebase";
import { fetchMatchPredictions } from "../../../../Hooks/Fixtures_Hooks";
import useGroupData from "../../../../Hooks/useGroupsData";
import { useAuth } from "../../../../Providers/AuthContext";
import useGlobalData from "../../../../Hooks/useGlobalData";
import AuthModal from "../../../Auth/AuthModal";

// --- CONFIG & UTILS ---
import { FORMATIONS } from "./LineupPredictor";
import { AsyncButton } from "../../../Inputs/AsyncButton";

const PitchSurface = styled(Box)(({ theme }) => ({
  ...theme.clay.card,
  position: "relative",
  width: "100%",
  aspectRatio: "0.70",

  display: "flex",
  flexDirection: "column",
  justifyContent: "space-around",
  overflow: "hidden",
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

// 2. The White Lines: Semi-transparent overlay
const PitchMarking = styled(Box)({
  position: "absolute",
  borderColor: "rgba(255,255,255,0.6)",
  borderStyle: "solid",
  borderWidth: 2,
  pointerEvents: "none",
});

// 3. The Player Slot: Tactile, bouncy interactions
const PlayerSlot = styled(Box)(({ theme }) => ({
  width: 60,
  height: 60,
  cursor: "pointer",
  position: "relative",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "50%",
  transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)", // Spring physics

  // Default state (Empty): A small dent in the grass
  backgroundColor: "rgba(0,0,0,0.05)",
  boxShadow: "inset 2px 2px 5px rgba(0,0,0,0.1)",

  "&:hover": {
    transform: "scale(1.15)",
    backgroundColor: "rgba(255,255,255,0.3)",
  },

  // When active/filled, we handle styling via children,
  // but the container remains the touch target.
}));

const RemoveButton = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: -2,
  right: -2,
  width: 20,
  height: 20,
  borderRadius: "50%",
  backgroundColor: theme.palette.error.main,
  color: "#FFF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "12px",
  fontWeight: "bold",
  boxShadow: "0px 2px 4px rgba(0,0,0,0.2)",
  zIndex: 10,
  transition: "0.2s",
  "&:hover": { transform: "scale(1.2)" },
}));

// =============================================================================
//  MAIN COMPONENT
// =============================================================================

export default function SmartLineupPredictor({ fixture }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const globalData = useGlobalData();
  const { activeGroup } = useGroupData();
  const { clubSlug } = useParams();

  const [loading, setLoading] = useState(false);

  // --- REDUX SELECTORS ---
  const squadData = useSelector((state) =>
    selectSquadDataObject(state, clubSlug),
  );
  const usersMatchData = useSelector(selectUserMatchData(fixture.id));

  // --- LOCAL STATE ---
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [chosenTeam, setTeam] = useState(usersMatchData?.chosenTeam || {});
  const [formation, setFormation] = useState(
    usersMatchData?.formation || "4-3-3",
  );
  const [activeSlot, setActiveSlot] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("Goalkeeper");

  // --- HELPERS ---
  const getPositionBySlot = (slotId) => {
    if (slotId === 1) return "Goalkeeper";
    if ([2, 3, 4, 5].includes(slotId)) return "Defender";
    if ([6, 8, 7].includes(slotId)) return "Midfielder";
    return "Attacker";
  };

  const filteredSquad = useMemo(() => {
    return Object.entries(squadData).filter(
      ([id, p]) =>
        p.position === selectedTab && !Object.values(chosenTeam).includes(id),
    );
  }, [squadData, selectedTab, chosenTeam]);

  // --- HANDLERS ---
  const handleSlotClick = (slotId) => {
    setActiveSlot(slotId);
    setSelectedTab(getPositionBySlot(slotId));
    setIsDrawerOpen(true);
  };

  const handlePlayerPick = (playerId) => {
    setTeam((prev) => ({ ...prev, [activeSlot]: playerId }));
    setIsDrawerOpen(false);
    setActiveSlot(null);
  };

  const handleRemovePlayer = (slotId) => {
    setTeam((prev) => {
      const newTeam = { ...prev };
      delete newTeam[slotId];
      return newTeam;
    });
  };

  // --- SUBMIT LOGIC (Restored) ---
  const handleConfirm = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setLoading(true);
    // 1. Build the player object for storage
    const filteredPlayers = Object.keys(chosenTeam).reduce((res, key) => {
      if (squadData[chosenTeam[key]]) res[key] = squadData[chosenTeam[key]];
      return res;
    }, {});

    // 2. Submit to Firebase
    await handlePredictTeamSubmit({
      chosenTeam,
      formation,
      matchId: fixture.id,
      groupId: activeGroup.groupId,
      userId: user.uid,
      currentYear: globalData.currentYear,
      players: filteredPlayers,
    });

    // 3. Refresh Data
    dispatch(
      fetchMatchPredictions({
        matchId: fixture.id,
        groupId: activeGroup.groupId,
        currentYear: globalData.currentYear,
      }),
    );

    setLoading(false);
  };

  // ===========================================================================
  //  RENDER
  // ===========================================================================

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", p: 2 }}>
      <AuthModal
        open={showAuthModal}
        handleClose={() => setShowAuthModal(false)}
      />

      {/* HEADER: Formation & Clear */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <FormControl variant="standard" sx={{ minWidth: 140 }}>
          {/* Note: The global theme should handle the font weight and colors of Select */}
          <Select
            value={formation}
            onChange={(e) => setFormation(e.target.value)}
            displayEmpty
            sx={{
              fontWeight: 800,
              color: theme.palette.primary.dark,
              "&:before, &:after": { borderBottom: "none!important" }, // Clean look
            }}
          >
            {Object.keys(FORMATIONS).map((f) => (
              <MenuItem key={f} value={f}>
                {f}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          startIcon={<DeleteSweep />}
          onClick={() => setTeam({})}
          color="error"
          sx={{ fontWeight: 700 }}
        >
          Clear
        </Button>
      </Stack>

      {/* THE CLAY PITCH */}
      <PitchSurface>
        {/* -- Decorative Lines (Absolute Positioned) -- */}
        <PitchMarking
          sx={{
            top: "-10%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "40%",
            height: "25%",
            borderRadius: "50%",
          }}
        />
        <PitchMarking
          sx={{ top: 0, width: "100%", borderBottomWidth: 2, height: 0 }}
        />
        <PitchMarking
          sx={{
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "70%",
            height: "18%",
            borderBottom: "none",
          }}
        />
        <PitchMarking
          sx={{
            bottom: "12%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 4,
            height: 4,
            borderRadius: "50%",
            bgcolor: "rgba(255,255,255,0.8)",
            borderWidth: 0,
          }}
        />

        {/* -- Rows & Slots -- */}
        {(FORMATIONS[formation] || FORMATIONS["4-3-3"]).map((row) => (
          <Box
            key={row.rowId}
            sx={{
              display: "flex",
              justifyContent: "space-evenly",
              zIndex: 1,
              position: "relative",
            }}
          >
            {row.slots.map((slotId) => {
              const player = squadData[chosenTeam[slotId]];
              return (
                <PlayerSlot
                  key={slotId}
                  onClick={() => handleSlotClick(slotId)}
                >
                  {player ? (
                    <Box sx={{ position: "relative", textAlign: "center" }}>
                      <Avatar
                        src={player.photo}
                        sx={{
                          width: 60,
                          height: 60,
                          border: "2px solid #FFF",
                          boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          display: "block",
                          color: "#FFF",
                          fontWeight: 800,
                          textShadow: "0px 1px 3px rgba(0,0,0,0.6)",
                          fontSize: "0.65rem",
                          lineHeight: 1,
                          mt: 0.5,
                        }}
                      >
                        {player.name ? player.name.split(" ").pop() : "Player"}
                      </Typography>

                      <RemoveButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePlayer(slotId);
                        }}
                      >
                        ×
                      </RemoveButton>
                    </Box>
                  ) : (
                    <AddIcon
                      sx={{ color: "rgba(255,255,255,0.5)", fontSize: 28 }}
                    />
                  )}
                </PlayerSlot>
              );
            })}
          </Box>
        ))}
      </PitchSurface>

      {/* CONFIRM BUTTON */}
      <Box sx={{ mt: 4, textAlign: "center" }}>
        <AsyncButton
          variant="contained"
          size="large"
          disabled={Object.keys(chosenTeam).length !== 11}
          onClick={handleConfirm}
          startIcon={<CheckCircle />}
          loading={loading}
        >
          CONFIRM LINEUP
        </AsyncButton>
      </Box>

      {/* PLAYER SELECTION DRAWER (MODAL) */}
      <SwipeableDrawer
        anchor="bottom"
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onOpen={() => setIsDrawerOpen(true)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            maxHeight: "85vh",
          },
        }}
      >
        <Box sx={{ p: 3, pb: 6 }}>
          {/* Drawer Header */}

          {/* Position Tabs */}
          <Tabs
            value={selectedTab}
            onChange={(e, v) => setSelectedTab(v)}
            variant="fullWidth"
            sx={{
              mb: 3,
              "& .MuiTab-root": { fontWeight: 700 },
            }}
          >
            <Tab label="GK" value="Goalkeeper" />
            <Tab label="DEF" value="Defender" />
            <Tab label="MID" value="Midfielder" />
            <Tab label="FOR" value="Attacker" />
          </Tabs>

          {/* Player Grid */}
          <Box sx={{ overflowY: "auto" }}>
            <Grid container spacing={2}>
              {filteredSquad.map(([id, player]) => (
                <Grid item xs={4} sm={3} key={id}>
                  <Stack
                    onClick={() => handlePlayerPick(id)}
                    alignItems="center"
                    sx={{
                      cursor: "pointer",
                      p: 1.5,
                      borderRadius: 3,
                      transition: "0.2s",
                      "&:hover": {
                        bgcolor: "rgba(0,0,0,0.04)",
                        transform: "translateY(-2px)",
                      },
                    }}
                  >
                    <Avatar
                      src={player.photo}
                      sx={{ width: 60, height: 60, mb: 1, boxShadow: 2 }}
                    />
                    <Typography
                      variant="caption"
                      align="center"
                      sx={{ fontWeight: 700, lineHeight: 1.1 }}
                    >
                      {player.name}
                    </Typography>
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>
      </SwipeableDrawer>
    </Box>
  );
}
