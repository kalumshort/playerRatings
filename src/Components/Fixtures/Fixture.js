import { useParams } from "react-router-dom";

import { useDispatch, useSelector } from "react-redux";
import {
  selectFixtureById,
  selectLatestFixture,
} from "../../Selectors/fixturesSelectors";

import FixtureHeader from "./FixtureHeader";

import Statistics from "./Fixture-Components/Statistics";
import Events from "./Fixture-Components/Events";
import ScorePrediction from "./Fixture-Components/ScorePrediction";
import {
  fetchMatchPlayerRatings,
  fetchMatchPredictions,
  fetchPlayerStats,
} from "../../Hooks/Fixtures_Hooks";
import { useEffect } from "react";

import LineupAndPlayerRatings from "./Fixture-Components/LineupAndPlayerRatings";
import LineupPredictor from "./Fixture-Components/LineupPredicter/LineupPredictor";
import PostKickoffPredictions from "./Fixture-Components/PostKickoffPredictions";
import PreMatchMOTM from "./Fixture-Components/PreMatchMOTM";
import FirestoreDocumentListener from "../../Firebase/FirebaseListeners";
import {
  footballClubsColours,
  useIsMobile,
} from "../../Hooks/Helper_Functions";
import { FixtureGradientProvider } from "../../Providers/FixtureGradientProvider";
import MobileFixtureContainer from "../../Containers/MobileFixtureContainer";
import WinnerPredict from "./Fixture-Components/WinnerPredict";
import { selectPredictionsLoad } from "../../Selectors/predictionsSelectors";
import {
  selectPlayerRatingsLoad,
  selectPlayerStatsLoad,
} from "../../Selectors/selectors";

export default function Fixture() {
  const { matchId } = useParams();

  const fixture = useSelector(selectFixtureById(matchId));
  const { predictionsLoaded, predictionsError } = useSelector(
    selectPredictionsLoad
  );
  const { ratingsLoaded, ratingsError } = useSelector(selectPlayerRatingsLoad);
  const { playerStatsLoaded, playerStatsError } = useSelector(
    selectPlayerStatsLoad
  );

  const isMobile = useIsMobile();

  const dispatch = useDispatch();

  const homeTeamId = fixture.teams.home.id;
  const awayTeamId = fixture.teams.away.id;

  const homeTeamColour = footballClubsColours[homeTeamId];
  const awayTeamColour = footballClubsColours[awayTeamId];

  const fixtureGradient = `linear-gradient(95deg, ${homeTeamColour} 40%, ${awayTeamColour} 60%)`;

  const latestFixture = useSelector(selectLatestFixture);

  // Fetch data on component mount
  useEffect(() => {
    if (!predictionsLoaded) {
      dispatch(fetchMatchPredictions(matchId));
    }
  }, [dispatch, matchId, predictionsLoaded]);

  useEffect(() => {
    if (!ratingsLoaded) {
      dispatch(fetchMatchPlayerRatings(matchId));
    }
  }, [dispatch, matchId, ratingsLoaded]);

  useEffect(() => {
    if (!playerStatsLoaded) {
      dispatch(fetchPlayerStats());
    }
  }, [dispatch, playerStatsLoaded]);

  if (predictionsError || ratingsError || playerStatsError) {
    console.log(predictionsError, ratingsError, playerStatsError);
  }
  if (!fixture) {
    return <div>Loading...</div>;
  }

  const isPreMatch =
    fixture?.fixture?.status?.short === "NS" ||
    fixture?.fixture?.status?.short === "TBD";

  return (
    <>
      <FixtureGradientProvider
        value={{
          fixtureGradient: fixtureGradient,
          homeTeamColour: homeTeamColour,
          awayTeamColour: awayTeamColour,
        }}
      >
        <FirestoreDocumentListener docId={latestFixture.fixture.id} />
        <FixtureHeader
          fixture={fixture}
          showDetails={true}
          showScorers={true}
        />
        {isMobile ? (
          <MobileFixtureContainer fixture={fixture} />
        ) : (
          <>
            {isPreMatch && (
              <div className="ScorePredictPTWContainer containerMargin">
                <WinnerPredict fixture={fixture} />
                <ScorePrediction fixture={fixture} />
                <PreMatchMOTM fixture={fixture} />
              </div>
            )}

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
              }}
            >
              {!fixture?.lineups || fixture.lineups.length === 0 ? (
                <LineupPredictor fixture={fixture} />
              ) : (
                <LineupAndPlayerRatings fixture={fixture} />
              )}

              <div className="lineup-sidebar">
                {!isPreMatch && (
                  <>
                    <Statistics fixture={fixture} />
                    <Events events={fixture?.events} />
                  </>
                )}
              </div>
              {!isPreMatch && <PostKickoffPredictions fixture={fixture} />}
            </div>
          </>
        )}
      </FixtureGradientProvider>
    </>
  );
}
