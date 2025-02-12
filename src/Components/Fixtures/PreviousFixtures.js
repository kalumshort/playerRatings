import React, { useMemo, useState } from "react";
import { ContentContainer } from "../../Containers/GlobalContainer";
import { useSelector } from "react-redux";
import { selectPreviousFixtures } from "../../Selectors/fixturesSelectors";
import { useNavigate } from "react-router-dom";
import FixtureListItem from "./FixtureListItem";
import { MenuItem, Select } from "@mui/material";

export default function PreviousFixtures() {
  const previousFixtures = useSelector(selectPreviousFixtures);
  const navigate = useNavigate();
  const [selectedLeague, setSelectedLeague] = useState("");

  const handleFixtureClick = (matchId) => {
    navigate(`/fixture/${matchId}`);
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

  return (
    <ContentContainer>
      <div className="fixtures-list-header">
        <h2 className="globalHeading">Results</h2>
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
      <div className="previous-fixtures-list">
        {filteredFixures.map((fixture, index) => {
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
