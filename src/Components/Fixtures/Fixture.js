import { useParams } from "react-router-dom";

import { useDispatch, useSelector } from "react-redux";
import {
  selectFixtureById,
  selectLatestFixture,
  selectUpcomingFixtures,
} from "../../Selectors/fixturesSelectors";

import FixtureHeader from "./FixtureHeader";

import Statistics from "./Fixture-Components/Statistics";
import Events from "./Fixture-Components/Events";
import ScorePrediction from "./Fixture-Components/Predictions/ScorePrediction";
import {
  fetchMatchPlayerRatings,
  fetchMatchPredictions,
  fetchAllPlayersSeasonOverallRating,
  fetchUsersMatchData,
} from "../../Hooks/Fixtures_Hooks";
import { useEffect } from "react";

import LineupAndPlayerRatings from "./Fixture-Components/LineupAndPlayerRatings";
import LineupPredictor from "./Fixture-Components/LineupPredicter/LineupPredictor";
import PostKickoffPredictions from "./Fixture-Components/PostKickoffPredictions";

import {
  FixturesListener,
  UsersMatchDataListener,
} from "../../Firebase/FirebaseListeners";
import {
  footballClubsColours,
  useIsMobile,
} from "../../Hooks/Helper_Functions";
import { FixtureGradientProvider } from "../../Providers/FixtureGradientProvider";
import MobileFixtureContainer from "../../Containers/MobileFixtureContainer";
import WinnerPredict from "./Fixture-Components/Predictions/WinnerPredict";
import { selectPredictionsLoad } from "../../Selectors/predictionsSelectors";
import { selectPlayerRatingsLoad } from "../../Selectors/selectors";
import useGroupData from "../../Hooks/useGroupsData";
import useGlobalData from "../../Hooks/useGlobalData";
import PreMatchMOTM from "./Fixture-Components/Predictions/PreMatchMOTM";

export default function Fixture() {
  const { matchId } = useParams();
  const { groupData, activeGroup } = useGroupData();

  const upcomingFixture = useSelector(selectUpcomingFixtures)[0];

  const fixture = useSelector(selectFixtureById(matchId));
  const { predictionsError } = useSelector(selectPredictionsLoad);
  const { ratingsError, playerSeasonOverallRatingsLoaded } = useSelector(
    selectPlayerRatingsLoad
  );

  const isMobile = useIsMobile();

  const { currentYear } = useGlobalData();

  const dispatch = useDispatch();

  const homeTeamId = fixture.teams.home.id;
  const awayTeamId = fixture.teams.away.id;

  const homeTeamColour = footballClubsColours[homeTeamId];
  const awayTeamColour = footballClubsColours[awayTeamId];

  const fixtureGradient = `linear-gradient(95deg, ${homeTeamColour} 40%, ${awayTeamColour} 60%)`;

  const latestFixture = useSelector(selectLatestFixture);

  useEffect(() => {
    dispatch(
      fetchMatchPredictions({
        matchId: matchId,
        groupId: activeGroup.groupId,
        currentYear: currentYear,
      })
    );
  }, [dispatch, matchId, activeGroup.groupId, currentYear]);

  useEffect(() => {
    dispatch(
      fetchMatchPlayerRatings({
        matchId: matchId,
        groupId: activeGroup.groupId,
        currentYear: currentYear,
      })
    );
  }, [dispatch, matchId, activeGroup.groupId, currentYear]);

  useEffect(() => {
    dispatch(
      fetchUsersMatchData({
        matchId: matchId,
        groupId: activeGroup.groupId,
        currentYear: currentYear,
      })
    );
  }, [dispatch, matchId, activeGroup.groupId, currentYear]);

  useEffect(() => {
    if (!playerSeasonOverallRatingsLoaded) {
      dispatch(
        fetchAllPlayersSeasonOverallRating({
          groupId: activeGroup.groupId,
          currentYear: currentYear,
        })
      );
    }
  }, [
    dispatch,
    playerSeasonOverallRatingsLoaded,
    activeGroup.groupId,
    currentYear,
  ]);

  if (predictionsError || ratingsError) {
    console.log(predictionsError, ratingsError);
  }
  if (!fixture) {
    return <div>Loading...</div>;
  }

  const isPreMatch =
    fixture?.fixture?.status?.short === "NS" ||
    fixture?.fixture?.status?.short === "TBD";

  const showPredictions = upcomingFixture?.id === matchId;
  return (
    <>
      <FixtureGradientProvider
        value={{
          fixtureGradient: fixtureGradient,
          homeTeamColour: homeTeamColour,
          awayTeamColour: awayTeamColour,
        }}
      >
        {latestFixture === matchId && (
          <FixturesListener
            teamId={groupData.groupClubId}
            fixtureId={latestFixture?.fixture.id}
          />
        )}
        <UsersMatchDataListener
          groupId={activeGroup.groupId}
          matchId={matchId}
        />
        <FixtureHeader
          fixture={fixture}
          showDetails={true}
          showScorers={true}
          addClass={"containerMargin"}
        />
        {isMobile ? (
          <MobileFixtureContainer
            fixture={fixture}
            showPredictions={showPredictions}
          />
        ) : (
          <>
            {showPredictions && (
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
              {showPredictions && !fixture?.lineups && (
                <LineupPredictor fixture={fixture} />
              )}

              {fixture?.lineups && (
                <>
                  <LineupAndPlayerRatings fixture={fixture} />
                  <div className="lineup-sidebar">
                    <Statistics fixture={fixture} />
                    <Events events={fixture?.events} />
                  </div>
                </>
              )}

              {/* {!isPreMatch && (
                <div className="lineup-sidebar">
                  <Statistics fixture={fixture} />
                  <Events events={fixture?.events} />
                </div>
              )} */}
              {!isPreMatch && <PostKickoffPredictions fixture={fixture} />}
            </div>
          </>
        )}
      </FixtureGradientProvider>
    </>
  );
}
