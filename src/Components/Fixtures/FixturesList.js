import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchFixtures } from "../../Hooks/Fixtures_Hooks";
import LatestFixtureItem from "./LatestFixtureItem";
import UpcomingFixtures from "./UpcomingFixtures";
import PreviousFixtures from "./PreviousFixtures";

export default function FixturesList() {
  const { previousFixtures, upcomingFixtures, latestFixture, loading, error } =
    useSelector((state) => state.fixtures);

  const dispatch = useDispatch();

  useEffect(() => {
    if (
      !previousFixtures.length &&
      !upcomingFixtures.length &&
      !latestFixture
    ) {
      dispatch(fetchFixtures());
    }
  }, [dispatch, previousFixtures, upcomingFixtures, latestFixture]);

  if (loading) return <p>Loading fixtures...</p>;
  if (error) return <p>Error: {error}</p>;
  return (
    <div className="fixtures-container">
      <LatestFixtureItem />
      <div className="prev-upcom-container containerMargin">
        <PreviousFixtures />
        <UpcomingFixtures />
      </div>
    </div>
  );
}
