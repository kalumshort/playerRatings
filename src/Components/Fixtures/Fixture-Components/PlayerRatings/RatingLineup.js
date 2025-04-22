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

  // const [ratingSrc, setRatingSrc] = useState("Global");

  const groupClubId = Number(activeGroup.groupClubId);

  const lineup =
    fixture?.lineups?.find((team) => team.team.id === groupClubId)?.startXI ||
    [];

  const substitutedPlayerIds = fixture?.events
    .filter((item) => item.type === "subst" && item.team?.id === groupClubId)
    .map((item) => item.player);

  // const handleChange = (event) => {
  //   setRatingSrc(event.target.value);
  // };
  return (
    <div className="containerMargin">
      <ContentContainer
        className="lineup-container"
        style={{ padding: "15px 5px", position: "relative" }}
      >
        {/* <div style={{ position: "absolute", top: "5px", right: "5px" }}>
          <Select
            value={ratingSrc}
            onChange={handleChange}
            size="small"
            variant="standard"
          >
            <MenuItem key="" value="Global">
              Global
            </MenuItem>
            <MenuItem key="" value="Personal">
              Personal
            </MenuItem>
          </Select>
        </div> */}
        <div style={{ position: "relative" }}>
          <div className="pitch">
            {lineup
              .reduce((rows, { player }) => {
                const [row] = player.grid.split(":").map(Number);

                if (!rows[row]) rows[row] = [];

                rows[row].push(player);

                return rows;
              }, [])
              .map((rowPlayers, rowIndex) => (
                <div key={rowIndex} className="row">
                  {rowPlayers.map((player) => (
                    <RatingLineupPlayer
                      key={player.id} // Add unique key based on player ID
                      player={player}
                      fixture={fixture}
                      playerRating={matchRatings[player.id]}
                    />
                  ))}
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
            <div style={{ display: "flex" }}>
              {substitutedPlayerIds.map((player) => (
                <RatingLineupPlayer
                  key={player.id} // Add unique key based on player ID
                  player={player}
                  fixture={fixture}
                  playerRating={matchRatings[player.id]}
                />
              ))}
            </div>
          </div>
        </div>
      </ContentContainer>
    </div>
  );
}

const RatingLineupPlayer = ({ player, className, playerRating }) => {
  const playerData = useSelector(selectSquadPlayerById(player?.id));
  // Filter: Goals scored by the player
  const ratingScore = playerRating
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
            {ratingScore.toFixed(2)}
            {/* <br></br>
            <span style={{ fontSize: "12px" }}>{player.name}</span> */}
          </span>
        </div>
      )}
      {/* {showPlayerName && (
        <span
          className="lineup-player-name"
          style={{
            position: "absolute",
            bottom: 5,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          {playerData?.name || player.name}
        </span>
      )} */}
    </div>
  ) : (
    <></>
  );
};
