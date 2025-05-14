import React from "react";
import { ContentContainer } from "../../Containers/GlobalContainer";
import { useSelector } from "react-redux";
import { selectPreviousFixtures } from "../../Selectors/fixturesSelectors";
import { RatingLineupPlayer } from "../Fixtures/Fixture-Components/PlayerRatings/RatingLineup";
import { selectAllPlayersSeasonOverallRating } from "../../Selectors/selectors";
import Spinner from "../../Containers/Helpers";
import useGroupData from "../../Hooks/useGroupsData";
import { Link } from "react-router-dom";

export default function LatestTeamSeasonRating() {
  const previousFixture = useSelector(selectPreviousFixtures)[0];
  const playerStats = useSelector(selectAllPlayersSeasonOverallRating);
  const { activeGroup } = useGroupData();

  const groupClubId = Number(activeGroup.groupClubId);
  const lineup =
    previousFixture?.lineups?.find((team) => team.team.id === groupClubId)
      ?.startXI || [];

  if (!previousFixture && !playerStats) {
    return <Spinner />;
  }

  return (
    <ContentContainer className="containerMargin" style={{ padding: "10px " }}>
      <h2 className="globalHeading">Previous XI Seasons Rating</h2>

      <div className="pitch" style={{ marginTop: "10px" }}>
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
                    playerStats?.[player.id]?.totalRating &&
                    playerStats?.[player.id]?.totalSubmits
                      ? playerStats[player.id].totalRating /
                        playerStats[player.id].totalSubmits
                      : null;

                  return (
                    <RatingLineupPlayer
                      key={player.id}
                      player={player}
                      fixture={previousFixture}
                      playerRating={playerRating?.toFixed(2) || "na"}
                    />
                  );
                })}
              </div>
            ))}
      </div>
      <div style={{ textAlign: "right" }}>
        <Link to="/season-stats">
          <p
            style={{
              fontSize: "14px",
              padding: "0px",
              margin: "0px",
              color: "grey",
              textDecoration: "underline",
            }}
          >
            See All Players
          </p>
        </Link>
      </div>
    </ContentContainer>
  );
}
