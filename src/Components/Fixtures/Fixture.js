import { useParams } from "react-router-dom";

import { useDispatch, useSelector } from "react-redux";
import { selectFixtureById } from "../../Selectors/fixturesSelectors";

import FixtureHeader from "./FixtureHeader";
import Lineup from "./Fixture-Components/Lineup";
import Statistics from "./Fixture-Components/Statistics";
import Events from "./Fixture-Components/Events";
import ScorePrediction from "./Fixture-Components/ScorePrediction";
import {
  fetchMatchPlayerRatings,
  fetchMatchPredictions,
} from "../../Hooks/Fixtures_Hooks";
import { useEffect } from "react";
import PlayerRatings from "./Fixture-Components/PlayerRatings/PlayerRatings";
import LineupAndPlayerRatings from "./Fixture-Components/LineupAndPlayerRatings";
import LineupPredictor from "./Fixture-Components/LineupPredicter/LineupPredictor";

export default function Fixture() {
  const dispatch = useDispatch();

  const { matchId } = useParams();

  const fixture = useSelector(selectFixtureById(matchId));

  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchMatchPredictions(matchId));
    dispatch(fetchMatchPlayerRatings(matchId));
  }, [dispatch, matchId]);

  if (!fixture) {
    return <div>Loading...</div>;
  }
  const isPreMatch = fixture?.fixture?.status?.short === "NS";
  const isPostMatch = fixture?.fixture?.status?.short === "FT";

  return (
    <>
      <FixtureHeader fixture={fixture} />

      {isPreMatch && <ScorePrediction fixture={fixture} />}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
        }}
      >
        {!fixture.lineups && <LineupPredictor fixture={fixture} />}

        {fixture.lineups && <LineupAndPlayerRatings fixture={fixture} />}

        <div className="lineup-sidebar">
          {fixture?.events && fixture.statistics && (
            <>
              <Statistics fixture={fixture} />
              <Events events={fixture?.events} />
            </>
          )}
        </div>
      </div>
    </>
  );
}
