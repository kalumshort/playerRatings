import React, { useMemo, useState } from "react";
import { ContentContainer } from "../../Containers/GlobalContainer";
import { useSelector } from "react-redux";
import { selectUpcomingFixtures } from "../../Selectors/fixturesSelectors";
import { Link, useNavigate } from "react-router-dom";
import FixtureListItem from "./FixtureListItem";
import { MenuItem, Select } from "@mui/material";
import { useIsMobile } from "../../Hooks/Helper_Functions";

export default function UpcomingFixtures() {
  const isMobile = useIsMobile();

  const upcomingFixtures = useSelector(selectUpcomingFixtures);
  const navigate = useNavigate();
  const [selectedLeague, setSelectedLeague] = useState("");

  const handleFixtureClick = (matchId) => {
    navigate(`/fixture/${matchId}`);
  };
  const handleChange = (event) => {
    setSelectedLeague(event.target.value);
  };
  const leagueOptions = useMemo(() => {
    return [...new Set(upcomingFixtures?.map((item) => item.league.name))];
  }, [upcomingFixtures]);

  if (!upcomingFixtures) {
    return <div className="latest-fixture-container">No upcoming fixture</div>;
  }

  const filteredFixures = selectedLeague
    ? upcomingFixtures.filter((item) => item.league.name === selectedLeague)
    : upcomingFixtures;

  const slicedFixtures = isMobile
    ? filteredFixures.slice(0, 3)
    : filteredFixures;

  return (
    <ContentContainer>
      <div className="fixtures-list-header">
        <h2 className="globalHeading">Fixtures</h2>
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
      <div className="upcoming-fixtures-list fixturesListContainer">
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
