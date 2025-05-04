import React from "react";
import useGroupData from "../../Hooks/useGroupsData";

export default function FixtureListItem({
  fixture,
  matchTime,
  handleFixtureClick,
}) {
  const { activeGroup } = useGroupData();

  const groupClubId = Number(activeGroup.groupClubId);

  return (
    <div
      className="fixture-list-item"
      onClick={() => handleFixtureClick(fixture.id)}
    >
      <span className="fixture-teams">
        <span className="fixture-team fixture-team-home">
          <span className="fixture-list-teamname">
            {fixture.teams.home.name}
          </span>
          {fixture.teams.home.logo && (
            <img
              src={fixture.teams.home.logo}
              alt={`${fixture.teams.home.name} logo`}
              className="team-logo-small"
            />
          )}
        </span>

        <span
          className={`fixture-item-scoreboard ${
            fixture.fixture.status.short === "NS" ||
            fixture.fixture.status.short === "TBD"
              ? "result-scoreboard-pending"
              : fixture.teams.home.id === groupClubId &&
                fixture.teams.home.winner
              ? "result-scoreboard-win"
              : fixture.teams.away.id === groupClubId &&
                fixture.teams.away.winner
              ? "result-scoreboard-win"
              : !fixture.teams.away.winner && !fixture.teams.home.winner
              ? "result-scoreboard-draw"
              : "result-scoreboard-loss"
          }`}
        >
          {fixture.goals.home} - {fixture.goals.away}
        </span>

        <span className="fixture-team fixture-team-away">
          {fixture.teams.away.logo && (
            <img
              src={fixture.teams.away.logo}
              alt={`${fixture.teams.away.name} logo`}
              className="team-logo-small"
            />
          )}
          <span className="fixture-list-teamname">
            {fixture.teams.away.name}
          </span>
        </span>
      </span>

      <div className="fixture-list-item-league">
        <span>{fixture.league.name}</span>
        {/* <img
          src={fixture.league.logo}
          alt={`${fixture.league.name} logo`}
          className="league-logo"
        /> */}
      </div>
      <span className="fixture-time">{matchTime}</span>
    </div>
  );
}
