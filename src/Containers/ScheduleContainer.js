import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import {
  selectFixturesState,
  selectLatestFixture,
} from "../Selectors/fixturesSelectors";
import FixtureListItem from "../Components/Fixtures/FixtureListItem";
import { Link, useNavigate } from "react-router-dom";
import { ContentContainer } from "./GlobalContainer";
import { MenuItem, Select } from "@mui/material";

export default function ScheduleContainer({
  limitAroundLatest = 0,
  showLink,
  scroll = true,
}) {
  // Default to no limit (0)
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

  // Get fixtures around the latestFixture
  const latestFixtureIndex = filteredFixures.findIndex(
    (fixture) => fixture.id === latestFixture?.id
  );

  // Get fixtures to display: limit the number of fixtures around the latestFixture
  const limitedFixtures = useMemo(() => {
    if (limitAroundLatest === 0 || latestFixtureIndex === -1) {
      return filteredFixures; // No limit, return all fixtures
    }

    const startIndex = Math.max(0, latestFixtureIndex - limitAroundLatest);
    const endIndex = Math.min(
      filteredFixures.length,
      latestFixtureIndex + limitAroundLatest + 1
    );

    return filteredFixures.slice(startIndex, endIndex);
  }, [filteredFixures, latestFixtureIndex, limitAroundLatest]);

  useEffect(() => {
    if (latestFixture) {
      const index = [...limitedFixtures]
        .reverse()
        .findIndex((fixture) => fixture.id === latestFixture.id);

      if (index !== -1 && fixtureRefs.current[index]) {
        fixtureRefs.current[index].scrollIntoView({
          block: "center",
        });
      }
    }
  }, [latestFixture, limitedFixtures]);

  const handleFixtureClick = (matchId) => {
    navigate(`/fixture/${matchId}`);
  };

  return (
    <ContentContainer className="containerMargin">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "10px 5px",
        }}
      >
        <h2 className="globalHeading">Schedule</h2>
        {!showLink && (
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
        )}
        {showLink && (
          <Link to="/schedule">
            <p
              style={{
                fontSize: "14px",
                padding: "0px",
                margin: "0px",
                color: "grey",
                textDecoration: "underline",
              }}
            >
              See All
            </p>
          </Link>
        )}
      </div>
      <div>
        <div
          style={{ maxHeight: "70vh", overflowY: scroll ? "scroll" : "none" }}
        >
          {[...limitedFixtures].reverse().map((fixture, index) => {
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
      </div>
    </ContentContainer>
  );
}
