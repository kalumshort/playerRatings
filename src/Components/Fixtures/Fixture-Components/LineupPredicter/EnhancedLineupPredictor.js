import React, { useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box,
  Typography,
  Stack,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  useTheme,
  SwipeableDrawer,
  IconButton,
  Grid,
} from "@mui/material";
import {
  CheckCircle,
  DeleteSweep,
  PersonOff,
  Close,
} from "@mui/icons-material";

// --- SELECTORS & FIREBASE FUNCTIONS ---
import { selectSquadDataObject } from "../../../../Selectors/squadDataSelectors";
import { selectUserMatchData } from "../../../../Selectors/userDataSelectors";
import { handlePredictTeamSubmit } from "../../../../Firebase/Firebase";
import { fetchMatchPredictions } from "../../../../Hooks/Fixtures_Hooks";
import useGroupData from "../../../../Hooks/useGroupsData";
import { useAuth } from "../../../../Providers/AuthContext";
import useGlobalData from "../../../../Hooks/useGlobalData";
import { FORMATIONS } from "./LineupPredictor";
import LineupPlayer from "../LineupPlayer";
import { useParams } from "react-router-dom";
import AuthModal from "../../../Auth/AuthModal";

// --- CONSTANTS (From your files) ---

// --- SUB-COMPONENT: PITCH DECORATION ---
const PitchLines = () => (
  <Box
    sx={{
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      opacity: 0.15,
    }}
  >
    <Box
      sx={{
        position: "absolute",
        top: "-10%",
        left: "50%",
        transform: "translateX(-50%)",
        width: "40%",
        height: "25%",
        border: "2px solid white",
        borderRadius: "50%",
      }}
    />
    <Box
      sx={{
        position: "absolute",
        top: 0,
        width: "100%",
        height: "2px",
        bgcolor: "white",
      }}
    />
    <Box
      sx={{
        position: "absolute",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "70%",
        height: "18%",
        border: "2px solid white",
        borderBottom: "none",
      }}
    />
    <Box
      sx={{
        position: "absolute",
        bottom: "12%",
        left: "50%",
        transform: "translateX(-50%)",
        width: 4,
        height: 4,
        bgcolor: "white",
        borderRadius: "50%",
      }}
    />
  </Box>
);

export default function SmartLineupPredictor({ fixture }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const globalData = useGlobalData();
  const { activeGroup } = useGroupData();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const { clubSlug } = useParams(); // e.g., "man-united"
  const squadData = useSelector((state) =>
    selectSquadDataObject(state, clubSlug)
  );
  const usersMatchData = useSelector(selectUserMatchData(fixture.id));

  // --- STATE ---
  const [chosenTeam, setTeam] = useState(usersMatchData?.chosenTeam || {});
  const [formation, setFormation] = useState(
    usersMatchData?.formation || "4-3-3"
  );
  const [activeSlot, setActiveSlot] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("Goalkeeper");

  // --- LOGIC ---
  const getPositionBySlot = (slotId) => {
    if (slotId === 1) return "Goalkeeper";
    if ([2, 3, 4, 5].includes(slotId)) return "Defender";
    if ([6, 8, 7].includes(slotId)) return "Midfielder";
    return "Attacker";
  };

  const handleSlotClick = (slotId) => {
    setActiveSlot(slotId);
    setSelectedTab(getPositionBySlot(slotId));
    setIsDrawerOpen(true); // Open the "Modal" pop up
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

  const filteredSquad = useMemo(() => {
    return Object.entries(squadData).filter(
      ([id, p]) =>
        p.position === selectedTab && !Object.values(chosenTeam).includes(id)
    );
  }, [squadData, selectedTab, chosenTeam]);

  const handleConfirm = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    const filteredPlayers = Object.keys(chosenTeam).reduce((res, key) => {
      if (squadData[chosenTeam[key]]) res[key] = squadData[chosenTeam[key]];
      return res;
    }, {});

    await handlePredictTeamSubmit({
      chosenTeam,
      formation,
      matchId: fixture.id,
      groupId: activeGroup.groupId,
      userId: user.uid,
      currentYear: globalData.currentYear,
      players: filteredPlayers,
    });

    dispatch(
      fetchMatchPredictions({
        matchId: fixture.id,
        groupId: activeGroup.groupId,
        currentYear: globalData.currentYear,
      })
    );
  };

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", p: 2 }}>
      <AuthModal
        open={showAuthModal}
        handleClose={() => setShowAuthModal(false)}
      />
      {/* HEADER CONTROLS */}
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
        <FormControl variant="standard" sx={{ minWidth: 140 }}>
          <InputLabel sx={{ fontSize: "0.7rem" }}>TACTIC</InputLabel>
          <Select
            value={formation}
            onChange={(e) => setFormation(e.target.value)}
            sx={{
              color: theme.palette.primary.main,
              fontSize: "1.2rem",
              fontWeight: "bold",
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
        >
          Clear
        </Button>
      </Stack>

      {/* THE PITCH */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          aspectRatio: "0.85",
          bgcolor: "background.paper",
          borderRadius: 4,
          overflow: "hidden",
          border: `1px solid ${theme.palette.divider}`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-around",
          boxShadow: theme.shadows[10],
        }}
      >
        <PitchLines />
        {(FORMATIONS[formation] || FORMATIONS["4-3-3"]).map((row) => (
          <Box
            key={row.rowId}
            sx={{ display: "flex", justifyContent: "space-evenly", zIndex: 1 }}
          >
            {row.slots.map((slotId) => {
              const player = squadData[chosenTeam[slotId]];
              return (
                <Box
                  key={slotId}
                  onClick={() => handleSlotClick(slotId)}
                  sx={{
                    width: 60,
                    height: 60,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "0.2s",
                    "&:hover": {
                      transform: "scale(1.1)",
                    },
                  }}
                >
                  {player ? (
                    <Box sx={{ position: "relative" }}>
                      <LineupPlayer
                        player={player}
                        showPlayerName={true}
                        // Optional: Disable drag props here since it's a static view
                        draggable={false}
                      />

                      <Box
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePlayer(slotId);
                        }}
                        sx={{
                          position: "absolute",
                          top: -5,
                          right: -5,
                          bgcolor: "error.main",
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                          color: "white",
                        }}
                      >
                        ×
                      </Box>
                    </Box>
                  ) : (
                    <PersonOff sx={{ opacity: 0.2 }} />
                  )}
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>

      {/* CONFIRM BUTTON */}
      <Box sx={{ mt: 4, textAlign: "center" }}>
        <Button
          variant="contained"
          size="large"
          disabled={Object.keys(chosenTeam).length !== 11}
          onClick={handleConfirm}
          startIcon={<CheckCircle />}
          sx={{ borderRadius: 8, px: 6, py: 1.5 }}
        >
          CONFIRM LINEUP
        </Button>
      </Box>

      {/* PLAYER SELECTION MODAL (DRAWER) */}
      <SwipeableDrawer
        anchor="bottom"
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onOpen={() => setIsDrawerOpen(true)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: "70vh",
            background:
              theme.palette.mode === "dark"
                ? "linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(10,10,10,1) 100%)"
                : "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,240,240,1) 100%)",
            backdropFilter: "blur(20px)",
            p: 3,
          },
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <Typography variant="h6">
            SELECT {getPositionBySlot(activeSlot).toUpperCase()}
          </Typography>
          <IconButton onClick={() => setIsDrawerOpen(false)}>
            <Close />
          </IconButton>
        </Stack>

        <Tabs
          value={selectedTab}
          onChange={(e, v) => setSelectedTab(v)}
          variant="fullWidth"
          sx={{ mb: 3 }}
        >
          <Tab label="GK" value="Goalkeeper" />
          <Tab label="DEF" value="Defender" />
          <Tab label="MID" value="Midfielder" />
          <Tab label="FOR" value="Attacker" />
        </Tabs>

        <Box sx={{ overflowY: "auto", pb: 4 }}>
          <Grid container spacing={2}>
            {filteredSquad.map(([id, player]) => (
              <Grid item xs={4} sm={3} key={id}>
                <Box
                  onClick={() => handlePlayerPick(id)}
                  sx={{
                    p: 1.5,
                    textAlign: "center",
                    cursor: "pointer",
                    borderRadius: 4,
                    transition: "0.2s",
                    border: "1px solid transparent",
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.1)",
                      borderColor: theme.palette.primary.main,
                    },
                  }}
                >
                  <img
                    src={player.photo}
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: "50%",
                      marginBottom: 8,
                    }}
                    alt=""
                  />
                  <Typography
                    variant="caption"
                    display="block"
                    sx={{ fontWeight: "bold", lineHeight: 1.2 }}
                  >
                    {player.name}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </SwipeableDrawer>
    </Box>
  );
}
