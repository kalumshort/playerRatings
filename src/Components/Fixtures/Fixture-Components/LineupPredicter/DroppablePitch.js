import React, { useState } from "react";
import {
  Box,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useDroppable } from "@dnd-kit/core";
import { CheckCircle, DeleteSweep, PersonOff } from "@mui/icons-material";

import { selectSquadDataObject } from "../../../../Selectors/squadDataSelectors";
import { handlePredictTeamSubmit } from "../../../../Firebase/Firebase";
import { fetchMatchPredictions } from "../../../../Hooks/Fixtures_Hooks";
import { DraggablePlayer } from "./DraggableSquad";
import useGroupData from "../../../../Hooks/useGroupsData";
import { useAuth } from "../../../../Providers/AuthContext";
import useGlobalData from "../../../../Hooks/useGlobalData";
import "../../../../retro-patterns.css";
import { FORMATIONS } from "./LineupPredictor";

export default function DroppablePitch({
  fixture,
  chosenTeam,
  setTeam,
  initialFormation = "4-3-3",
}) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const globalData = useGlobalData();
  const { activeGroup } = useGroupData();
  const squadData = useSelector(selectSquadDataObject);

  const [formation, setFormation] = useState(initialFormation);

  const handleClear = () => setTeam({});

  const handleTeamSubmit = async () => {
    // Filter valid players
    const filteredPlayers = Object.keys(chosenTeam).reduce((result, key) => {
      const playerId = chosenTeam[key];
      if (squadData[playerId]) {
        result[key] = squadData[playerId]; // Saving full player object or ID based on your DB needs
      }
      return result;
    }, {});

    // Save only IDs to DB usually better, but keeping your logic:
    // We save "chosenTeam" (the slot mapping) AND "formation"
    await handlePredictTeamSubmit({
      chosenTeam: chosenTeam,
      formation: formation,
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

  const activeLayout = FORMATIONS[formation] || FORMATIONS["4-3-3"];

  return (
    <Box sx={{ width: "100%", maxWidth: 600, mx: "auto", mb: 4 }}>
      {/* HEADER */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2, px: 1 }}
      >
        <FormControl variant="standard" sx={{ minWidth: 140 }}>
          <InputLabel
            id="formation-label"
            sx={{ fontFamily: "Space Mono", fontSize: "0.8rem" }}
          >
            TACTIC
          </InputLabel>
          <Select
            labelId="formation-label"
            value={formation}
            onChange={(e) => setFormation(e.target.value)}
            label="Formation"
            sx={{
              fontFamily: "VT323",
              fontSize: "1.5rem",
              color: theme.palette.primary.main,
            }}
          >
            {Object.keys(FORMATIONS).map((fmt) => (
              <MenuItem key={fmt} value={fmt} sx={{ fontFamily: "Space Mono" }}>
                {fmt}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {Object.keys(chosenTeam).length > 0 && (
          <Button
            startIcon={<DeleteSweep />}
            onClick={handleClear}
            color="error"
            size="small"
            sx={{ fontFamily: "Space Mono" }}
          >
            CLEAR
          </Button>
        )}
      </Stack>

      {/* PITCH */}
      <Box
        sx={{
          position: "relative",
          border: `2px solid ${theme.palette.divider}`,
          overflow: "hidden",
          boxShadow: `0 10px 30px -5px ${theme.palette.common.black}50`,
          width: "100%",
          aspectRatio: "0.85",
          maxHeight: "550px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-evenly",
          py: 1,
          // Gradient
        }}
      >
        <PitchLines />
        {activeLayout.map((row) => (
          <Box
            key={row.rowId}
            sx={{
              display: "flex",
              justifyContent: "space-evenly",
              alignItems: "center",
              zIndex: 2,
              position: "relative",
              height: "100%",
            }}
          >
            {row.slots.map((slotId) => (
              <DroppableLocation
                key={slotId}
                id={slotId}
                player={squadData?.[chosenTeam[slotId]]}
              />
            ))}
          </Box>
        ))}
      </Box>

      {/* FOOTER BUTTON */}
      <Box sx={{ mt: 3, textAlign: "center" }}>
        <Button
          variant="contained"
          disabled={Object.keys(chosenTeam).length !== 11}
          onClick={handleTeamSubmit}
          startIcon={<CheckCircle />}
          sx={{
            borderRadius: 8,
            px: 4,
            py: 1.5,
            fontFamily: "Space Mono",
            fontWeight: "bold",
            boxShadow: theme.shadows[4],
          }}
        >
          CONFIRM LINEUP
        </Button>
        <Typography
          variant="caption"
          display="block"
          sx={{ mt: 1, color: "text.secondary", fontFamily: "Space Mono" }}
        >
          {Object.keys(chosenTeam).length} / 11 Players Selected
        </Typography>
      </Box>
    </Box>
  );
}

function DroppableLocation({ id, player }) {
  const { setNodeRef, isOver } = useDroppable({ id: id });
  const theme = useTheme();

  if (player) {
    return (
      <DraggablePlayer locationId={id} player={player} useAnimation={true} />
    );
  }

  return (
    <Box
      ref={setNodeRef}
      sx={{
        width: 50,
        height: 50,
        borderRadius: "20%",
        border: isOver
          ? `2px solid ${theme.palette.primary.main}`
          : `2px dashed rgba(255,255,255,0.3)`,
        bgcolor: isOver ? `${theme.palette.primary.main}20` : "rgba(0,0,0,0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s",
        transform: isOver ? "scale(1.1)" : "scale(1)",
      }}
    >
      {!isOver && (
        <PersonOff sx={{ color: "rgba(255,255,255,0.2)", fontSize: 20 }} />
      )}
    </Box>
  );
}

// Export PitchLines so ChosenLineup can use it
export const PitchLines = () => (
  <Box
    sx={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: "none",
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
        border: "2px solid rgba(255,255,255,0.1)",
        borderRadius: "50%",
      }}
    />
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "2px",
        bgcolor: "rgba(255,255,255,0.1)",
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
        border: "2px solid rgba(255,255,255,0.1)",
        borderBottom: "none",
      }}
    />
    <Box
      sx={{
        position: "absolute",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "35%",
        height: "7%",
        border: "2px solid rgba(255,255,255,0.1)",
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
        bgcolor: "rgba(255,255,255,0.3)",
        borderRadius: "50%",
      }}
    />
    <Box
      sx={{
        position: "absolute",
        bottom: -10,
        left: -10,
        width: 20,
        height: 20,
        border: "2px solid rgba(255,255,255,0.1)",
        borderRadius: "50%",
      }}
    />
    <Box
      sx={{
        position: "absolute",
        bottom: -10,
        right: -10,
        width: 20,
        height: 20,
        border: "2px solid rgba(255,255,255,0.1)",
        borderRadius: "50%",
      }}
    />
  </Box>
);
