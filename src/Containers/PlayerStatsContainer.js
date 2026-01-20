import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllPlayersSeasonOverallRating } from "../Hooks/Fixtures_Hooks";
import AllPlayerStats from "../Components/PlayerStats/AllPlayerStats";
import "../Components/PlayerStats/playerStats.css";
import { selectAllPlayersSeasonOverallRating } from "../Selectors/selectors";

import useGlobalData from "../Hooks/useGlobalData";

import useGroupData from "../Hooks/useGroupsData";

export default function PlayerStatsContainer() {
  const dispatch = useDispatch();

  const { activeGroup } = useGroupData();

  const groupId = activeGroup?.groupId;

  const globalData = useGlobalData();

  const playerStats = useSelector(selectAllPlayersSeasonOverallRating);

  useEffect(() => {
    const hasData = playerStats && Object.keys(playerStats).length > 0;

    if (groupId && !hasData) {
      dispatch(
        fetchAllPlayersSeasonOverallRating({
          groupId: groupId,
          currentYear: globalData.currentYear,
        }),
      );
    }
  }, [dispatch, playerStats, groupId, globalData.currentYear]);

  return <AllPlayerStats />;
}
