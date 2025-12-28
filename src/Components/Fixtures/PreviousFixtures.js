import React, { useMemo, useState } from "react";
import { ContentContainer } from "../../Containers/GlobalContainer";
import { useSelector } from "react-redux";
import { selectPreviousFixtures } from "../../Selectors/fixturesSelectors";
import { Link } from "react-router-dom";
import FixtureListItem from "./FixtureListItem";
import { MenuItem, Select } from "@mui/material";
import { useAppPaths, useIsMobile } from "../../Hooks/Helper_Functions";
import { useAppNavigate } from "../../Hooks/useAppNavigate";

export default function PreviousFixtures() {
  const isMobile = useIsMobile();
  const { getPath } = useAppPaths();
  const previousFixtures = useSelector(selectPreviousFixtures);
  const appNavigate = useAppNavigate();
  const [selectedLeague, setSelectedLeague] = useState("");
  const handleFixtureClick = (matchId) => {
    appNavigate(`/fixture/${matchId}`);
  };
  const handleChange = (event) => {
    setSelectedLeague(event.target.value);
  };
  const leagueOptions = useMemo(() => {
    return [...new Set(previousFixtures?.map((item) => item.league.name))];
  }, [previousFixtures]);

  if (!previousFixtures || previousFixtures.length === 0) {
    return <div className="latest-fixture-container">No previous fixture</div>;
  }

  const filteredFixures = selectedLeague
    ? previousFixtures.filter((item) => item.league.name === selectedLeague)
    : previousFixtures;

  const slicedFixtures = isMobile
    ? filteredFixures.slice(0, 3)
    : filteredFixures;
  return (
    <ContentContainer>
      <div className="fixtures-list-header">
        <h2 className="globalHeading">Results</h2>
        {!isMobile && (
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
        {isMobile && (
          <Link to={getPath("/schedule")}>
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
      <div className="previous-fixtures-list fixturesListContainer">
        {slicedFixtures.map((fixture, index) => {
          const matchTime = new Date(
            fixture.fixture.timestamp * 1000
          ).toLocaleDateString("en-GB", {
            weekday: "short",
            day: "numeric",
            month: "short",
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
      </div>
    </ContentContainer>
  );
}
