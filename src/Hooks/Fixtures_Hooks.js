import { useDispatch } from "react-redux";
import { firebaseGetCollecion } from "../Firebase/Firebase";
import {
  fetchFixturesFailure,
  latestFixtureReducer,
  previousFixturesReducer,
  upcomingFixturesReducer,
  fetchFixturesSuccess,
  fetchFixturesStart,
} from "../redux/Reducers/fixturesReducer";

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

    // Sort the fixtures by timestamp in descending order (latest first)
    fixtures.sort((a, b) => b.fixture.timestamp - a.fixture.timestamp);

    // Filter and sort previous fixtures (latest to oldest)
    const previousFixtures = fixtures
      .filter((fixture) => fixture.fixture.timestamp < now)
      .sort((a, b) => b.fixture.timestamp - a.fixture.timestamp);

    // Filter and sort upcoming fixtures (soonest to furthest)
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

    // Dispatch the sorted and filtered fixtures to the Redux store
    dispatch(previousFixturesReducer(previousFixtures));
    dispatch(upcomingFixturesReducer(upcomingFixtures));
    dispatch(latestFixtureReducer(latestFixture));
    dispatch(fetchFixturesSuccess()); // Stop loading
  } catch (error) {
    console.error("Error getting fixtures:", error);
    dispatch(fetchFixturesFailure(error.message)); // Handle error
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
