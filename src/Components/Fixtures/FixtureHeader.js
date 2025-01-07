import React from "react";
import { ContentContainer } from "../../Containers/GlobalContainer";
import CountdownTimer from "../../Hooks/Helper_Functions";
import FixtureEventsList from "./FixtureEventsList";

export default function FixtureHeader({ fixture, onClick }) {
  const homeTeamId = fixture.teams.home.id;
  const awayTeamId = fixture.teams.away.id;

  const homeEvents = fixture?.events?.filter(
    (event) => event.team.id === homeTeamId
  );
  const awayEvents = fixture?.events?.filter(
    (event) => event.team.id === awayTeamId
  );

  const matchTime = new Date(fixture.fixture.timestamp * 1000).toLocaleString(
    "en-GB",
    {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
  return (
    <ContentContainer
      className="fixture-header"
      onClick={() => (onClick ? onClick(fixture.id) : null)}
    >
      <div className="fixture-time-header">{matchTime}</div>

      <div className="team-container">
        {homeEvents && (
          <FixtureEventsList
            events={homeEvents}
            eventTypes={["Goal"]}
            textAlign="right"
          />
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <img
            src={fixture.teams.home.logo}
            alt={`${fixture.teams.home.name} logo`}
            className="team-logo"
          />
          <span className="team-name">{fixture.teams.home.name}</span>
        </div>
      </div>

      {fixture.fixture.status.short === "NS" ? (
        <CountdownTimer targetTime={fixture.fixture.timestamp} />
      ) : (
        <div className="fixture-status-container">
          {fixture.fixture.status.short === "HT" ||
            (fixture.fixture.status.short === "FT" && (
              <span style={{ fontStyle: "italic" }}>
                {fixture.fixture.status.short}
              </span>
            ))}

          <span className="fixture-status-short">
            {fixture.fixture.status.elapsed}'
          </span>

          <span className="scoreboard">
            {fixture.goals.home} - {fixture.goals.away}
          </span>
          {fixture.score.halftime.home !== null && (
            <span className="halftime-scoreboard">
              Halftime: {fixture.score.halftime.home} -{" "}
              {fixture.score.halftime.away}
            </span>
          )}
        </div>
      )}

      <div className="team-container">
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <img
            src={fixture.teams.away.logo}
            alt={`${fixture.teams.away.name} logo`}
            className="team-logo"
          />
          <span className="team-name">{fixture.teams.away.name}</span>
        </div>

        {awayEvents && (
          <FixtureEventsList
            events={awayEvents}
            eventTypes={["Goal"]}
            textAlign="left"
          />
        )}
      </div>
    </ContentContainer>
  );
}
