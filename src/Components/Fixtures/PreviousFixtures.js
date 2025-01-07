import React from "react";
import { ContentContainer } from "../../Containers/GlobalContainer";
import { useSelector } from "react-redux";
import { selectPreviousFixtures } from "../../Selectors/fixturesSelectors";
import { useNavigate } from "react-router-dom";
import FixtureListItem from "./FixtureListItem";

export default function PreviousFixtures() {
  const previousFixtures = useSelector(selectPreviousFixtures);
  const navigate = useNavigate();

  const handleFixtureClick = (matchId) => {
    navigate(`/fixture/${matchId}`);
  };

  if (!previousFixtures || previousFixtures.length === 0) {
    return <div className="latest-fixture-container">No previous fixture</div>;
  }

  return (
    <ContentContainer className="fixtures-list previous-fixtures-list">
      <h2 className="heading2" style={{ textAlign: "center" }}>
        Results
      </h2>
      {previousFixtures.map((fixture, index) => {
        const matchTime = new Date(
          fixture.fixture.timestamp * 1000
        ).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "numeric",
          year: "2-digit",
        });
        return (
          <FixtureListItem
            key={fixture.id || index}
            fixture={fixture}
            matchTime={matchTime}
            handleFixtureClick={handleFixtureClick}
          />
        );
      })}
    </ContentContainer>
  );
}
