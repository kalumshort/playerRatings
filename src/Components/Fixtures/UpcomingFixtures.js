import React from "react";
import { ContentContainer } from "../../Containers/GlobalContainer";
import { useSelector } from "react-redux";
import { selectUpcomingFixtures } from "../../Selectors/fixturesSelectors";
import { useNavigate } from "react-router-dom";
import FixtureListItem from "./FixtureListItem";

export default function UpcomingFixtures() {
  const upcomingFixtures = useSelector(selectUpcomingFixtures);
  const navigate = useNavigate();

  const handleFixtureClick = (matchId) => {
    navigate(`/fixture/${matchId}`);
  };

  if (!upcomingFixtures) {
    return <div className="latest-fixture-container">No upcoming fixture</div>;
  }

  return (
    <ContentContainer className="fixtures-list upcoming-fixtures-list">
      <h2 className="heading2" style={{ textAlign: "center" }}>
        Fixtures
      </h2>
      {upcomingFixtures.map((fixture, index) => {
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
