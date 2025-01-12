import { useParams } from "react-router-dom";

import { useSelector } from "react-redux";
import { selectFixtureById } from "../../Selectors/fixturesSelectors";

import FixtureHeader from "./FixtureHeader";
import Lineup from "./Fixture-Components/Lineup";
import Statistics from "./Fixture-Components/Statistics";
import Events from "./Fixture-Components/Events";
import ScorePrediction from "./Fixture-Components/ScorePrediction";

export default function Fixture() {
  const { matchId } = useParams();

  const fixture = useSelector(selectFixtureById(matchId));

  if (!fixture) {
    return <div>Loading...</div>;
  }
  const isPreMatch = fixture?.fixture?.status?.short === "NS";

  return (
    <>
      <FixtureHeader fixture={fixture} />
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
        }}
      >
        {isPreMatch && <ScorePrediction fixture={fixture} />}
        <Lineup fixture={fixture} />
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
