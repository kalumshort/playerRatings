import React, { useState } from "react";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import { ContentContainer } from "../../../Containers/GlobalContainer";
import { useDispatch, useSelector } from "react-redux";
import { selectSquadDataObject } from "../../../Selectors/squadDataSelectors";
import { Button, IconButton, Popover } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";

import { handlePredictPreMatchMotm } from "../../../Firebase/Firebase";
import { fetchMatchPredictions } from "../../../Hooks/Fixtures_Hooks";
import { selectPredictionsByMatchId } from "../../../Selectors/predictionsSelectors";
import useGroupData from "../../../Hooks/useGroupsData";
import { useAuth } from "../../../Providers/AuthContext";
import { selectUserMatchData } from "../../../Selectors/userDataSelectors";

export default function PreMatchMOTM({ fixture }) {
  const squadData = useSelector(selectSquadDataObject);
  const dispatch = useDispatch();
  const matchPredictions = useSelector(selectPredictionsByMatchId(fixture.id));
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const { activeGroup } = useGroupData();
  const { user } = useAuth();
  const usersMatchData = useSelector(selectUserMatchData(fixture.id));

  const storedUsersPlayerToWatch = usersMatchData?.preMatchMotm;

  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget); // Set the popover anchor
  };

  const handleClose = () => {
    setAnchorEl(null); // Close the popover
  };

  const open = Boolean(anchorEl); // Boolean for whether the popover is open
  const id = open ? "simple-popover" : undefined;
  const handleChange = (event) => {
    setSelectedPlayer(event.target.value);
  };

  const handlePlayerToWatchSubmit = async () => {
    await handlePredictPreMatchMotm({
      matchId: fixture.id,
      playerId: selectedPlayer,
      groupId: activeGroup.groupId,
      userId: user.uid,
    });

    dispatch(
      fetchMatchPredictions({
        matchId: fixture.id,
        groupId: activeGroup.groupId,
      })
    );
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
        justifyContent: "space-evenly",
        alignItems: "center",
      }}
    >
      <h1 className="smallHeading">Player to Watch</h1>

      <IconButton
        onClick={handleClick}
        style={{ position: "absolute", right: "5px", top: "5px" }}
      >
        <InfoIcon />
      </IconButton>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom", // Popover appears below the button
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        <ul
          style={{
            color: "grey",
            fontSize: "10px",
            listStyle: "none",
            padding: "10px",
            margin: "0px",
          }}
        >
          {result.map(({ playerId, name, percentage }) => (
            <li key={playerId}>
              {name}: {percentage}%
            </li>
          ))}
        </ul>
      </Popover>

      <div
        style={{
          textAlign: "center",
          gap: "5px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <p style={{ margin: "0px", color: "grey" }}>{result[0]?.name}</p>

        <p style={{ margin: "0px", fontSize: "30px" }}>
          {result[0]?.percentage}%
        </p>
      </div>

      <div>
        <img
          src={squadData[result[0]?.playerId]?.photo}
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
                  src={squadData[selected].photo}
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
              "Choose A Player"
            )
          }
          style={{ minWidth: 220 }}
        >
          {Object.values(squadData).map((player) => (
            <MenuItem key={player.id} value={player.id}>
              <Box display="flex" alignItems="center" gap={1}>
                <Avatar
                  alt={player.name}
                  src={player.photo}
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
          variant="text"
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
