import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import {
  selectFixturesState,
  selectLatestFixture,
} from "../Selectors/fixturesSelectors";
import FixtureListItem from "../Components/Fixtures/FixtureListItem";
import { useNavigate } from "react-router-dom";
import { ContentContainer } from "./GlobalContainer";

export default function ScheduleContainer() {
  const navigate = useNavigate();

  const upcomingFixtures = useSelector(selectFixturesState).fixtures;
  const latestFixture = useSelector(selectLatestFixture);

  // Create a ref array for the fixture elements
  const fixtureRefs = useRef([]);

  // Use useEffect to scroll to the latest fixture
  useEffect(() => {
    if (latestFixture) {
      const index = [...upcomingFixtures]
        .reverse()
        .findIndex((fixture) => fixture.id === latestFixture.id);

      if (index !== -1 && fixtureRefs.current[index]) {
        fixtureRefs.current[index].scrollIntoView({
          block: "center", // Align it at the top of the container
        });
      }
    }
  }, [latestFixture, upcomingFixtures]); // Re-run when the fixtures change
  const handleFixtureClick = (matchId) => {
    navigate(`/fixture/${matchId}`);
  };
  return (
    <>
      <div className="containerMargin">
        <h2 className="globalHeading">Schedule</h2>
      </div>
      <ContentContainer className="containerMargin">
        <div style={{ maxHeight: "70vh", overflowY: "scroll" }}>
          {[...upcomingFixtures].reverse().map((fixture, index) => {
            const matchTime = new Date(
              fixture.fixture.timestamp * 1000
            ).toLocaleDateString("en-GB", {
              weekday: "short",
              day: "numeric",
              month: "short",
            });

            return (
              <div
                key={fixture.id || index}
                ref={(el) => (fixtureRefs.current[index] = el)} // Store reference to each fixture
              >
                <FixtureListItem
                  fixture={fixture}
                  matchTime={matchTime}
                  handleFixtureClick={handleFixtureClick}
                />
              </div>
            );
          })}
        </div>
      </ContentContainer>
    </>
  );
}
