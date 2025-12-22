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
import MoodSelector from "./Fixture-Components/MoodSelector";
import { Box, Stack } from "@mui/material";

export default function Fixture() {
  const { matchId } = useParams();
  const { activeGroup } = useGroupData();

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
        value={{ fixtureGradient, homeTeamColour, awayTeamColour }}
      >
        {/* Listeners remain unchanged */}
        {String(latestFixture?.fixture.id) === matchId && (
          <FixturesListener
            teamId={activeGroup.groupClubId}
            fixtureId={latestFixture?.fixture.id}
          />
        )}
        <UsersMatchDataListener
          groupId={activeGroup.groupId}
          matchId={matchId}
        />

        {/* 1. Header with Margin Bottom */}
        <Box sx={{ mb: 3 }}>
          <FixtureHeader
            fixture={fixture}
            showDetails={true}
            showScorers={true}
            addClass={"containerMargin"}
            showPenaltys={true}
          />
        </Box>

        {isMobile ? (
          <MobileFixtureContainer
            fixture={fixture}
            showPredictions={showPredictions}
            groupId={activeGroup.groupId}
            currentYear={currentYear}
          />
        ) : (
          /* Desktop Layout with proper Gaps */
          <Box>
            <Stack spacing={3}>
              {showPredictions && (
                <Box
                  sx={{
                    display: "flex",
                    gap: 3, // Spacing between individual prediction cards
                    "& > *": { flex: 1 }, // Ensures cards are equal width
                  }}
                >
                  <WinnerPredict fixture={fixture} />
                  <ScorePrediction fixture={fixture} />
                  <PreMatchMOTM fixture={fixture} />
                </Box>
              )}
              {/* 3. Main Body Section */}
              <Box sx={{ display: "flex", gap: 3 }}>
                {showPredictions && !fixture?.lineups && (
                  <Box sx={{ flex: 1 }}>
                    <LineupPredictor fixture={fixture} />
                  </Box>
                )}

                {fixture?.lineups && (
                  <>
                    <Box sx={{ flex: 2 }}>
                      <LineupAndPlayerRatings fixture={fixture} />
                    </Box>
                    <Stack spacing={3} sx={{ flex: 1 }}>
                      <Statistics fixture={fixture} />
                      <Events events={fixture?.events} />
                    </Stack>
                  </>
                )}
              </Box>
              {/* 4. Mood Selector - full width */}
              {!isPreMatch && (
                <Box>
                  <MoodSelector
                    fixture={fixture}
                    groupId={activeGroup.groupId}
                    currentYear={currentYear}
                    matchId={matchId}
                  />
                </Box>
              )}
              {!isPreMatch && <PostKickoffPredictions fixture={fixture} />}
            </Stack>
          </Box>
        )}
      </FixtureGradientProvider>
    </>
  );
}
