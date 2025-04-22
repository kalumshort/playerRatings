import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import {
  selectFixturesState,
  selectLatestFixture,
} from "../Selectors/fixturesSelectors";
import FixtureListItem from "../Components/Fixtures/FixtureListItem";
import { useNavigate } from "react-router-dom";
import { ContentContainer } from "./GlobalContainer";
import { MenuItem, Select } from "@mui/material";

export default function ScheduleContainer() {
  const navigate = useNavigate();

  const allFixtures = useSelector(selectFixturesState).fixtures;
  const latestFixture = useSelector(selectLatestFixture);

  const [selectedLeague, setSelectedLeague] = useState("");

  const handleChange = (event) => {
    setSelectedLeague(event.target.value);
  };

  // Create a ref array for the fixture elements
  const fixtureRefs = useRef([]);

  const leagueOptions = useMemo(() => {
    return [...new Set(allFixtures?.map((item) => item.league.name))];
  }, [allFixtures]);

  const filteredFixures = selectedLeague
    ? allFixtures.filter((item) => item.league.name === selectedLeague)
    : allFixtures;

  useEffect(() => {
    if (latestFixture) {
      const index = [...filteredFixures]
        .reverse()
        .findIndex((fixture) => fixture.id === latestFixture.id);

      if (index !== -1 && fixtureRefs.current[index]) {
        fixtureRefs.current[index].scrollIntoView({
          block: "center",
        });
      }
    }
  }, [latestFixture, filteredFixures]);
  const handleFixtureClick = (matchId) => {
    navigate(`/fixture/${matchId}`);
  };
  return (
    <>
      <div
        className="containerMargin"
        style={{ display: "flex", justifyContent: "space-between" }}
      >
        <h2 className="globalHeading">Schedule</h2>
        <Select
          value={selectedLeague}
          onChange={handleChange}
          size="small"
          variant="standard"
          displayEmpty
          renderValue={(selected) => (selected ? selected : "All")}
        >
          <MenuItem key="" value="">
            All
          </MenuItem>
          {leagueOptions.map((league) => (
            <MenuItem key={league} value={league}>
              {league}
            </MenuItem>
          ))}
        </Select>
      </div>
      <ContentContainer className="containerMargin">
        <div style={{ maxHeight: "70vh", overflowY: "scroll" }}>
          {[...filteredFixures].reverse().map((fixture, index) => {
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
