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

import { FixtureGradientProvider } from "../../Providers/FixtureGradientProvider";
import MobileFixtureContainer from "../../Containers/MobileFixtureContainer";
import useGlobalData from "../../Hooks/useGlobalData";
import { useAuth } from "../../Providers/AuthContext";
import { Spinner } from "../../Containers/Helpers";
import useGroupData from "../../Hooks/useGroupsData";

import { Helmet } from "react-helmet-async";

export default function Fixture() {
  const { matchId } = useParams();
  const { user } = useAuth();
  const dispatch = useDispatch();
  const isMobile = useIsMobile();
  const { currentYear } = useGlobalData();
  const { activeGroup } = useGroupData();

  const groupId = activeGroup?.groupId;

  // 2. Redux Selectors
  const upcomingFixture = useSelector(selectUpcomingFixtures)[0];
  const fixture = useSelector(selectFixtureById(matchId));
  const latestFixture = useSelector(selectLatestFixture);
  const { predictionsError } = useSelector(selectPredictionsLoad);
  const { ratingsError, playerSeasonOverallRatingsLoaded } = useSelector(
    selectPlayerRatingsLoad
  );

  // 3. Dynamic Styles
  const homeTeamId = fixture?.teams?.home?.id;
  const awayTeamId = fixture?.teams?.away?.id;
  const homeTeamColour = footballClubsColours[homeTeamId] || "#7FD880";
  const awayTeamColour = footballClubsColours[awayTeamId] || "#241F20";
  const fixtureGradient = `linear-gradient(95deg, ${homeTeamColour} 40%, ${awayTeamColour} 60%)`;

  // 4. Data Fetching Effects
  useEffect(() => {
    if (matchId && groupId) {
      dispatch(fetchMatchPredictions({ matchId, groupId, currentYear }));
      dispatch(fetchMatchPlayerRatings({ matchId, groupId, currentYear }));
    }
  }, [dispatch, matchId, groupId, currentYear]);

  useEffect(() => {
    if (user && matchId && groupId) {
      dispatch(fetchUsersMatchData({ matchId, groupId, currentYear }));
    }
  }, [dispatch, user, matchId, groupId, currentYear]);

  useEffect(() => {
    if (groupId && !playerSeasonOverallRatingsLoaded) {
      dispatch(fetchAllPlayersSeasonOverallRating({ groupId, currentYear }));
    }
  }, [dispatch, playerSeasonOverallRatingsLoaded, groupId, currentYear]);

  // --- 5. SEO & METADATA PREPARATION (MOVED UP) ---
  // We calculate these SAFELY using '?.' so they don't crash if fixture is null.

  const homeTeam =
    fixture?.teams?.home?.name || activeGroup?.groupName || "Home Team";
  const awayTeam = fixture?.teams?.away?.name || "Away Team";
  // Fallback date if fixture isn't loaded yet
  const date = fixture?.fixture?.date
    ? new Date(fixture.fixture.date).toDateString()
    : "Upcoming Match";

  const pageTitle = fixture
    ? `${homeTeam} vs ${awayTeam} - Player Ratings & Vote | 11Votes`
    : `${activeGroup?.groupName || "Football"} Match Center | 11Votes`;

  const pageDescription = fixture
    ? `Voice your opinion! Rate the players for ${homeTeam} vs ${awayTeam} on ${date}. See the real-time fan consensus and Man of the Match stats.`
    : "View live player ratings, lineups, and fan predictions on 11Votes.";

  const canonicalUrl = `https://11votes.com/${
    activeGroup?.slug || "global"
  }/fixture/${matchId}`;

  // 6. Guards (Console logging mainly)
  if (predictionsError || ratingsError)
    console.error(predictionsError, ratingsError);

  const isPreMatch =
    fixture?.fixture?.status?.short === "NS" ||
    fixture?.fixture?.status?.short === "TBD";
  const showPredictions = upcomingFixture?.id === matchId;

  return (
    <>
      {/* --- SEO TAGS RENDERED IMMEDIATELY --- */}
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />

        {/* Open Graph */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />

        <link rel="canonical" href={canonicalUrl} />

        {/* Only render JSON-LD if we actually have the fixture data */}
        {fixture && (
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SportsEvent",
              name: `${homeTeam} vs ${awayTeam}`,
              startDate: fixture.fixture.date,
              location: {
                "@type": "Place",
                name: fixture.fixture.venue.name,
                address: {
                  "@type": "PostalAddress",
                  addressLocality: fixture.fixture.venue.city,
                },
              },
              homeTeam: {
                "@type": "SportsTeam",
                name: homeTeam,
              },
              awayTeam: {
                "@type": "SportsTeam",
                name: awayTeam,
              },
              description: "Live fan player ratings and voting consensus.",
            })}
          </script>
        )}
      </Helmet>

      {/* --- CONTENT RENDER --- */}
      {/* Instead of returning early, we conditionally render the Spinner or the Content */}

      {!fixture ? (
        <Box sx={{ p: 5, textAlign: "center" }}>
          <Spinner text="Finding match details..." />
        </Box>
      ) : (
        <FixtureGradientProvider
          value={{ fixtureGradient, homeTeamColour, awayTeamColour }}
        >
          {/* Real-time Listeners */}
          {String(latestFixture?.fixture?.id) === matchId && (
            <FixturesListener
              teamId={homeTeamId}
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
      )}
    </>
  );
}
