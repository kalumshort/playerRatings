import React, { useState } from "react";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import { ContentContainer } from "../../../Containers/GlobalContainer";
import { useSelector } from "react-redux";
import { selectSquadData } from "../../../Selectors/squadDataSelectors";
import { Button } from "@mui/material";
import {
  setLocalStorageItem,
  useLocalStorage,
} from "../../../Hooks/Helper_Functions";

export default function PreMatchMOTM({ fixture }) {
  const squadData = useSelector(selectSquadData);

  const [selectedPlayer, setSelectedPlayer] = useState("");
  console.log(selectedPlayer);
  const storedUsersPlayerToWatch = useLocalStorage(
    `userPredictedPlayerToWatch-${fixture.id}`
  );

  const handleChange = (event) => {
    setSelectedPlayer(event.target.value);
  };

  const handlePlayerToWatchSubmit = () => {
    setLocalStorageItem(
      `userPredictedPlayerToWatch-${fixture.id}`,
      selectedPlayer
    );
  };

  return (
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
          renderValue={(selected) =>
            selected && squadData[selected] ? (
              <Box display="flex" alignItems="center" gap={1}>
                <Avatar
                  alt={squadData[selected].name}
                  src={squadData[selected].img}
                  style={{
                    width: 50,
                    height: 50,
                  }}
                />
                <Typography>{squadData[selected].name}</Typography>
              </Box>
            ) : (
              "Select a Player"
            )
          }
          style={{ width: 300 }}
        >
          {Object.values(squadData).map((player) => (
            <MenuItem key={player.id} value={player.id}>
              <Box display="flex" alignItems="center" gap={1}>
                <Avatar
                  alt={player.name}
                  src={player.img}
                  style={{ width: 24, height: 24 }}
                />
                <Typography>{player.name}</Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </div>
      {selectedPlayer && (
        <Button
          onClick={() => handlePlayerToWatchSubmit}
          style={{ position: "absolute", bottom: "10px", right: "10px" }}
          variant="contained"
        >
          Submit
        </Button>
      )}
    </ContentContainer>
  );
}
