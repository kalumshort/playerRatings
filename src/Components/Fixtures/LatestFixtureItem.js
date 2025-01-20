import React from "react";
import { useSelector } from "react-redux";
import { selectLatestFixture } from "../../Selectors/fixturesSelectors";
import "./fixtures.css";

import { useNavigate } from "react-router-dom";

import FixtureHeader from "./FixtureHeader";

export default function LatestFixtureItem() {
  const latestFixture = useSelector(selectLatestFixture);
  const navigate = useNavigate();

  const handleFixtureClick = (matchId) => {
    navigate(`/fixture/${matchId}`);
  };

  if (!latestFixture) {
    return <div className="latest-fixture-container">No upcoming fixture</div>;
  }

  return (
    <FixtureHeader
      fixture={latestFixture}
      onClick={handleFixtureClick}
      showDate={true}
    />
  );
}
