import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllPlayersSeasonOverallRating } from "../Hooks/Fixtures_Hooks";
import AllPlayerStats from "../Components/PlayerStats/AllPlayerStats";
import "../Components/PlayerStats/playerStats.css";
import { selectPlayerRatingsLoad } from "../Selectors/selectors";
import { Spinner } from "./Helpers";
import useGroupData from "../Hooks/useGroupsData";

export default function PlayerStatsContainer() {
  const dispatch = useDispatch();
  const { activeGroup } = useGroupData();

  const { playerSeasonOverallRatingsLoaded } = useSelector(
    selectPlayerRatingsLoad
  );

  useEffect(() => {
    if (!playerSeasonOverallRatingsLoaded) {
      dispatch(fetchAllPlayersSeasonOverallRating(activeGroup.groupId));
    }
  }, [dispatch, playerSeasonOverallRatingsLoaded, activeGroup.groupId]);

  return playerSeasonOverallRatingsLoaded ? <AllPlayerStats /> : <Spinner />;
}
