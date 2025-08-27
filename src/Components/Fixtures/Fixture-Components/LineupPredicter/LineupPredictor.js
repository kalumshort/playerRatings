import React, { useRef, useState } from "react";
import { ContentContainer } from "../../../../Containers/GlobalContainer";
import DroppablePitch from "./DroppablePitch";
import DraggableSquad from "./DraggableSquad";

import { useSelector } from "react-redux";
import { selectPredictionsByMatchId } from "../../../../Selectors/predictionsSelectors";
import { selectSquadDataObject } from "../../../../Selectors/squadDataSelectors";
import LineupPlayer from "../LineupPlayer";
import whiteLogo from "../../../../assets/logo/11votes-nobg-clear-white.png";
import html2canvas from "html2canvas";

import { DndContext } from "@dnd-kit/core";
import { IconButton, Paper, Tooltip } from "@mui/material";
import { selectUserMatchData } from "../../../../Selectors/userDataSelectors";
import DownloadIcon from "@mui/icons-material/Download"; // MUI download icon
import useGroupData from "../../../../Hooks/useGroupsData";

export default function LineupPredictor({ fixture, readOnly }) {
  const squadData = useSelector(selectSquadDataObject);
  const usersMatchData = useSelector(selectUserMatchData(fixture.id));

  const storedUsersPredictedTeam = usersMatchData?.teamPrediction
    ? Object.keys(usersMatchData?.teamPrediction || {}).reduce((acc, key) => {
        acc[key] = usersMatchData?.teamPrediction[key].id.toString();
        return acc;
      }, {})
    : null;

  const [chosenTeam, setTeam] = useState({});

  // const availablePlayers = Object.keys(squadData).reduce((acc, playerId) => {
  //   if (!Object.values(chosenTeam).includes(playerId)) {
  //     acc[playerId] = squadData[playerId];
  //   }
  //   return acc;
  // }, {});

  const handlePlayerDrop = (droppedPlayerId, droppedLocation) => {
    setTeam((prevTeam) => {
      const updatedTeam = { ...prevTeam };

      const currentTeamSize = Object.keys(updatedTeam).length;

      // Check if the location is occupied
      if (updatedTeam[droppedLocation]) {
        const currentPlayerAtLocation = updatedTeam[droppedLocation];

        // Check if the dropped player already exists in the team
        if (Object.values(updatedTeam).includes(droppedPlayerId)) {
          // Find the current location of the dropped player and remove them
          let droppedPlayerOldLocation = null;
          for (let location in updatedTeam) {
            if (updatedTeam[location] === droppedPlayerId) {
              droppedPlayerOldLocation = location; // Store the old location of the dropped player
              delete updatedTeam[location]; // Remove the dropped player from their old location
              break;
            }
          }

          // Now place the dropped player at the new location
          updatedTeam[droppedLocation] = droppedPlayerId;

          // Move the current player to the dropped player's old location
          if (droppedPlayerOldLocation !== null) {
            updatedTeam[droppedPlayerOldLocation] = currentPlayerAtLocation;
          }
        } else {
          // If the dropped player is not in the team, just replace the current player
          delete updatedTeam[droppedLocation]; // Remove the current player from their location
          updatedTeam[droppedLocation] = droppedPlayerId; // Place the new player at the location
        }
      } else {
        // If the location is empty, check if the player is already in the team

        if (!Object.values(updatedTeam).includes(droppedPlayerId)) {
          if (currentTeamSize >= 11) {
            alert("11 Players Max");
            return updatedTeam; // Return early if the team already has 11 players
          }
          updatedTeam[droppedLocation] = droppedPlayerId; // Add the dropped player if not already in the team
        } else {
          // If the player is already in the team, update their location
          for (let location in updatedTeam) {
            if (updatedTeam[location] === droppedPlayerId) {
              delete updatedTeam[location]; // Remove from their old location
              updatedTeam[droppedLocation] = droppedPlayerId; // Add the player to the new location
              break;
            }
          }
        }
      }

      return updatedTeam;
    });
  };

  return storedUsersPredictedTeam || readOnly ? (
    <div className="chosen-lineup-container containerMargin">
      {storedUsersPredictedTeam && (
        <ChosenLineup
          UsersPredictedTeam={storedUsersPredictedTeam}
          squadData={squadData}
        />
      )}
      <CommunityTeamStats fixture={fixture} />
    </div>
  ) : (
    <ContentContainer className="Prediction-lineup-container containerMargin">
      {/* <h1 className="smallHeading">
        Preferred <br></br>Lineup
      </h1> */}

      <DndContext
        onDragEnd={(event) => {
          const { active, over } = event;

          // When a drop happens, call handleDrop
          if (over) {
            const droppedPlayerId = active.id; // The ID of the player being dragged
            const droppedLocationId = over.id; // The ID of the location where it was dropped
            handlePlayerDrop(droppedPlayerId, droppedLocationId);
          }
        }}
      >
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
    </ContentContainer>
  );
}

function ChosenLineup({ squadData, UsersPredictedTeam }) {
  const lineupRef = useRef(); // Create a reference to the content container

  // Improved saver
  const handleSaveImage = async () => {
    const target = lineupRef.current;
    if (!target) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1); // crisper export
    const styles = getComputedStyle(target);
    const radius = parseFloat(styles.borderRadius) || 0;

    const canvas = await html2canvas(target, {
      backgroundColor: null, // keep transparent bg (no white corners)
      useCORS: true,
      allowTaint: true,
      logging: false,
      scale: dpr,
      ignoreElements: (el) => el?.dataset?.nosnap === "true", // hide button
    });

    // If the component has rounded corners, apply a rounded mask to the export
    const finalCanvas =
      radius > 0 ? applyRoundMask(canvas, radius * dpr) : canvas;

    const imgData = finalCanvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = imgData;
    link.download = "11Votes-chosen-lineup.png";
    link.click();
  };

  // helpers
  function applyRoundMask(srcCanvas, r) {
    const masked = document.createElement("canvas");
    masked.width = srcCanvas.width;
    masked.height = srcCanvas.height;
    const ctx = masked.getContext("2d");

    // draw source
    ctx.drawImage(srcCanvas, 0, 0);

    // rounded-rect mask
    ctx.globalCompositeOperation = "destination-in";
    roundRect(ctx, 0, 0, masked.width, masked.height, r);
    ctx.fill();

    // reset comp mode (good hygiene if reused)
    ctx.globalCompositeOperation = "source-over";
    return masked;
  }

  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  return (
    <ContentContainer className="chosen-lineup " ref={lineupRef}>
      <img
        src={whiteLogo}
        alt="11Votes Logo"
        style={{
          height: "100px",
          position: "absolute",
          top: "15px",
          right: "15px",
          opacity: "0.1",
        }}
      />
      <h1 className="smallHeading">Your Chosen Lineup</h1>
      {UsersPredictedTeam && (
        <div className="userPredictedTeamContainer">
          {[
            [1],
            [2, 3, 4, 5, 6],
            [7, 8, 9, 10, 11],
            [12, 13, 14, 15, 16],
            [17, 18, 19, 20, 21],
          ]
            .reverse()
            .map((row, rowIndex) => (
              <div className="DroppablePitchRow" key={`row-${rowIndex}`}>
                {row.map((id) =>
                  squadData[UsersPredictedTeam[id]] ? (
                    <LineupPlayer
                      key={id}
                      id={id} // Pass the 'id' prop to DroppableLocation
                      player={squadData[UsersPredictedTeam[id]]}
                    />
                  ) : (
                    <></>
                  )
                )}
              </div>
            ))}
        </div>
      )}
      <div style={{ position: "absolute", bottom: "15px", right: "15px" }}>
        <Tooltip title="Save as Image">
          <IconButton
            data-nosnap="true"
            color="primary"
            onClick={handleSaveImage}
          >
            <DownloadIcon />
          </IconButton>
        </Tooltip>
      </div>
    </ContentContainer>
  );
}

export function CommunityTeamStats({ fixture }) {
  const matchPredictions = useSelector(selectPredictionsByMatchId(fixture.id));
  const { activeGroup } = useGroupData();

  const groupColour = activeGroup?.accentColor || "#DA291C";

  const squadData = useSelector(selectSquadDataObject);

  const percentagesArray = matchPredictions?.totalPlayersSubmits
    ? Object.entries(matchPredictions?.totalPlayersSubmits).map(
        ([playerId, timesSelected]) => ({
          id: playerId,
          percentage: (timesSelected / matchPredictions.totalTeamSubmits) * 100,
        })
      )
    : [];

  // Sort the array from largest to smallest percentage
  percentagesArray?.sort((a, b) => b.percentage - a.percentage);

  return (
    <ContentContainer className="community-team-stats">
      <TeamStats
        percentagesArray={percentagesArray}
        squadData={squadData}
        groupColour={groupColour}
      />
    </ContentContainer>
  );
}

const PlayerCard = ({ player, percentage, groupColour }) => {
  return (
    <Paper style={styles.card}>
      <div style={styles.playerInfo}>
        <img src={player.photo} alt={player.name} style={styles.playerImage} />
        <span style={styles.playerName}>{player.name}</span>
      </div>
      <div style={styles.percentageBarContainer}>
        <div
          style={{
            ...styles.percentageBar,
            width: `${percentage}%`,
            background: groupColour,
          }}
        ></div>
        <span style={styles.percentageText}>{percentage.toFixed(0)}%</span>
      </div>
    </Paper>
  );
};

const TeamStats = ({ percentagesArray, squadData, groupColour }) => {
  return (
    <div style={styles.container}>
      <h1 className="smallHeading">Players Chosen</h1>
      {percentagesArray?.map(({ id, percentage }) => (
        <PlayerCard
          key={id}
          player={squadData[id]}
          percentage={percentage}
          groupColour={groupColour}
        />
      ))}
      {percentagesArray.length === 0 && <span>No Data</span>}
    </div>
  );
};

const styles = {
  container: {
    display: "flex", // Grid layout
    flexWrap: "wrap", // Allow items to wrap to the next line
    gap: "20px", // Space between items
    padding: "10px",
  },

  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "10px",
    width: "80px",
    margin: "0 auto",
  },
  playerInfo: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: "5px",
  },
  playerImage: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    marginBottom: "10px",
  },
  playerName: {
    fontSize: "16px",
    fontWeight: "500",
    textAlign: "center",
    TextsmsOverflow: "ellipsis",
    whiteSpace: "nowrap",
    overflow: "hidden",
  },
  percentageBarContainer: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    position: "relative",
  },
  percentageBar: {
    height: "10px",
    width: "100%",
    borderRadius: "2px",
  },
  percentageText: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "12px",
    fontWeight: "600",
  },
};
