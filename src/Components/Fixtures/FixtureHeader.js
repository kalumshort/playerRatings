import React from "react";
import { ContentContainer } from "../../Containers/GlobalContainer";
import {
  CountdownTimer,
  footballClubsColours,
} from "../../Hooks/Helper_Functions";
import FixtureEventsList from "./FixtureEventsList";
import { Paper } from "@mui/material";

export default function FixtureHeader({ fixture, onClick, showDate = false }) {
  const footballClubsColors = footballClubsColours;

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
  const matchTimeDay = new Date(
    fixture.fixture.timestamp * 1000
  ).toLocaleString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const matchTimeHour = new Date(
    fixture.fixture.timestamp * 1000
  ).toLocaleString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <ContentContainer className="fixture-header-outer">
      <div
        className="fixture-header"
        style={{
          background: `linear-gradient(95deg, ${footballClubsColors[homeTeamId]} 40%, ${footballClubsColors[awayTeamId]} 60%)`,
        }}
        onClick={() => (onClick ? onClick(fixture.id) : null)}
      >
        {showDate && <div className="fixture-time-header">{matchTime}</div>}

        <div className="team-container">
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
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
          <>
            <Paper className="fixture-status-container">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-evenly",
                  width: "100%",
                }}
              >
                {fixture.fixture.status.short !== "NS" && (
                  <span className="fixture-status-short">
                    {fixture.fixture.status.short}
                  </span>
                )}
                <span className="fixture-status-short">
                  {fixture.fixture.status.elapsed}'
                </span>
              </div>

              <span className="scoreboard">
                {fixture.goals.home} - {fixture.goals.away}
              </span>
              {fixture.score.halftime.home !== null && (
                <span className="halftime-scoreboard">
                  Halftime: {fixture.score.halftime.home}-
                  {fixture.score.halftime.away}
                </span>
              )}
            </Paper>
          </>
        )}

        <div className="team-container">
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <img
              src={fixture.teams.away.logo}
              alt={`${fixture.teams.away.name} logo`}
              className="team-logo"
            />
            <span className="team-name">{fixture.teams.away.name}</span>
          </div>
        </div>
      </div>
      <div className="scorers-Contianer">
        {homeEvents && (
          <FixtureEventsList
            events={homeEvents}
            eventTypes={["Goal"]}
            textAlign={"right"}
            goalAlign="Right"
          />
        )}
        {awayEvents && (
          <FixtureEventsList events={awayEvents} eventTypes={["Goal"]} />
        )}
      </div>
      <div className="match-small-details">
        <p
          className="match-small-details-text"
          style={{ textAlign: "center", fontSize: "10px", color: "grey" }}
        >
          <span style={{ fontWeight: "900" }}>Kick Off: {matchTimeHour}</span>
          <br></br>
          {matchTimeDay}
          <br></br>
          {fixture.fixture.venue.name}, {fixture.fixture.venue.city}
          <br></br>
          Referee: {fixture.fixture.referee}
        </p>
      </div>
    </ContentContainer>
  );
}
