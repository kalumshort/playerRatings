import React, { useState } from "react";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import { ContentContainer } from "../../../Containers/GlobalContainer";
import { useDispatch, useSelector } from "react-redux";
import { selectSquadData } from "../../../Selectors/squadDataSelectors";
import { Button } from "@mui/material";
import {
  setLocalStorageItem,
  useLocalStorage,
} from "../../../Hooks/Helper_Functions";
import { handlePredictPreMatchMotm } from "../../../Firebase/Firebase";
import { fetchMatchPredictions } from "../../../Hooks/Fixtures_Hooks";
import { selectPredictionsByMatchId } from "../../../Selectors/predictionsSelectors";

export default function PreMatchMOTM({ fixture }) {
  const squadData = useSelector(selectSquadData);
  const dispatch = useDispatch();
  const matchPredictions = useSelector(selectPredictionsByMatchId(fixture.id));
  const [selectedPlayer, setSelectedPlayer] = useState("");

  const storedUsersPlayerToWatch = useLocalStorage(
    `userPredictedPlayerToWatch-${fixture.id}`
  );

  const handleChange = (event) => {
    setSelectedPlayer(event.target.value);
  };

  const handlePlayerToWatchSubmit = async () => {
    setLocalStorageItem(
      `userPredictedPlayerToWatch-${fixture.id}`,
      selectedPlayer
    );

    await handlePredictPreMatchMotm({
      matchId: fixture.id,
      playerId: selectedPlayer,
    });

    dispatch(fetchMatchPredictions(fixture.id));
  };
  const result = calculatePercentages(
    matchPredictions.preMatchMotm,
    matchPredictions.preMatchMotmVotes,
    squadData
  );

  return storedUsersPlayerToWatch ? (
    <ContentContainer
      className="scorePredictionContainer"
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        // backgroundImage: `url(${squadData[result[0]?.playerId]?.img})`,
      }}
    >
      <h1 className="smallHeading">Player to Watch</h1>
      <div>
        <ul
          style={{
            color: "grey",
            fontSize: "10px",
            listStyle: "none",
            padding: "0px 0px 0px 5px",
            margin: "0px",
          }}
        >
          {result.map(({ playerId, name, percentage }) => (
            <li key={playerId}>
              {name}: {percentage}%
            </li>
          ))}
        </ul>
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ margin: "0px" }}>{result[0]?.name}</p>
        <br></br>
        <p
          style={{ margin: "0px", fontSize: "30px" }}
          // className="gradient-text"
        >
          {result[0]?.percentage}%
        </p>
      </div>

      <div>
        <img
          src={squadData[result[0]?.playerId]?.img}
          height={100}
          alt={result[0]?.name}
        />
      </div>
    </ContentContainer>
  ) : (
    <ContentContainer className="scorePredictionContainer">
      <h1 className="smallHeading">Player to Watch</h1>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <Select
          value={selectedPlayer}
          onChange={handleChange}
          displayEmpty
          variant="standard"
          renderValue={(selected) =>
            selected && squadData[selected] ? (
              <Box display="flex" alignItems="center" gap={1}>
                <Avatar
                  alt={squadData[selected].name}
                  src={squadData[selected].img}
                  style={{
                    height: 80,
                    width: 60,
                    borderRadius: "8px",
                    objectFit: "contain",
                  }}
                />
                <Typography>{squadData[selected].name}</Typography>
              </Box>
            ) : (
              "Select a Player"
            )
          }
          style={{ minWidth: 150 }}
        >
          {Object.values(squadData).map((player) => (
            <MenuItem key={player.id} value={player.id}>
              <Box display="flex" alignItems="center" gap={1}>
                <Avatar
                  alt={player.name}
                  src={player.img}
                  style={{
                    height: 50,
                    borderRadius: "8px",
                    objectFit: "contain",
                  }}
                />
                <Typography>{player.name}</Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </div>
      {selectedPlayer && (
        <Button
          onClick={() => handlePlayerToWatchSubmit()}
          style={{
            position: "absolute",
            top: "1px",
            right: "1px",
            padding: "0px",
          }}
          variant="outlined"
          size="small"
        >
          Submit
        </Button>
      )}
    </ContentContainer>
  );
}

const calculatePercentages = (preMatchMotm, preMatchMotmVotes, squadData) => {
  const totalVotes = parseInt(preMatchMotmVotes, 10);

  if (!totalVotes) return [];

  return Object.entries(preMatchMotm)
    .map(([playerId, votes]) => ({
      playerId,
      name: squadData[playerId]?.name || "Unknown Player",
      votes,
      percentage: ((votes / totalVotes) * 100).toFixed(0),
    }))
    .sort((a, b) => b.percentage - a.percentage);
};
