import React, { useState } from "react";
import {
  MenuItem,
  Paper,
  Select,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";

import { useSelector } from "react-redux";
import { selectPlayerStats } from "../../Selectors/selectors";
import { selectSquadData } from "../../Selectors/squadDataSelectors";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { useNavigate } from "react-router-dom";

export default function AllPlayerStats() {
  const playerStats = useSelector(selectPlayerStats);
  const navigate = useNavigate();

  const squadData = useSelector(selectSquadData);
  const [sort, setSort] = useState("desc"); // Default to descending
  const [positionFilter, setPositionFilter] = useState("");

  const handlePositionChange = (event) => {
    setPositionFilter(event.target.value);
  };

  const getRatingClass = (rating) => {
    if (rating < 4) return "ratingPoor";
    if (rating < 6) return "ratingAverage";
    if (rating < 8) return "ratingGood";
    return "ratingGreat";
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
      playerImg: squadData[playerId]?.img || "Unknown Player",
      playerAverageRating: stats.totalRating / stats.totalSubmits,
    }))
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
    <div>
      {/* <h2 className="globalHeading">Players Average Rating</h2> */}
      <div className="PlayerStatsButtonContainer">
        <Select
          value={positionFilter}
          onChange={handlePositionChange}
          displayEmpty
          size="small"
        >
          <MenuItem value="">All Positions</MenuItem>
          <MenuItem value="F">Forward</MenuItem>
          <MenuItem value="M">Midfielder</MenuItem>
          <MenuItem value="D">Defender</MenuItem>
          <MenuItem value="G">Goalkeeper</MenuItem>
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
              <ArrowForwardIcon
                className="PlayerStatsListItemArrow"
                fontSize="small"
              />
            </Paper>
          )
        )}
      </div>
    </div>
  );
}
