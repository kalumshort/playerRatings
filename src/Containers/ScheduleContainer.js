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
  scrollOnLoad = true,
}) {
  const navigate = useNavigate();

  const allFixtures = useSelector(selectFixturesState).fixtures;
  const latestFixture = useSelector(selectLatestFixture);

  const [selectedLeague, setSelectedLeague] = useState("");

  const handleChange = (event) => {
    setSelectedLeague(event.target.value);
  };

  const fixtureRefs = useRef([]);
  const containerRef = useRef(null);

  const leagueOptions = useMemo(() => {
    return [...new Set(allFixtures?.map((item) => item.league.name))];
  }, [allFixtures]);

  const filteredFixures = selectedLeague
    ? allFixtures.filter((item) => item.league.name === selectedLeague)
    : allFixtures;

  const latestFixtureIndex = filteredFixures.findIndex(
    (fixture) => fixture.id === latestFixture?.id
  );

  const limitedFixtures = useMemo(() => {
    if (limitAroundLatest === 0 || latestFixtureIndex === -1) {
      return filteredFixures;
    }

    const startIndex = Math.max(0, latestFixtureIndex - limitAroundLatest);
    const endIndex = Math.min(
      filteredFixures.length,
      latestFixtureIndex + limitAroundLatest + 1
    );

    return filteredFixures.slice(startIndex, endIndex);
  }, [filteredFixures, latestFixtureIndex, limitAroundLatest]);

  useEffect(() => {
    if (latestFixture && scrollOnLoad && containerRef.current) {
      const index = [...limitedFixtures]
        .reverse()
        .findIndex((fixture) => fixture.id === latestFixture.id);

      const container = containerRef.current;
      const target = fixtureRefs.current[index];

      if (index !== -1 && target) {
        const containerRect = container.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();

        const offset = targetRect.top - containerRect.top;

        container.scrollTo({
          top:
            container.scrollTop +
            offset -
            container.clientHeight / 2 +
            target.clientHeight / 2,
        });
      }
    }
  }, [latestFixture, limitedFixtures, scrollOnLoad]);

  const handleFixtureClick = (matchId) => {
    navigate(`/fixture/${matchId}`);
  };

  return (
    <ContentContainer>
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
          ref={containerRef}
          style={{ maxHeight: "70vh", overflowY: scroll ? "scroll" : "hidden" }}
        >
          {(fixtureRefs.current = []) &&
            [...limitedFixtures].reverse().map((fixture, index) => {
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
                  ref={(el) => (fixtureRefs.current[index] = el)}
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
