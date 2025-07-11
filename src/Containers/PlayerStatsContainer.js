import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllPlayersSeasonOverallRating } from "../Hooks/Fixtures_Hooks";
import AllPlayerStats from "../Components/PlayerStats/AllPlayerStats";
import "../Components/PlayerStats/playerStats.css";
import { selectPlayerRatingsLoad } from "../Selectors/selectors";
import { Spinner } from "./Helpers";
import useGroupData from "../Hooks/useGroupsData";
import useGlobalData from "../Hooks/useGlobalData";

export default function PlayerStatsContainer() {
  const dispatch = useDispatch();
  const { activeGroup } = useGroupData();

  const globalData = useGlobalData();

  const { playerSeasonOverallRatingsLoaded } = useSelector(
    selectPlayerRatingsLoad
  );
  console.log(playerSeasonOverallRatingsLoaded);
  useEffect(() => {
    if (!playerSeasonOverallRatingsLoaded) {
      dispatch(
        fetchAllPlayersSeasonOverallRating({
          groupId: activeGroup.groupId,
          currentYear: globalData.currentYear,
        })
      );
    }
  }, [dispatch, playerSeasonOverallRatingsLoaded, activeGroup.groupId]);

  return playerSeasonOverallRatingsLoaded ? <AllPlayerStats /> : <Spinner />;
}
