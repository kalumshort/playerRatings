import { useDispatch } from "react-redux";
import {
  firebaseGetCollecion,
  firebaseGetDocument,
} from "../Firebase/Firebase";
import {
  fetchFixturesFailure,
  latestFixtureReducer,
  previousFixturesReducer,
  upcomingFixturesReducer,
  fetchFixturesSuccess,
  fetchFixturesStart,
} from "../redux/Reducers/fixturesReducer";
import { fetchMatchPrediction } from "../redux/Reducers/predictionsReducer";

// export const fetchFixturess = () => async (dispatch) => {
//   try {
//     const fetchedFixtures = [];
//     await firebaseGet("fixtures/2024", (docId, data) => {
//       fetchedFixtures.push({ id: docId, ...data });
//     });
//     dispatch(fetchFixturesSuccess(fetchedFixtures));
//   } catch (error) {
//     dispatch(fetchFixturesFailure(error.message));
//   }
// };
export const fetchFixtures = () => async (dispatch) => {
  try {
    dispatch(fetchFixturesStart()); // Start loading

    const fixtures = await firebaseGetCollecion("fixtures/2024/data");
    const now = Math.floor(Date.now() / 1000); // Current time in seconds

    fixtures.sort((a, b) => b.fixture.timestamp - a.fixture.timestamp);

    const previousFixtures = fixtures
      .filter((fixture) => fixture.fixture.timestamp < now)
      .sort((a, b) => b.fixture.timestamp - a.fixture.timestamp);

    const upcomingFixtures = fixtures
      .filter((fixture) => fixture.fixture.timestamp > now)
      .sort((a, b) => a.fixture.timestamp - b.fixture.timestamp);

    let latestFixture = null;

    if (previousFixtures.length > 0) {
      const firstPreviousFixtureTime =
        previousFixtures[0].fixture.timestamp * 1000;
      const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

      if (firstPreviousFixtureTime < twentyFourHoursAgo) {
        latestFixture = upcomingFixtures[0];
      } else {
        latestFixture = previousFixtures[0];
      }
    }

    dispatch(previousFixturesReducer(previousFixtures));
    dispatch(upcomingFixturesReducer(upcomingFixtures));
    dispatch(latestFixtureReducer(latestFixture));
    dispatch(fetchFixturesSuccess());
  } catch (error) {
    console.error("Error getting fixtures:", error);
    dispatch(fetchFixturesFailure(error.message));
  }
};

export const fetchMatchPredictions = (matchId) => async (dispatch) => {
  if (!matchId) {
    return;
  }
  try {
    const matchPredictions = await firebaseGetDocument(`predictions`, matchId);
    if (!matchPredictions) {
      return;
    }
    dispatch(
      fetchMatchPrediction({
        matchId: matchPredictions.id,
        data: matchPredictions,
      })
    );
  } catch (error) {
    console.error("Error getting fixtures:", error);
  }
};

const findLatestFixture = (fixtures, now) => {
  const recentPastThreshold = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

  const sortedFixtures = fixtures.sort(
    (a, b) => a.fixture.timestamp - b.fixture.timestamp
  );

  const latest = sortedFixtures.find((fixture) => {
    const timestamp = fixture.fixture.timestamp * 1000;
    return (
      timestamp > now ||
      (timestamp <= now && now - timestamp <= recentPastThreshold)
    );
  });

  return latest || null;
};
