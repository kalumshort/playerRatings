import React from "react";
import { useSelector } from "react-redux";
import { selectLatestFixture } from "../../Selectors/fixturesSelectors";
import "./fixtures.css";

import { useNavigate } from "react-router-dom";

import FixtureHeader from "./FixtureHeader";
import { FixtureGradientProvider } from "../../Providers/FixtureGradientProvider";
import { footballClubsColours } from "../../Hooks/Helper_Functions";
import { ContentContainer } from "../../Containers/GlobalContainer";

export default function LatestFixtureItem() {
  const footballClubsColors = footballClubsColours;

  const latestFixture = useSelector(selectLatestFixture);

  const navigate = useNavigate();
  if (!latestFixture) {
    return (
      <div
        className="latest-fixture-container"
        style={{ marginBottom: "20px" }}
      >
        <ContentContainer style={{ padding: "20px" }}>
          <h2 className="globalHeading">No Upcoming Matches </h2>
        </ContentContainer>
      </div>
    );
  }
  const homeTeamId = latestFixture.teams.home.id;
  const awayTeamId = latestFixture.teams.away.id;

  const homeTeamColour = footballClubsColors[homeTeamId];
  const awayTeamColour = footballClubsColors[awayTeamId];

  const fixtureGradient = `linear-gradient(95deg, ${homeTeamColour} 40%, ${awayTeamColour} 60%)`;

  const handleFixtureClick = (matchId) => {
    navigate(`/fixture/${matchId}`);
  };

  return (
    <FixtureGradientProvider
      value={{
        fixtureGradient: fixtureGradient,
        homeTeamColour: homeTeamColour,
        awayTeamColour: awayTeamColour,
      }}
    >
      <FixtureHeader
        fixture={latestFixture}
        onClick={handleFixtureClick}
        showDate={true}
      />
    </FixtureGradientProvider>
  );
}
