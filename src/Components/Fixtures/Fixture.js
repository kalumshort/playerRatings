import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { Box, Stack } from "@mui/material";

// --- Selectors ---
import {
  selectFixtureById,
  selectLatestFixture,
  selectUpcomingFixtures,
} from "../../Selectors/fixturesSelectors";
import { selectPredictionsLoad } from "../../Selectors/predictionsSelectors";
import { selectPlayerRatingsLoad } from "../../Selectors/selectors";

// --- Components ---
import FixtureHeader from "./FixtureHeader";
import Statistics from "./Fixture-Components/Statistics";
import Events from "./Fixture-Components/Events";
import ScorePrediction from "./Fixture-Components/Predictions/ScorePrediction";
import LineupAndPlayerRatings from "./Fixture-Components/LineupAndPlayerRatings";
import LineupPredictor from "./Fixture-Components/LineupPredicter/LineupPredictor";
import PostKickoffPredictions from "./Fixture-Components/PostKickoffPredictions";
import WinnerPredict from "./Fixture-Components/Predictions/WinnerPredict";
import PreMatchMOTM from "./Fixture-Components/Predictions/PreMatchMOTM";
import { MoodSelector } from "./Fixture-Components/MoodSelector";

// --- Hooks, Context & Firebase ---
import {
  fetchMatchPlayerRatings,
  fetchMatchPredictions,
  fetchAllPlayersSeasonOverallRating,
  fetchUsersMatchData,
} from "../../Hooks/Fixtures_Hooks";
import {
  FixturesListener,
  UsersMatchDataListener,
} from "../../Firebase/FirebaseListeners";
import {
  footballClubsColours,
  useIsMobile,
} from "../../Hooks/Helper_Functions";
import { slugToClub } from "../../Hooks/Helper_Functions"; // Import your new mapping utility
import { FixtureGradientProvider } from "../../Providers/FixtureGradientProvider";
import MobileFixtureContainer from "../../Containers/MobileFixtureContainer";
import useGlobalData from "../../Hooks/useGlobalData";
import { useAuth } from "../../Providers/AuthContext"; // Import Auth context
import { Spinner } from "../../Containers/Helpers";

export default function Fixture() {
  const { matchId, clubSlug } = useParams(); // Now capturing clubSlug from URL
  const { user } = useAuth(); // Check if user is logged in
  const dispatch = useDispatch();
  const isMobile = useIsMobile();
  const { currentYear } = useGlobalData();

  // 1. Derive Group Context from the URL Slug instead of activeGroup
  const clubConfig = slugToClub[clubSlug];
  const groupId = clubConfig?.teamId ? String(clubConfig.teamId) : null;

  // 2. Redux Selectors
  const upcomingFixture = useSelector(selectUpcomingFixtures)[0];
  const fixture = useSelector(selectFixtureById(matchId));
  const latestFixture = useSelector(selectLatestFixture);
  const { predictionsError } = useSelector(selectPredictionsLoad);
  const { ratingsError, playerSeasonOverallRatingsLoaded } = useSelector(
    selectPlayerRatingsLoad
  );

  // 3. Dynamic Styles based on fixture data
  const homeTeamId = fixture?.teams?.home?.id;
  const awayTeamId = fixture?.teams?.away?.id;
  const homeTeamColour = footballClubsColours[homeTeamId] || "#7FD880";
  const awayTeamColour = footballClubsColours[awayTeamId] || "#241F20";
  const fixtureGradient = `linear-gradient(95deg, ${homeTeamColour} 40%, ${awayTeamColour} 60%)`;

  // 4. Data Fetching Effects (URL Driven)
  useEffect(() => {
    if (matchId && groupId) {
      // Fetch public community predictions
      dispatch(fetchMatchPredictions({ matchId, groupId, currentYear }));
      // Fetch public community player ratings
      dispatch(fetchMatchPlayerRatings({ matchId, groupId, currentYear }));
    }
  }, [dispatch, matchId, groupId, currentYear]);

  useEffect(() => {
    // ONLY fetch user-specific prediction/rating data if they are logged in
    if (user && matchId && groupId) {
      dispatch(fetchUsersMatchData({ matchId, groupId, currentYear }));
    }
  }, [dispatch, user, matchId, groupId, currentYear]);

  useEffect(() => {
    if (groupId && !playerSeasonOverallRatingsLoaded) {
      dispatch(fetchAllPlayersSeasonOverallRating({ groupId, currentYear }));
    }
  }, [dispatch, playerSeasonOverallRatingsLoaded, groupId, currentYear]);

  // 5. Guards
  if (!fixture)
    return (
      <Box sx={{ p: 5, textAlign: "center" }}>
        <Spinner text="Finding match details..." />
      </Box>
    );
  if (predictionsError || ratingsError)
    console.error(predictionsError, ratingsError);

  const isPreMatch =
    fixture?.fixture?.status?.short === "NS" ||
    fixture?.fixture?.status?.short === "TBD";
  const showPredictions = upcomingFixture?.id === matchId;

  return (
    <FixtureGradientProvider
      value={{ fixtureGradient, homeTeamColour, awayTeamColour }}
    >
      {/* Real-time Listeners */}
      {String(latestFixture?.fixture?.id) === matchId && (
        <FixturesListener
          teamId={homeTeamId} // Pass actual team ID from fixture
          fixtureId={latestFixture?.fixture?.id}
        />
      )}

      {/* Only listen for user-specific match data if logged in */}
      {user && groupId && (
        <UsersMatchDataListener groupId={groupId} matchId={matchId} />
      )}

      {/* 1. Header */}
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
          groupId={groupId}
          currentYear={currentYear}
        />
      ) : (
        <Box>
          <Stack spacing={3}>
            {/* 2. Pre-Match Prediction Section */}
            {showPredictions && (
              <Box sx={{ display: "flex", gap: 3, "& > *": { flex: 1 } }}>
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

            {/* 4. Live/Post-Match Mood & Predictions */}
            {!isPreMatch && groupId && (
              <Box>
                <MoodSelector
                  fixture={fixture}
                  groupId={groupId}
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
  );
}
