import React from "react";
import { ContentContainer } from "../../Containers/GlobalContainer";
import { CountdownTimer } from "../../Hooks/Helper_Functions";
import FixtureEventsList from "./FixtureEventsList";
import { Paper } from "@mui/material";
import PenaltyTimeline from "./Fixture-Components/PenaltyTimeline";
import { useFixtureGradientProvider } from "../../Providers/FixtureGradientProvider";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
export default function FixtureHeader({
  fixture,
  onClick,
  showDate = false,
  showDetails = false,
  showScorers = false,
  addClass,
}) {
  const homeTeamId = fixture.teams.home.id;
  const awayTeamId = fixture.teams.away.id;

  const { fixtureGradient } = useFixtureGradientProvider() || {};

  const homeEvents = fixture?.events?.filter(
    (event) => event.team.id === homeTeamId
  );
  const awayEvents = fixture?.events?.filter(
    (event) => event.team.id === awayTeamId
  );
  const penaltyEvents = fixture?.events?.filter(
    (event) => event.comments === "Penalty Shootout"
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

  const inPlay = ["1H", "2H", "ET", "P"].includes(fixture.fixture.status.short);

  return (
    <>
      <ContentContainer className={`fixture-header-outer ${addClass}`}>
        <div
          style={{
            background: fixtureGradient,
            padding: "5px",
            cursor: onClick && "pointer",
          }}
          onClick={() => (onClick ? onClick(fixture.id) : null)}
        >
          <ContentContainer className="fixture-header">
            {onClick && <ArrowForwardOutlinedIcon className="headerExpand" />}
            {inPlay && (
              <div
                style={{
                  position: "absolute",
                  top: "2%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  color: "#4EFF4E",
                  padding: "2px 4px",
                  borderRadius: "12px",
                  fontSize: "8px",
                  fontWeight: "bold",
                }}
              >
                Live
              </div>
            )}
            {showDate && !inPlay && (
              <div className="fixture-time-header">{matchTime}</div>
            )}
            <div className="team-container">
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
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
                {fixture?.fixture?.status?.short === "TBD" ? (
                  <div className="fixture-status-container">
                    {" "}
                    <span className="fixture-status-short">
                      {fixture.fixture.status.short}
                    </span>
                  </div>
                ) : (
                  <div className="fixture-status-container">
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
                    {fixture.score.penalty.home !== null && (
                      <span className="halftime-scoreboard">
                        Penalty: {fixture.score.penalty.home}-
                        {fixture.score.penalty.away}
                      </span>
                    )}
                    {fixture.score.halftime.home !== null && (
                      <span className="halftime-scoreboard">
                        Halftime: {fixture.score.halftime.home}-
                        {fixture.score.halftime.away}
                      </span>
                    )}
                  </div>
                )}
              </>
            )}
            <div className="team-container">
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "15px",
                }}
              >
                <img
                  src={fixture.teams.away.logo}
                  alt={`${fixture.teams.away.name} logo`}
                  className="team-logo"
                />
                <span className="team-name">{fixture.teams.away.name}</span>
              </div>
            </div>
          </ContentContainer>
        </div>
        {showScorers && (
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
        )}
        {fixture.score.penalty.home && (
          <PenaltyTimeline penaltyEvents={penaltyEvents} />
        )}
        {showDetails && (
          <p
            className="match-small-details-text"
            style={{ textAlign: "center", fontSize: "10px", color: "grey" }}
          >
            <span style={{ fontWeight: "900" }}>Kick Off: {matchTimeHour}</span>{" "}
            | {matchTimeDay}
            <br></br>
            {fixture.fixture.venue.name}, {fixture.fixture.venue.city} |
            Referee: {fixture.fixture.referee}
          </p>
        )}
      </ContentContainer>
      <span></span>
    </>
  );
}
