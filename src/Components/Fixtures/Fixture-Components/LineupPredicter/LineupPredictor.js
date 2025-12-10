import React, { useState } from "react";
import { useSelector } from "react-redux";
import { DndContext } from "@dnd-kit/core";

// --- COMPONENTS ---
import { ContentContainer } from "../../../../Containers/GlobalContainer";
import DroppablePitch from "./DroppablePitch";
import DraggableSquad from "./DraggableSquad";

// --- SELECTORS & HOOKS ---
import { selectSquadDataObject } from "../../../../Selectors/squadDataSelectors";
import { selectUserMatchData } from "../../../../Selectors/userDataSelectors";
import ChosenLineup from "./chosenLineup";
import { CommunityTeamStats } from "./CommunityTeamStats";

export default function LineupPredictor({ fixture, readOnly }) {
  const squadData = useSelector(selectSquadDataObject);
  const usersMatchData = useSelector(selectUserMatchData(fixture.id));

  // Load existing prediction if available
  const storedPrediction = usersMatchData?.chosenTeam;
  const storedFormation = usersMatchData?.formation || "4-3-3"; // Fallback if old data didn't have formation

  // Local state for the prediction being built
  const [chosenTeam, setTeam] = useState({});

  // --- DRAG HANDLER ---
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const playerId = active.id;
      const slotId = over.id;

      setTeam((prev) => {
        const newTeam = { ...prev };

        // 1. If player is already on pitch, remove them from old slot
        const oldSlot = Object.keys(newTeam).find(
          (key) => newTeam[key] === playerId
        );
        if (oldSlot) delete newTeam[oldSlot];

        // 2. If target slot has a player, remove them (swap logic could go here)
        // For now, just overwrite
        newTeam[slotId] = playerId;

        return newTeam;
      });
    }
  };

  // --- RENDER LOGIC ---

  // CASE A: VIEW MODE (Prediction already made OR read-only)
  if (storedPrediction || readOnly) {
    return (
      <div className="chosen-lineup-container containerMargin">
        {storedPrediction && (
          <ChosenLineup
            chosenTeam={storedPrediction}
            squadData={squadData}
            formation={storedFormation}
          />
        )}
        <CommunityTeamStats fixture={fixture} />
      </div>
    );
  }

  // CASE B: PREDICT MODE (Drag & Drop Interface)
  return (
    <ContentContainer className="Prediction-lineup-container containerMargin">
      <DndContext onDragEnd={handleDragEnd}>
        {/* The Pitch (Drop Targets) */}
        <DroppablePitch
          fixture={fixture}
          chosenTeam={chosenTeam}
          setTeam={setTeam}
        />

        {/* The Squad List (Draggable Source) */}
        <DraggableSquad
          fixture={fixture}
          squad={squadData}
          chosenTeam={chosenTeam}
        />
      </DndContext>
    </ContentContainer>
  );
}

export const FORMATIONS = {
  "4-3-3": [
    { rowId: "atk", slots: [11, 10, 9] },
    { rowId: "mid", slots: [8, 7, 6] },
    { rowId: "def", slots: [5, 4, 3, 2] },
    { rowId: "gk", slots: [1] },
  ],
  "4-4-2": [
    { rowId: "atk", slots: [11, 10] },
    { rowId: "mid", slots: [9, 8, 7, 6] },
    { rowId: "def", slots: [5, 4, 3, 2] },
    { rowId: "gk", slots: [1] },
  ],
  "3-5-2": [
    { rowId: "atk", slots: [11, 10] },
    { rowId: "mid", slots: [9, 8, 7, 6, 12] },
    { rowId: "def", slots: [5, 4, 3] },
    { rowId: "gk", slots: [1] },
  ],
  "4-2-3-1": [
    { rowId: "atk", slots: [11] },
    { rowId: "am", slots: [10, 9, 8] },
    { rowId: "dm", slots: [7, 6] },
    { rowId: "def", slots: [5, 4, 3, 2] },
    { rowId: "gk", slots: [1] },
  ],
  "3-4-3": [
    { rowId: "atk", slots: [11, 10, 9] },
    { rowId: "mid", slots: [8, 7, 6, 12] },
    { rowId: "def", slots: [5, 4, 3] },
    { rowId: "gk", slots: [1] },
  ],
  "5-3-2": [
    { rowId: "atk", slots: [11, 10] },
    { rowId: "mid", slots: [9, 8, 7] },
    { rowId: "def", slots: [6, 5, 4, 3, 2] },
    { rowId: "gk", slots: [1] },
  ],
};
