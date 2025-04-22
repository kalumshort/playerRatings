import React from "react";
import useGroupData from "../../../../Hooks/useGroupsData";
import { selectMatchRatingsById } from "../../../../Selectors/selectors";
import { useSelector } from "react-redux";

import { selectSquadPlayerById } from "../../../../Selectors/squadDataSelectors";
import {
  getRatingLineupClass,
  missingPlayerImg,
} from "../../../../Hooks/Helper_Functions";
import { ContentContainer } from "../../../../Containers/GlobalContainer";

export default function RatingLineup({ fixture }) {
  const { activeGroup } = useGroupData();
  const matchRatings = useSelector(selectMatchRatingsById(fixture.id));

  const groupClubId = Number(activeGroup.groupClubId);

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
                        matchRatings && matchRatings[player.id]
                          ? matchRatings[player.id]
                          : {};
                      return (
                        <RatingLineupPlayer
                          key={player.id}
                          player={player}
                          fixture={fixture}
                          playerRating={playerRating}
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
                    matchRatings && matchRatings[player.id]
                      ? matchRatings[player.id]
                      : {};
                  return (
                    <RatingLineupPlayer
                      key={player.id}
                      player={player}
                      fixture={fixture}
                      playerRating={playerRating}
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

  // Calculate ratingScore based on available playerRating
  const ratingScore =
    playerRating && playerRating.totalRating && playerRating.totalSubmits
      ? playerRating.totalRating / playerRating.totalSubmits
      : "na";

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
      {ratingScore !== "na" && (
        <div
          className={`rating-overlay  ${getRatingLineupClass(ratingScore)}`}
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
            {ratingScore !== "na" ? ratingScore.toFixed(2) : "N/A"}
          </span>
        </div>
      )}
    </div>
  ) : (
    <></>
  );
};
