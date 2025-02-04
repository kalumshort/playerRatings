import React from "react";
import { useSelector } from "react-redux";
import { selectLatestFixture } from "../../Selectors/fixturesSelectors";
import "./fixtures.css";

import { useNavigate } from "react-router-dom";

import FixtureHeader from "./FixtureHeader";
import { FixtureGradientProvider } from "../../Providers/FixtureGradientProvider";
import { footballClubsColours } from "../../Hooks/Helper_Functions";

export default function LatestFixtureItem() {
  const footballClubsColors = footballClubsColours;

  const latestFixture = useSelector(selectLatestFixture);
  const navigate = useNavigate();

  const homeTeamId = latestFixture.teams.home.id;
  const awayTeamId = latestFixture.teams.away.id;

  const homeTeamColour = footballClubsColors[homeTeamId];
  const awayTeamColour = footballClubsColors[awayTeamId];

  const fixtureGradient = `linear-gradient(95deg, ${homeTeamColour} 40%, ${awayTeamColour} 60%)`;

  const handleFixtureClick = (matchId) => {
    navigate(`/fixture/${matchId}`);
  };

  if (!latestFixture) {
    return <div className="latest-fixture-container">No upcoming fixture</div>;
  }

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
