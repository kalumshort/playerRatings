import React from "react";
import { useSelector } from "react-redux";

import { Box, Grid } from "@mui/material"; // Added Grid

import { CommunityTeamStats } from "./CommunityTeamStats";

// --- SELECTORS & HOOKS ---

import { selectUserMatchData } from "../../../../Selectors/userDataSelectors";

import EnhancedLineupPredictor from "./EnhancedLineupPredictor";

import LineupTabs from "./LineupTabs";

export default function LineupPredictor({ fixture, readOnly }) {
  const usersMatchPredictions = useSelector(selectUserMatchData(fixture.id));

  // Load existing prediction if available
  const storedPrediction = usersMatchPredictions?.chosenTeam;

  // // Local state for the prediction being built
  // const [chosenTeam, setTeam] = useState({});

  // // --- DRAG HANDLER ---
  // const handleDragEnd = (event) => {
  //   const { active, over } = event;

  //   // Safety check: if dropped on nothing, or dropped on itself
  //   if (!over || active.id === over.id) return;

  //   const draggingPlayerId = active.id; // The Player ID being dragged
  //   const targetSlotId = over.id; // The Slot ID being dropped on

  //   setTeam((prev) => {
  //     const newTeam = { ...prev };

  //     // 1. Find where the dragging player is currently sitting (Source Slot)
  //     const sourceSlotId = Object.keys(newTeam).find(
  //       (key) => newTeam[key] === draggingPlayerId
  //     );

  //     // 2. Check if there is already a player at the target slot
  //     const existingPlayerId = newTeam[targetSlotId];

  //     // --- LOGIC ---

  //     // A. Player is moving from one Pitch Slot to another (SWAP Logic)
  //     if (sourceSlotId) {
  //       // Place dragging player in new slot
  //       newTeam[targetSlotId] = draggingPlayerId;

  //       if (existingPlayerId) {
  //         // SWAP: Move the existing player to the dragging player's old slot
  //         newTeam[sourceSlotId] = existingPlayerId;
  //       } else {
  //         // MOVE: Just empty the old slot
  //         delete newTeam[sourceSlotId];
  //       }
  //     }

  //     // B. Player is coming from the Bench/List (REPLACE Logic)
  //     else {
  //       // Place them in the slot. (Overwrites anyone currently there)
  //       newTeam[targetSlotId] = draggingPlayerId;
  //     }

  //     return newTeam;
  //   });
  // };

  // --- RENDER LOGIC ---

  // CASE A: VIEW MODE (Side-by-Side on Desktop, Stacked on Mobile)
  if (storedPrediction || readOnly) {
    return (
      <Box sx={{ flexGrow: 1, width: "100%", mt: 2 }}>
        <Grid container spacing={4} alignItems="flex-start">
          {/* LEFT: Lineup Tabs (50% on Web, 100% on Mobile) */}
          <Grid item xs={12} md={6}>
            {storedPrediction && <LineupTabs fixture={fixture} />}
          </Grid>

          {/* RIGHT: Community Stats (50% on Web, 100% on Mobile) */}
          <Grid item xs={12} md={6}>
            <CommunityTeamStats fixture={fixture} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  // CASE B: PREDICT MODE
  return <EnhancedLineupPredictor fixture={fixture} />;
}

export const FORMATIONS = {
  // --- 4 AT THE BACK ---
  "4-3-3 Holding": [
    { rowId: "atk", slots: [11, 9, 7] }, // LW, ST, RW
    { rowId: "mid", slots: [8, 10] }, // CM, CM
    { rowId: "dm", slots: [6] }, // CDM
    { rowId: "def", slots: [5, 4, 3, 2] },
    { rowId: "gk", slots: [1] },
  ],
  "4-3-3 Attack": [
    { rowId: "atk", slots: [11, 9, 7] }, // LW, ST, RW
    { rowId: "am", slots: [10] }, // CAM
    { rowId: "mid", slots: [8, 6] }, // CM, CM
    { rowId: "def", slots: [5, 4, 3, 2] },
    { rowId: "gk", slots: [1] },
  ],
  "4-3-3": [
    { rowId: "atk", slots: [11, 9, 10] }, // LW, ST, RW
    { rowId: "mid", slots: [8, 7, 6] }, // CM, CM
    { rowId: "def", slots: [5, 4, 3, 2] },
    { rowId: "gk", slots: [1] },
  ],
  "4-3-3 False 9": [
    { rowId: "atk", slots: [11, 7] }, // LW, RW
    { rowId: "f9", slots: [9] }, // CF (False 9) drops deep
    { rowId: "mid", slots: [8, 10, 6] }, // CM, CDM, CM
    { rowId: "def", slots: [5, 4, 3, 2] },
    { rowId: "gk", slots: [1] },
  ],
  "4-4-2 Flat": [
    { rowId: "atk", slots: [11, 9] },
    { rowId: "mid", slots: [10, 8, 6, 7] }, // LM, CM, CM, RM
    { rowId: "def", slots: [5, 4, 3, 2] },
    { rowId: "gk", slots: [1] },
  ],
  "4-4-2 Diamond": [
    { rowId: "atk", slots: [11, 9] }, // LS, RS
    { rowId: "am", slots: [10] }, // CAM
    { rowId: "mid", slots: [8, 7] }, // LCM, RCM (Shuttlers)
    { rowId: "dm", slots: [6] }, // CDM
    { rowId: "def", slots: [5, 4, 3, 2] },
    { rowId: "gk", slots: [1] },
  ],
  "4-2-3-1 Wide": [
    { rowId: "atk", slots: [9] },
    { rowId: "am", slots: [11, 10, 7] }, // LM, CAM, RM
    { rowId: "dm", slots: [8, 6] }, // CDM, CDM
    { rowId: "def", slots: [5, 4, 3, 2] },
    { rowId: "gk", slots: [1] },
  ],
  "4-2-3-1 Narrow": [
    { rowId: "atk", slots: [9] },
    { rowId: "am", slots: [10, 8, 6] }, // LAM, CAM, RAM (Compact)
    { rowId: "dm", slots: [7, 11] }, // CDM, CDM
    { rowId: "def", slots: [5, 4, 3, 2] },
    { rowId: "gk", slots: [1] },
  ],
  "4-1-4-1": [
    { rowId: "atk", slots: [9] },
    { rowId: "mid", slots: [11, 10, 8, 7] }, // LM, CM, CM, RM
    { rowId: "dm", slots: [6] }, // CDM
    { rowId: "def", slots: [5, 4, 3, 2] },
    { rowId: "gk", slots: [1] },
  ],
  "4-5-1": [
    { rowId: "atk", slots: [9] },
    { rowId: "mid", slots: [11, 10, 6, 8, 7] }, // Flat 5 Midfield
    { rowId: "def", slots: [5, 4, 3, 2] },
    { rowId: "gk", slots: [1] },
  ],
  "4-3-2-1 (Xmas Tree)": [
    { rowId: "atk", slots: [9] }, // ST
    { rowId: "am", slots: [11, 10] }, // LAM, RAM (Tucked in)
    { rowId: "mid", slots: [8, 6, 7] }, // CM, CM, CM
    { rowId: "def", slots: [5, 4, 3, 2] },
    { rowId: "gk", slots: [1] },
  ],

  // --- 3 AT THE BACK ---
  "3-5-2": [
    { rowId: "atk", slots: [11, 9] },
    { rowId: "mid", slots: [5, 10, 8, 6, 2] }, // LWB, CM, CM, CM, RWB
    { rowId: "def", slots: [7, 4, 3] }, // 7 drops to LCB
    { rowId: "gk", slots: [1] },
  ],
  "3-4-3 Wide": [
    { rowId: "atk", slots: [11, 9, 7] }, // LW, ST, RW
    { rowId: "mid", slots: [5, 10, 8, 2] }, // LM, CM, CM, RM
    { rowId: "def", slots: [6, 4, 3] }, // LCB, CB, RCB
    { rowId: "gk", slots: [1] },
  ],
  "3-4-3 Diamond": [
    { rowId: "atk", slots: [9] },
    { rowId: "am", slots: [11, 7] }, // LF, RF (Inside Forwards)
    { rowId: "mid", slots: [5, 10, 8, 2] }, // LM, CM, CM, RM
    { rowId: "def", slots: [6, 4, 3] },
    { rowId: "gk", slots: [1] },
  ],
  "3-4-1-2": [
    { rowId: "atk", slots: [11, 9] }, // ST, ST
    { rowId: "am", slots: [10] }, // CAM
    { rowId: "mid", slots: [5, 8, 6, 2] }, // LM, CM, CM, RM
    { rowId: "def", slots: [7, 4, 3] },
    { rowId: "gk", slots: [1] },
  ],

  // --- 5 AT THE BACK ---
  "5-3-2": [
    { rowId: "atk", slots: [11, 9] },
    { rowId: "mid", slots: [10, 8, 6] }, // 3 CMs
    { rowId: "def", slots: [5, 7, 4, 3, 2] }, // 5 Defenders
    { rowId: "gk", slots: [1] },
  ],
  "5-2-1-2": [
    { rowId: "atk", slots: [11, 9] },
    { rowId: "am", slots: [10] },
    { rowId: "mid", slots: [8, 6] },
    { rowId: "def", slots: [5, 7, 4, 3, 2] },
    { rowId: "gk", slots: [1] },
  ],
  "5-2-3": [
    { rowId: "atk", slots: [11, 9, 7] }, // LW, ST, RW
    { rowId: "mid", slots: [10, 8] }, // 2 CMs
    { rowId: "def", slots: [5, 6, 4, 3, 2] },
    { rowId: "gk", slots: [1] },
  ],
  "5-4-1": [
    { rowId: "atk", slots: [9] },
    { rowId: "mid", slots: [11, 10, 8, 7] }, // Flat 4
    { rowId: "def", slots: [5, 6, 4, 3, 2] },
    { rowId: "gk", slots: [1] },
  ],
};

/* <ContentContainer className="Prediction-lineup-container containerMargin">
      <DndContext onDragEnd={handleDragEnd}>
        <DroppablePitch
          fixture={fixture}
          chosenTeam={chosenTeam}
          setTeam={setTeam}
        />
        <DraggableSquad
          fixture={fixture}
          squad={squadData}
          chosenTeam={chosenTeam}
        />
      </DndContext>
    </ContentContainer> */
