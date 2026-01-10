import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllPlayersSeasonOverallRating } from "../Hooks/Fixtures_Hooks";
import AllPlayerStats from "../Components/PlayerStats/AllPlayerStats";
import "../Components/PlayerStats/playerStats.css";
import { selectPlayerRatingsLoad } from "../Selectors/selectors";
import { Spinner } from "./Helpers";

import useGlobalData from "../Hooks/useGlobalData";

import useGroupData from "../Hooks/useGroupsData";

export default function PlayerStatsContainer() {
  const dispatch = useDispatch();

  const { activeGroup } = useGroupData();

  const groupId = activeGroup?.groupClubId;

  const globalData = useGlobalData();

  const { playerSeasonOverallRatingsLoaded } = useSelector(
    selectPlayerRatingsLoad
  );

  useEffect(() => {
    if (!playerSeasonOverallRatingsLoaded) {
      dispatch(
        fetchAllPlayersSeasonOverallRating({
          groupId: groupId,
          currentYear: globalData.currentYear,
        })
      );
    }
  }, [
    dispatch,
    playerSeasonOverallRatingsLoaded,
    groupId,
    globalData.currentYear,
  ]);

  return playerSeasonOverallRatingsLoaded ? <AllPlayerStats /> : <Spinner />;
}
