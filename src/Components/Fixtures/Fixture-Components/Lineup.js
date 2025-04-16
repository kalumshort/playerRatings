import React from "react";

import "./Lineup.css"; // Importing external CSS file

import LineupPlayer from "./LineupPlayer";
import useGroupData from "../../../Hooks/useGroupsData";
import { useSelector } from "react-redux";
import { selectMatchRatingsById } from "../../../Selectors/selectors";

export default function Lineup({ fixture, showRating }) {
  const { activeGroup } = useGroupData();

  const matchRatings = useSelector(selectMatchRatingsById(fixture.id));

  const groupClubId = Number(activeGroup.groupClubId);
  const lineup =
    fixture?.lineups?.find((team) => team.team.id === groupClubId)?.startXI ||
    [];
  const subs =
    fixture?.lineups?.find((team) => team.team.id === groupClubId)
      ?.substitutes || [];

  return (
    <div className="lineup-container containerMargin">
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
                  <LineupPlayer
                    key={player.id} // Add unique key based on player ID
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
        <div className="subs-container">
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
    </div>
  );
}
