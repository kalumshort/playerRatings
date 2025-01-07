import React, { useEffect } from "react";
import FixturesList from "../Components/Fixtures/FixturesList";
import { useDispatch, useSelector } from "react-redux";
import { fetchFixtures } from "../Hooks/Fixtures_Hooks";

export default function FixturesContainer() {
  // const dispatch = useDispatch();
  // const fixtures = useSelector((state) => state.fixtures.fixtures);

  // useEffect(() => {
  //   // Only fetch fixtures if the store is empty
  //   if (
  //     !fixtures?.previousFixtures.length &&
  //     !fixtures?.upcomingFixtures.length &&
  //     !fixtures?.latestFixture
  //   ) {
  //     dispatch(fetchFixtures());
  //   }
  // }, [dispatch, fixtures]);

  return <FixturesList />;
}
