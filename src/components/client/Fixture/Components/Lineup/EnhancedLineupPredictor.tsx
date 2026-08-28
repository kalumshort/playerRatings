"use client";

import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
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
  Paper,
  TextField,
  InputAdornment,
  alpha,
} from "@mui/material";
import { DeleteSweep, SearchRounded } from "@mui/icons-material";

// --- CLEAN IMPORTS ---

import { useAuth } from "@/context/AuthContext";
import { RootState } from "@/lib/redux/store";
import { FORMATIONS, DEFAULT_FORMATION, POSITION_BY_ROW } from "./formations";
import Pitch from "./Pitch";
import { PitchPlayer, EmptyPitchSlot } from "./PitchPlayer";
import { AsyncButton } from "@/components/ui/AsyncButton";
import { handlePredictTeamSubmit } from "@/lib/firebase/client-actions";
import { toast } from "sonner";
import { selectActiveSquadMapped } from "@/lib/redux/selectors/squadSelectors";

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
    usersMatchData?.formation || DEFAULT_FORMATION,
  );
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("Goalkeeper");
  const [query, setQuery] = useState("");

  // 3. LOGIC HELPERS

  // Which squad position a slot belongs to, keyed by the formation row it sits
  // in. The old version was a fixed slot->position map, so in 4-3-3 Holding
  // tapping the right winger (slot 7) opened the DEFENDER tab.
  const slotPosition = useMemo(() => {
    const map: Record<number, string> = {};
    (FORMATIONS[formation] || FORMATIONS[DEFAULT_FORMATION]).forEach((row) => {
      row.slots.forEach((s) => {
        map[s] = POSITION_BY_ROW[row.rowId];
      });
    });
    return map;
  }, [formation]);

  const trimmedQuery = query.trim().toLowerCase();

  /** The player currently occupying the tapped slot, if any. */
  const activePlayer =
    activeSlot != null ? squadData[chosenTeam[activeSlot]] : null;

  const filteredSquad = useMemo(() => {
    const entries = Object.entries(squadData) as [string, any][];

    // Searching ignores the position tab entirely. That's what makes the
    // lossy row->position mapping harmless: a wing-back sitting in the `mid`
    // row is still one keystroke away.
    if (trimmedQuery) {
      return entries.filter(([, p]) => {
        const name = String(p.name ?? "").toLowerCase();
        const number = String(p.number ?? "");
        return name.includes(trimmedQuery) || number === trimmedQuery;
      });
    }

    // Already-picked players stay visible (marked "In XI") so the commonest
    // edit of all — two players in the wrong slots — is a single swap.
    return entries.filter(([, p]) => p.position === selectedTab);
  }, [squadData, selectedTab, chosenTeam, trimmedQuery]);

  // 4. HANDLERS
  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setActiveSlot(null);
    setQuery("");
  };

  const handleSlotClick = (slotId: number) => {
    setActiveSlot(slotId);
    setSelectedTab(slotPosition[slotId] ?? "Midfielder");
    setQuery("");
    setIsDrawerOpen(true);
  };

  /**
   * Assign a player to a slot, swapping if they're already in the XI
   * elsewhere. Without the swap, moving two players past each other means
   * removing both first.
   */
  const handlePlayerPick = (playerId: string) => {
    if (activeSlot == null) return;

    setTeam((prev) => {
      const next = { ...prev };
      const existingSlot = Object.keys(next).find((s) => next[s] === playerId);
      const displaced = next[activeSlot];

      next[activeSlot] = playerId;

      if (existingSlot && existingSlot !== String(activeSlot)) {
        if (displaced) next[existingSlot] = displaced;
        else delete next[existingSlot];
      }
      return next;
    });

    closeDrawer();
  };

  const handleRemoveActiveSlot = () => {
    if (activeSlot == null) return;
    setTeam((prev) => {
      const next = { ...prev };
      delete next[activeSlot];
      return next;
    });
    closeDrawer();
  };

  /** Optimistic clear with an undo, rather than a confirm dialog. */
  const handleClearAll = () => {
    const snapshot = chosenTeam;
    setTeam({});
    toast("Lineup cleared", {
      action: { label: "Undo", onClick: () => setTeam(snapshot) },
    });
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
      console.error("Lineup submission failed:", error);
      toast.error("Couldn't submit your XI. Try again.", {
        id: `lineup-${matchId}`,
        duration: 6000,
      });
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
            sx={{ bgcolor: "background.paper" }}
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
          onClick={handleClearAll}
          color="error"
          sx={{ fontWeight: 800 }}
        >
          Clear
        </Button>
      </Stack>

      {/* PITCH */}
      <Pitch
        formation={formation}
        sx={{ my: 2 }}
        renderSlot={({ slotId, position }) => {
          const playerId = chosenTeam[slotId];
          const player = squadData[playerId];

          // Filled slots are tappable to replace — removal lives in the
          // drawer now, so the pitch carries no micro-controls.
          return player ? (
            <PitchPlayer
              name={player.name.split(" ").pop()}
              fullName={player.name}
              photo={player.photo}
              onClick={() => handleSlotClick(slotId)}
            />
          ) : (
            <EmptyPitchSlot
              onClick={() => handleSlotClick(slotId)}
              label={`Add a ${position}`}
            />
          );
        }}
      />

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
        onClose={closeDrawer}
        onOpen={() => setIsDrawerOpen(true)}
        disableDiscovery
        PaperProps={{
          sx: {
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: "80vh",
          },
        }}
      >
        <Box sx={{ p: 2, display: "flex", flexDirection: "column" }}>
          {/* Grab handle */}
          <Box
            sx={{
              width: 36,
              height: 4,
              borderRadius: 999,
              bgcolor: "divider",
              mx: "auto",
              mb: 1.5,
            }}
          />

          <Typography
            variant="overline"
            sx={{ fontWeight: 900, letterSpacing: 1.5, opacity: 0.6, mb: 1 }}
          >
            {activePlayer
              ? `Replace ${activePlayer.name}`
              : `Pick a ${activeSlot != null ? (slotPosition[activeSlot] ?? "player") : "player"}`}
          </Typography>

          {/* Removal lives here rather than as a 22px badge on the pitch,
              which was under the touch-target minimum and overlapped its
              neighbours. */}
          {activePlayer && (
            <Button
              onClick={handleRemoveActiveSlot}
              startIcon={<DeleteSweep />}
              color="error"
              fullWidth
              sx={{ justifyContent: "flex-start", fontWeight: 800, mb: 1 }}
            >
              Remove {activePlayer.name}
            </Button>
          )}

          <TextField
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or number"
            size="small"
            fullWidth
            // Deliberately not autoFocus: on mobile it throws the keyboard up
            // over the list before the user has seen it.
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRounded fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 1.5 }}
          />

          {!trimmedQuery && (
            <Tabs
              value={selectedTab}
              onChange={(_, v) => setSelectedTab(v)}
              variant="fullWidth"
              sx={{ mb: 2 }}
            >
              <Tab label="GK" value="Goalkeeper" sx={{ fontWeight: 900 }} />
              <Tab label="DEF" value="Defender" sx={{ fontWeight: 900 }} />
              <Tab label="MID" value="Midfielder" sx={{ fontWeight: 900 }} />
              <Tab label="FWD" value="Attacker" sx={{ fontWeight: 900 }} />
            </Tabs>
          )}

          <Box sx={{ position: "relative", minHeight: 200 }}>
            {filteredSquad.length === 0 ? (
              <Stack
                alignItems="center"
                justifyContent="center"
                sx={{ minHeight: 200, opacity: 0.6 }}
                spacing={1}
              >
                <Typography variant="body2" fontWeight={800}>
                  No players found
                </Typography>
                <Typography variant="caption">
                  Try a different name or number.
                </Typography>
              </Stack>
            ) : (
              <Grid container spacing={1}>
                {filteredSquad.map(([id, player]: [string, any]) => {
                  const pickedSlot = Object.keys(chosenTeam).find(
                    (s) => chosenTeam[s] === id,
                  );
                  const isPicked = Boolean(pickedSlot);
                  const isThisSlot = pickedSlot === String(activeSlot);

                  return (
                    <Grid size={{ xs: 4 }} key={id}>
                      <Stack
                        onClick={() => handlePlayerPick(id)}
                        alignItems="center"
                        sx={{
                          p: 1,
                          borderRadius: 2,
                          position: "relative",
                          opacity: isThisSlot ? 0.5 : 1,
                          "&:hover": { bgcolor: "action.hover" },
                          cursor: "pointer",
                        }}
                      >
                        <Avatar
                          src={player.photo}
                          alt={player.name}
                          sx={{ width: 50, height: 50, mb: 1 }}
                        />
                        <Typography
                          variant="caption"
                          align="center"
                          sx={{
                            fontWeight: 800,
                            fontSize: "0.7rem",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {player.name}
                        </Typography>

                        {isPicked && !isThisSlot && (
                          <Paper
                            variant="pill"
                            sx={(t) => ({
                              position: "absolute",
                              top: 2,
                              right: 2,
                              px: 0.6,
                              fontSize: "0.55rem",
                              fontWeight: 900,
                              bgcolor: alpha(t.palette.primary.main, 0.22),
                              color: "text.primary",
                            })}
                          >
                            IN XI
                          </Paper>
                        )}
                      </Stack>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>
        </Box>
      </SwipeableDrawer>
    </Box>
  );
}
