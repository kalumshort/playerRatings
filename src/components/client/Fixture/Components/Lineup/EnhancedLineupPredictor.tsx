"use client";

import React, { useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams } from "next/navigation";
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
  alpha,
  Fade,
} from "@mui/material";
import { CheckCircle, DeleteSweep, Add as AddIcon } from "@mui/icons-material";

// --- CLEAN IMPORTS ---

import { useAuth } from "@/context/AuthContext";
import { RootState } from "@/lib/redux/store";
import { FORMATIONS } from "./LineupPredictor";
import { AsyncButton } from "@/components/ui/AsyncButton";
import { handlePredictTeamSubmit } from "@/lib/firebase/client-actions";
import { selectActiveSquadMapped } from "@/lib/redux/selectors/squadSelectors";

// --- STYLED COMPONENTS ---

const PitchSurface = styled(Box)(({ theme }: any) => ({
  ...theme.clay?.card,
  position: "relative",
  width: "100%",
  aspectRatio: "0.72",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-around",
  overflow: "hidden",
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  background: `linear-gradient(180deg, ${theme.palette.success.dark} 0%, ${theme.palette.success.main} 100%)`,
}));

const PitchMarking = styled(Box)({
  position: "absolute",
  borderColor: "rgba(255,255,255,0.4)",
  borderStyle: "solid",
  borderWidth: 2,
  pointerEvents: "none",
});

const PlayerSlot = styled(Box)(({ theme }) => ({
  width: 62,
  height: 62,
  cursor: "pointer",
  position: "relative",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "50%",
  transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
  backgroundColor: "rgba(0,0,0,0.15)",
  boxShadow: "inset 2px 2px 5px rgba(0,0,0,0.2)",
  "&:hover": {
    transform: "scale(1.1)",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
}));

const RemoveButton = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: -2,
  right: -2,
  width: 22,
  height: 22,
  borderRadius: "50%",
  backgroundColor: theme.palette.error.main,
  color: "#FFF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "14px",
  fontWeight: "bold",
  boxShadow: "0px 2px 4px rgba(0,0,0,0.3)",
  zIndex: 10,
}));

// --- COMPONENT ---

interface PredictorProps {
  fixture: any;
  groupId: string;
  currentYear: string;
  groupData: any;
}

export default function EnhancedLineupPredictor({
  fixture,
  groupId,
  currentYear,
  groupData,
}: PredictorProps) {
  const { user } = useAuth();

  const matchId = String(fixture.id);

  const [loading, setLoading] = useState(false);

  // 1. SELECTORS

  const squadData = useSelector((state: RootState) =>
    selectActiveSquadMapped(state, groupData.groupClubId, currentYear),
  );

  const usersMatchData = useSelector(
    (state: RootState) => state.userData?.matches?.[matchId],
  );

  // 2. LOCAL STATE
  const [chosenTeam, setTeam] = useState<Record<string, string>>(
    usersMatchData?.chosenTeam || {},
  );
  const [formation, setFormation] = useState(
    usersMatchData?.formation || "4-3-3 Holding",
  );
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("Goalkeeper");

  // 3. LOGIC HELPERS
  const getPositionBySlot = (slotId: number) => {
    if (slotId === 1) return "Goalkeeper";
    if ([2, 3, 4, 5, 7].includes(slotId)) return "Defender"; // Flexible based on formationConfig
    if ([6, 8, 10].includes(slotId)) return "Midfielder";
    return "Attacker";
  };

  const filteredSquad = useMemo(() => {
    return Object.entries(squadData).filter(
      ([id, p]: [string, any]) =>
        p.position === selectedTab && !Object.values(chosenTeam).includes(id),
    );
  }, [squadData, selectedTab, chosenTeam]);

  // 4. HANDLERS
  const handleSlotClick = (slotId: number) => {
    setActiveSlot(slotId);
    setSelectedTab(getPositionBySlot(slotId));
    setIsDrawerOpen(true);
  };

  const handlePlayerPick = (playerId: string) => {
    if (activeSlot) {
      setTeam((prev) => ({ ...prev, [activeSlot]: playerId }));
      setIsDrawerOpen(false);
      setActiveSlot(null);
    }
  };

  const handleConfirm = async () => {
    if (!user || !groupId) return;
    setLoading(true);

    try {
      await handlePredictTeamSubmit({
        chosenTeam,
        formation,
        matchId,
        groupId,
        userId: user.uid,
        currentYear,
      });
      // Logic for refreshing predictions is handled by the real-time listener
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 500, mx: "auto", p: 1 }}>
      {/* HEADER */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <Select
            value={formation}
            onChange={(e) => setFormation(e.target.value)}
            sx={{
              fontWeight: 900,
              borderRadius: "12px",
              bgcolor: "background.paper",
            }}
          >
            {Object.keys(FORMATIONS).map((f) => (
              <MenuItem key={f} value={f} sx={{ fontWeight: 700 }}>
                {f}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          startIcon={<DeleteSweep />}
          onClick={() => setTeam({})}
          color="error"
          sx={{ fontWeight: 800 }}
        >
          Clear
        </Button>
      </Stack>

      {/* PITCH */}
      <PitchSurface>
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

        {(FORMATIONS[formation] || FORMATIONS["4-3-3 Holding"]).map((row) => (
          <Box
            key={row.rowId}
            sx={{ display: "flex", justifyContent: "space-evenly", zIndex: 1 }}
          >
            {row.slots.map((slotId) => {
              const playerId = chosenTeam[slotId];
              const player = squadData[playerId];

              return player ? (
                <Box
                  key={slotId}
                  sx={{ position: "relative", textAlign: "center" }}
                >
                  <Avatar
                    src={player.photo}
                    sx={{
                      width: 56,
                      height: 56,
                      border: "2px solid #FFF",
                      boxShadow: 3,
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      color: "#FFF",
                      fontWeight: 900,
                      fontSize: "0.6rem",
                      mt: 0.5,
                    }}
                  >
                    {player.name.split(" ").pop()}
                  </Typography>
                  <RemoveButton
                    onClick={(e) => {
                      e.stopPropagation();
                      setTeam((prev) => {
                        const n = { ...prev };
                        delete n[slotId];
                        return n;
                      });
                    }}
                  >
                    ×
                  </RemoveButton>
                </Box>
              ) : (
                <PlayerSlot
                  key={slotId}
                  onClick={() => handleSlotClick(slotId)}
                >
                  <AddIcon
                    sx={{ color: "rgba(255,255,255,0.4)", fontSize: 24 }}
                  />
                </PlayerSlot>
              );
            })}
          </Box>
        ))}
      </PitchSurface>

      {/* ACTION */}
      <Box sx={{ mt: 3, textAlign: "center" }}>
        <AsyncButton
          variant="contained"
          fullWidth
          disabled={Object.keys(chosenTeam).length < 11}
          onClick={handleConfirm}
          loading={loading}
        >
          LOCK IN {Object.keys(chosenTeam).length}/11 PLAYERS
        </AsyncButton>
      </Box>

      {/* DRAWER */}
      <SwipeableDrawer
        anchor="bottom"
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onOpen={() => setIsDrawerOpen(true)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: "80vh",
            // Add smooth height transition to the drawer itself
            transition: "height 0.3s ease-in-out",
          },
        }}
      >
        <Box sx={{ p: 2, display: "flex", flexDirection: "column" }}>
          <Tabs
            value={selectedTab}
            onChange={(_, v) => setSelectedTab(v)}
            variant="fullWidth"
            sx={{
              mb: 2,
              // Optional: indicator transition
              "& .MuiTabs-indicator": { transition: "all 0.2s ease-in-out" },
            }}
          >
            <Tab label="GK" value="Goalkeeper" sx={{ fontWeight: 900 }} />
            <Tab label="DEF" value="Defender" sx={{ fontWeight: 900 }} />
            <Tab label="MID" value="Midfielder" sx={{ fontWeight: 900 }} />
            <Tab label="FWD" value="Attacker" sx={{ fontWeight: 900 }} />
          </Tabs>

          {/* The Wrapper that handles the height transition */}
          <Box
            sx={{
              position: "relative",
              minHeight: 200, // Keeps the drawer from snapping shut if filter is empty
              transition: "all 0.3s ease-in-out",
            }}
          >
            <Grid container spacing={1}>
              {filteredSquad.map(([id, player]: [string, any]) => (
                <Grid size={{ xs: 4 }} key={`${selectedTab}-${id}`}>
                  {/* We add the tab to the key to force a clean re-render for transitions */}
                  <Fade in={true} timeout={400}>
                    <Stack
                      onClick={() => handlePlayerPick(id)}
                      alignItems="center"
                      sx={{
                        p: 1,
                        borderRadius: 2,
                        "&:hover": { bgcolor: "action.hover" },
                        cursor: "pointer",
                      }}
                    >
                      <Avatar
                        src={player.photo}
                        sx={{ width: 50, height: 50, mb: 1 }}
                      />
                      <Typography
                        variant="caption"
                        align="center"
                        sx={{
                          fontWeight: 800,
                          fontSize: "0.7rem",
                          // Prevent text jumping
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {player.name}
                      </Typography>
                    </Stack>
                  </Fade>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>
      </SwipeableDrawer>
    </Box>
  );
}
