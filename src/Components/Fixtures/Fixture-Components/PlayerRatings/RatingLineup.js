import React, { useState } from "react";
import useGroupData from "../../../../Hooks/useGroupsData";
import { selectMatchRatingsById } from "../../../../Selectors/selectors";
import { useSelector } from "react-redux";

import { selectSquadPlayerById } from "../../../../Selectors/squadDataSelectors";
import {
  getRatingLineupClass,
  missingPlayerImg,
} from "../../../../Hooks/Helper_Functions";
import { ContentContainer } from "../../../../Containers/GlobalContainer";
import { MenuItem, Select } from "@mui/material";

export default function RatingLineup({ fixture, usersMatchPlayerRatings }) {
  const { activeGroup } = useGroupData();
  const matchRatings = useSelector(selectMatchRatingsById(fixture.id));

  const groupClubId = Number(activeGroup.groupClubId);

  const [ratingSrc, setRatingSrc] = useState("Global");

  const handleChange = (event) => {
    setRatingSrc(event.target.value);
  };

  const lineup = fixture?.lineups?.find(
    (team) => team.team.id === groupClubId
  )?.startXI;

  const substitutedPlayerIds = fixture?.events
    .filter((item) => item.type === "subst" && item.team?.id === groupClubId)
    .map((item) => item.player);

  // Ensure both lineup and substitutedPlayerIds are defined and not empty
  if (
    (!lineup || lineup.length === 0) &&
    (!substitutedPlayerIds || substitutedPlayerIds.length === 0)
  ) {
    return <></>;
  }

  return (
    <div className="containerMargin">
      <ContentContainer
        className="lineup-container"
        style={{ padding: "15px 5px", position: "relative" }}
      >
        <Select
          value={ratingSrc}
          onChange={handleChange}
          size="small"
          variant="standard"
          style={{ position: "absolute", top: "5px", right: "5px", zIndex: 10 }}
        >
          <MenuItem key="global" value="Global">
            Global
          </MenuItem>
          <MenuItem key="personal" value="Personal">
            Personal
          </MenuItem>
        </Select>
        <div style={{ position: "relative" }}>
          <div className="pitch">
            {lineup &&
              lineup.length > 0 &&
              lineup
                .reduce((rows, { player }) => {
                  const [row] = player.grid.split(":").map(Number);

                  if (!rows[row]) rows[row] = [];
                  rows[row].push(player);

                  return rows;
                }, [])
                .map((rowPlayers, rowIndex) => (
                  <div key={rowIndex} className="row">
                    {rowPlayers.map((player) => {
                      // Ensure the player has a valid rating or fallback to an empty object
                      const playerRating =
                        ratingSrc === "Global"
                          ? matchRatings?.[player.id]?.totalRating &&
                            matchRatings?.[player.id]?.totalSubmits
                            ? matchRatings[player.id].totalRating /
                              matchRatings[player.id].totalSubmits
                            : null
                          : usersMatchPlayerRatings?.[player.id] ?? null;

                      return (
                        <RatingLineupPlayer
                          key={player.id}
                          player={player}
                          fixture={fixture}
                          playerRating={playerRating?.toFixed(2) || "na"}
                        />
                      );
                    })}
                  </div>
                ))}
          </div>
          <div>
            <h2
              className="heading2"
              style={{ textAlign: "center", marginTop: "10px" }}
            >
              Substitutes
            </h2>
            <div style={{ display: "flex", justifyContent: "space-evenly" }}>
              {substitutedPlayerIds &&
                substitutedPlayerIds.length > 0 &&
                substitutedPlayerIds.map((player) => {
                  const playerRating =
                    ratingSrc === "Global"
                      ? matchRatings?.[player.id]?.totalRating &&
                        matchRatings?.[player.id]?.totalSubmits
                        ? matchRatings[player.id].totalRating /
                          matchRatings[player.id].totalSubmits
                        : null
                      : usersMatchPlayerRatings?.[player.id] ?? null;

                  return (
                    <RatingLineupPlayer
                      key={player.id}
                      player={player}
                      fixture={fixture}
                      playerRating={playerRating?.toFixed(2)}
                    />
                  );
                })}
            </div>
          </div>
        </div>
      </ContentContainer>
    </div>
  );
}

const RatingLineupPlayer = ({ player, className, playerRating }) => {
  const playerData = useSelector(selectSquadPlayerById(player?.id));

  return player ? (
    <div
      key={player.id}
      className={`player ${className}`}
      style={{ order: player?.grid?.split(":")[1], position: "relative" }}
    >
      <img
        src={player?.photo || playerData?.photo || missingPlayerImg}
        className="lineup-player-img"
        alt={player.name}
        style={{ position: "relative", zIndex: 1 }}
      />
      {playerRating !== "na" && (
        <div
          className={`rating-overlay  ${getRatingLineupClass(playerRating)}`}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            color: "#fff",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2,
          }}
        >
          <span
            style={{
              fontSize: "20px",
              fontWeight: "bold",
              textShadow: "2px 2px 5px rgba(0, 0, 0, 0.7)", // Strong text shadow
            }}
          >
            {playerRating !== "na" ? playerRating : "N/A"}
          </span>
        </div>
      )}
    </div>
  ) : (
    <></>
  );
};
