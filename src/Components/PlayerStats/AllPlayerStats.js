import React, { useEffect, useState } from "react";
import {
  MenuItem,
  Paper,
  Select,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";

import { useSelector } from "react-redux";
import { selectAllPlayersSeasonOverallRating } from "../../Selectors/selectors";
import { selectSquadDataObject } from "../../Selectors/squadDataSelectors";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { useNavigate } from "react-router-dom";
import { getRatingClass } from "../../Hooks/Helper_Functions";

export default function AllPlayerStats() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const playerStats = useSelector(selectAllPlayersSeasonOverallRating);
  const navigate = useNavigate();

  const squadData = useSelector(selectSquadDataObject);
  const [sort, setSort] = useState("desc"); // Default to descending
  const [positionFilter, setPositionFilter] = useState("");

  const handlePositionChange = (event) => {
    setPositionFilter(event.target.value);
  };

  const handleSortChange = (event, newSort) => {
    if (newSort !== null) setSort(newSort);
  };

  // Convert playerStats object into an array and sort
  const sortedPlayers = Object.entries(playerStats)
    .map(([playerId, stats]) => ({
      playerId,
      stats,
      playerName: squadData[playerId]?.name || "Unknown Player",
      playerImg: squadData[playerId]?.photo || "Unknown Player",
      playerAverageRating: stats.totalRating / stats.totalSubmits,
    }))
    .filter((player) => player.playerId !== "4720") // exclude player with ID 4720
    .sort((a, b) =>
      sort === "asc"
        ? a.playerAverageRating - b.playerAverageRating
        : b.playerAverageRating - a.playerAverageRating
    );
  const filteredPlayers = sortedPlayers.filter(({ playerId }) =>
    positionFilter ? squadData[playerId]?.position === positionFilter : true
  );

  const handlePlayerNavigate = (playerId) => {
    navigate(`/players/${playerId}`);
  };
  return (
    <div className="PlayerStatsContainer">
      {/* <h2 className="globalHeading">Players Average Rating</h2> */}
      <div className="PlayerStatsButtonContainer">
        <Select
          value={positionFilter}
          onChange={handlePositionChange}
          displayEmpty
          size="small"
        >
          <MenuItem value="">All Positions</MenuItem>
          <MenuItem value="Attacker">Forward</MenuItem>
          <MenuItem value="Midfielder">Midfielder</MenuItem>
          <MenuItem value="Defender">Defender</MenuItem>
          <MenuItem value="Goalkepper">Goalkeeper</MenuItem>
        </Select>
        <ToggleButtonGroup
          size="small"
          value={sort}
          exclusive
          onChange={handleSortChange}
          aria-label="sort order"
        >
          <ToggleButton value="asc" aria-label="ascending">
            <ArrowDropUpIcon />
          </ToggleButton>
          <ToggleButton value="desc" aria-label="descending">
            <ArrowDropDownIcon />
          </ToggleButton>
        </ToggleButtonGroup>
      </div>
      <div className="PlayerStatsList">
        {filteredPlayers.map(
          ({ playerId, playerName, playerImg, playerAverageRating }) => (
            <Paper
              key={playerId}
              className="PlayerStatsListItem"
              onClick={() => handlePlayerNavigate(playerId)}
            >
              <div className="PlayerStatsListItemMeta">
                <img
                  src={playerImg}
                  className="PlayerStatsListImg"
                  alt={playerName}
                />
                <h2 className="globalHeading">{playerName}</h2>
                <ArrowForwardIcon
                  className="PlayerStatsListItemArrow"
                  fontSize="small"
                />
              </div>
              <div
                className={`globalBoxShadow PlayerStatsListItemScoreContainer ${getRatingClass(
                  playerAverageRating
                )}`}
              >
                <h4 className="PlayerStatsListItemScore">
                  {playerAverageRating.toFixed(1)}
                </h4>
              </div>
            </Paper>
          )
        )}
      </div>
    </div>
  );
}
