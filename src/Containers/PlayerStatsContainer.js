import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllPlayersSeasonOverallRating } from "../Hooks/Fixtures_Hooks";
import AllPlayerStats from "../Components/PlayerStats/AllPlayerStats";
import "../Components/PlayerStats/playerStats.css";
import { selectPlayerRatingsLoad } from "../Selectors/selectors";
import Spinner from "./Helpers";

export default function PlayerStatsContainer() {
  const dispatch = useDispatch();

  const { playerSeasonOverallRatingsLoaded } = useSelector(
    selectPlayerRatingsLoad
  );

  useEffect(() => {
    if (!playerSeasonOverallRatingsLoaded) {
      dispatch(fetchAllPlayersSeasonOverallRating());
    }
  }, [dispatch, playerSeasonOverallRatingsLoaded]);

  return playerSeasonOverallRatingsLoaded ? <AllPlayerStats /> : <Spinner />;
}
