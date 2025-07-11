import React, { useEffect } from "react";

import { useDispatch, useSelector } from "react-redux";
import { useIsMobile } from "../Hooks/Helper_Functions";
import { fetchFixtures } from "../Hooks/Fixtures_Hooks";
import LatestFixtureItem from "../Components/Fixtures/LatestFixtureItem";
import ScheduleContainer from "./ScheduleContainer";
import LatestTeamSeasonRating from "../Components/Widgets/LatestTeamSeasonRating";
import "./HomePage.css"; // Make sure to import the new CSS

export default function GroupHomePage() {
  const { fixtures, loading, error } = useSelector((state) => state.fixtures);
  const isMobile = useIsMobile();

  const dispatch = useDispatch();

  useEffect(() => {
    if (!fixtures) {
      console.log("Fetching fixtures... In GroupHomePage");
      dispatch(fetchFixtures());
    }
  }, [dispatch, fixtures]);

  if (loading) return <p>Loading fixtures...</p>;
  if (error) return <p>Error: {error}</p>;
  return (
    <div>
      <LatestFixtureItem />
      <div className="schedule-season-container">
        <ScheduleContainer
          limitAroundLatest={isMobile ? 2 : 3}
          showLink={true}
          scroll={false}
          scrollOnLoad={false}
        />
        <LatestTeamSeasonRating />
      </div>
    </div>
  );
}
