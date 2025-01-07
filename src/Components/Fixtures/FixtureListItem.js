import React from "react";

export default function FixtureListItem({
  fixture,
  matchTime,
  handleFixtureClick,
}) {
  return (
    <div
      className="fixture-list-item"
      onClick={() => handleFixtureClick(fixture.id)}
    >
      <span className="fixture-teams">
        <span className="fixture-list-teamname">{fixture.teams.home.name}</span>
        {fixture.teams.home.logo && (
          <img
            src={fixture.teams.home.logo}
            alt={`${fixture.teams.home.name} logo`}
            className="team-logo-small"
            style={{ marginLeft: "15px" }}
          />
        )}
        <span
          className="fixture-item-scoreboard"
          style={{
            backgroundColor:
              fixture.fixture.status.short === "NS"
                ? ""
                : fixture.teams.home.id === 33 && fixture.teams.home.winner
                ? "green"
                : fixture.teams.away.id === 33 && fixture.teams.away.winner
                ? "green"
                : !fixture.teams.away.winner && !fixture.teams.home.winner
                ? "grey"
                : "red",
          }}
        >
          {fixture.score.fulltime.home} - {fixture.score.fulltime.away}
        </span>
        {fixture.teams.away.logo && (
          <img
            src={fixture.teams.away.logo}
            alt={`${fixture.teams.away.name} logo`}
            className="team-logo-small"
            style={{ marginRight: "15px" }}
          />
        )}
        <span className="fixture-list-teamname">{fixture.teams.away.name}</span>
      </span>
      <div className="fixture-meta">
        <img
          src={fixture.league.logo}
          alt={`${fixture.league.name} logo`}
          className="league-logo"
        />
        <span className="fixture-time">{matchTime}</span>
      </div>
    </div>
  );
}
