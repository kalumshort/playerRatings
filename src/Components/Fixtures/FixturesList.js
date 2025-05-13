import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchFixtures } from "../../Hooks/Fixtures_Hooks";
import LatestFixtureItem from "./LatestFixtureItem";

import ScheduleContainer from "../../Containers/ScheduleContainer";
import { useIsMobile } from "../../Hooks/Helper_Functions";

export default function FixturesList() {
  const { fixtures, loading, error } = useSelector((state) => state.fixtures);
  const isMobile = useIsMobile();

  const dispatch = useDispatch();

  useEffect(() => {
    if (!fixtures) {
      dispatch(fetchFixtures());
    }
  }, [dispatch, fixtures]);

  if (loading) return <p>Loading fixtures...</p>;
  if (error) return <p>Error: {error}</p>;
  return (
    <div className="fixtures-container">
      <LatestFixtureItem />
      <ScheduleContainer
        limitAroundLatest={isMobile ? 3 : 0}
        showLink={isMobile ? true : false}
        scroll={isMobile ? false : true}
      />
    </div>
  );
}
