import React from "react";

import "./Lineup.css"; // Importing external CSS file
import { ContentContainer } from "../../../Containers/GlobalContainer";
import LineupPlayer from "./LineupPlayer";

import LineupPredictor from "./LineupPredicter/LineupPredictor";

export default function Lineup({ fixture }) {
  const unitedLineup =
    fixture.lineups.find((team) => team.team.id === 33)?.startXI || [];
  const unitedSubs =
    fixture.lineups.find((team) => team.team.id === 33)?.substitutes || [];

  return (
    <div className="lineup-container">
      <div style={{ position: "relative" }}>
        <div className="pitch">
          {unitedLineup
            .reduce((rows, { player }) => {
              const [row, col] = player.grid.split(":").map(Number);

              if (!rows[row]) rows[row] = [];

              rows[row].push(player);

              return rows;
            }, [])
            .map((rowPlayers, rowIndex) => (
              <div key={rowIndex} className="row">
                {rowPlayers.map((player) => (
                  <LineupPlayer player={player} fixture={fixture} />
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
        <div className="subs-container">
          {unitedSubs.map((substitute) => (
            <LineupPlayer
              player={substitute.player}
              fixture={fixture}
              // className="player-substitute"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
