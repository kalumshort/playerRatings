import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllPlayersSeasonOverallRating } from "../Hooks/Fixtures_Hooks";
import AllPlayerStats from "../Components/PlayerStats/AllPlayerStats";
import "../Components/PlayerStats/playerStats.css";
import { selectPlayerRatingsLoad } from "../Selectors/selectors";
import { Spinner } from "./Helpers";

import useGlobalData from "../Hooks/useGlobalData";
import { useParams } from "react-router-dom";
import { slugToClub } from "../Hooks/Helper_Functions";

export default function PlayerStatsContainer() {
  const dispatch = useDispatch();

  const { clubSlug } = useParams(); // Now capturing clubSlug from URL

  // 1. Derive Group Context from the URL Slug instead of activeGroup
  const clubConfig = slugToClub[clubSlug];
  const groupId = clubConfig?.teamId ? String(clubConfig.teamId) : null;

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
