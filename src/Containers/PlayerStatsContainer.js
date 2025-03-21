import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { fetchPlayerStats } from "../Hooks/Fixtures_Hooks";
import AllPlayerStats from "../Components/PlayerStats/AllPlayerStats";
import "../Components/PlayerStats/playerStats.css";
export default function PlayerStatsContainer() {
  const dispatch = useDispatch();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    dispatch(fetchPlayerStats());
    setLoaded(true);
  }, [dispatch]);
  return loaded ? <AllPlayerStats /> : <div>PlayerStatsContainer</div>;
}
