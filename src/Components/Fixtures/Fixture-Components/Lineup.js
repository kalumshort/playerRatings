import React from "react";

import "./Lineup.css"; // Importing external CSS file

import LineupPlayer from "./LineupPlayer";

import useGroupData from "../../../Hooks/useGroupsData";

export default function Lineup({ fixture, showRating }) {
  const { currentGroup } = useGroupData();
  console.log("Current Group in Lineup:", currentGroup);
  const groupClubId = Number(currentGroup?.groupClubId);

  const lineup =
    fixture?.lineups?.find((team) => team.team.id === groupClubId)?.startXI ||
    [];
  const subs =
    fixture?.lineups?.find((team) => team.team.id === groupClubId)
      ?.substitutes || [];

  return (
    <div className="lineup-container containerMargin">
      {lineup.length === 0 ? (
        <div style={{ textAlign: "center" }}>Missing Lineup</div>
      ) : (
        <div style={{ position: "relative" }}>
          <div className="pitch">
            {lineup
              .reduce((rows, { player }) => {
                const [row] = player.grid.split(":").map(Number);

                if (!rows[row]) rows[row] = [];

                rows[row].push(player);

                return rows;
              }, [])
              .reverse() // Reverse the order of rows
              .map((rowPlayers, rowIndex) => (
                <div
                  key={rowIndex}
                  className="row"
                  style={{ gap: "15px", marginBottom: "5px" }}
                >
                  {rowPlayers.map((player) => (
                    <LineupPlayer
                      key={player.id} // Unique key based on player ID
                      player={player}
                      fixture={fixture}
                    />
                  ))}
                </div>
              ))}
          </div>
          <h2
            className="heading2"
            style={{ textAlign: "center", marginTop: "20px" }}
          >
            Substitutes
          </h2>
          <div className="subs-container" style={{ gap: "10px" }}>
            {subs.map((substitute) => (
              <LineupPlayer
                key={substitute.player.id} // Add unique key based on player ID
                player={substitute.player}
                fixture={fixture}
                // className="player-substitute"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
