const axios = require("axios");

const { getFirestore } = require("firebase-admin/firestore");

const fetchFixtureData = async (fixtureId) => {
  try {
    const response = await axios.get(
      `https://api-football-v1.p.rapidapi.com/v3/fixtures?id=${fixtureId}`,
      {
        headers: {
          "x-rapidapi-key":
            "094b48b189mshadfe2267d2aa592p18a8efjsn02511bf918c6",
          // "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
        },
      }
    );

    const fixtureObj = response.data.response[0]; // Assuming API response structure

    if (!fixtureObj) {
      throw new Error(`No fixture found for ID ${fixtureId}`);
    }

    return {
      fixture: fixtureObj.fixture,
      league: fixtureObj.league,
      teams: fixtureObj.teams,
      goals: fixtureObj.goals,
      score: fixtureObj.score,
      matchDate: fixtureObj.fixture.timestamp,
    };
  } catch (error) {
    console.error(
      `Error fetching data for fixture ${fixtureId}:`,
      error.message
    );
    throw error; // Re-throw the error to handle it in the calling function
  }
};
const fetchStatisticsData = async (fixtureId) => {
  try {
    const response = await axios.get(
      `https://api-football-v1.p.rapidapi.com/v3/fixtures/statistics?fixture=${fixtureId}`,
      {
        headers: {
          "x-rapidapi-key":
            "094b48b189mshadfe2267d2aa592p18a8efjsn02511bf918c6",
          // "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
        },
      }
    );

    const statisticsObj = response.data.response; // Assuming API response structure

    if (!statisticsObj) {
      throw new Error(`No fixture found for ID ${fixtureId}`);
    }

    return statisticsObj;
  } catch (error) {
    console.error(
      `Error fetchStatisticsData  for fixture ${fixtureId}:`,
      error.message
    );
    throw error; // Re-throw the error to handle it in the calling function
  }
};
const fetchEventsData = async (fixtureId) => {
  try {
    const response = await axios.get(
      `https://api-football-v1.p.rapidapi.com/v3/fixtures/events?fixture=${fixtureId}`,
      {
        headers: {
          "x-rapidapi-key":
            "094b48b189mshadfe2267d2aa592p18a8efjsn02511bf918c6",
          // "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
        },
      }
    );

    const eventsObj = response.data.response; // Assuming API response structure

    if (!eventsObj) {
      throw new Error(`No fixture found for ID ${fixtureId}`);
    }

    return eventsObj;
  } catch (error) {
    console.error(
      `Error fetchEventsData for fixture ${fixtureId}:`,
      error.message
    );
    throw error; // Re-throw the error to handle it in the calling function
  }
};
const fetchLineupData = async (fixtureId) => {
  try {
    const response = await axios.get(
      `https://api-football-v1.p.rapidapi.com/v3/fixtures/lineups?fixture=${fixtureId}`,
      {
        headers: {
          "x-rapidapi-key":
            "094b48b189mshadfe2267d2aa592p18a8efjsn02511bf918c6",
          // "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
        },
      }
    );

    const lineupObj = response.data.response; // Assuming API response structure

    if (!lineupObj) {
      throw new Error(`No fixture found for ID ${fixtureId}`);
    }

    return lineupObj;
  } catch (error) {
    console.error(
      `Error fetchLineupData for fixture ${fixtureId}:`,
      error.message
    );
    throw error; // Re-throw the error to handle it in the calling function
  }
};

const fetchAllMatchData = async ({ fixtureId }) => {
  console.log(`Fetching all data for fixture: ${fixtureId}`);
  try {
    const fixtureData = await fetchFixtureData(fixtureId);

    const fixtureStatsData = await fetchStatisticsData(fixtureId);

    const fixtureLineupData = await fetchLineupData(fixtureId);

    const fixtureEventsData = await fetchEventsData(fixtureId);

    const combinedFixtureData = {
      ...fixtureData,
      statistics: fixtureStatsData,
      lineups: fixtureLineupData,
      events: fixtureEventsData,
    };

    const year = combinedFixtureData?.league?.season;

    if (!year) {
      throw new Error("League season not found in the fixture data.");
    }

    await getFirestore()
      .collection("fixtures")
      .doc(year.toString())
      .collection("fixtures")
      .doc(fixtureId.toString())
      .set(combinedFixtureData, { merge: true });
    console.log(`Successfully saved data for fixture ${fixtureId}`);
    return;
  } catch (error) {
    console.error(
      `Error fetching or saving data for fixture ${fixtureId}:`,
      error.stack
    );
    return;
  }
};

const checkTeamsLatestFixture = async (teamId) => {
  const now = Math.floor(Date.now() / 1000);
  console.log(`Checking latest fixture for team: ${teamId}`);
  try {
    // Query the next match
    const matchesRef = getFirestore().collection(`fixtures/2025/${teamId}`);
    const nextFixture = await matchesRef
      .where("matchDate", ">=", now)
      .orderBy("matchDate", "asc")
      .limit(1)
      .get();

    const lastFixture = await matchesRef
      .where("matchDate", "<=", now)
      .orderBy("matchDate", "desc")
      .limit(1)
      .get();

    if (nextFixture.empty || lastFixture.empty) {
      console.log("Fixture was empty");
      return;
    }

    const nextFixtureData = nextFixture.docs[0].data();
    const lastFixtureData = lastFixture.docs[0].data();

    let latestFixture = null;

    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

    if (lastFixtureData.matchDate * 1000 < twentyFourHoursAgo) {
      latestFixture = nextFixtureData;
    } else {
      latestFixture = lastFixtureData;
    }

    const matchStartingTimestamp = latestFixture?.fixture?.timestamp;
    const latestFixtureId = latestFixture?.fixture?.id;

    if (!latestFixtureId) {
      console.error("Error: No latest Fixture Id");
      return;
    }

    // Calculate the difference in seconds
    const timeDifference = Math.abs(now - matchStartingTimestamp);

    // Check if the difference is within 1 hour (3600 seconds)
    if (timeDifference <= 3600) {
      console.log("The timestamp is within an hour of the starting time.");
      await fetchAllMatchData({ fixtureId: latestFixtureId, teamId: teamId });
    } else if (
      latestFixture.fixture.status.long !== "Match Finished" &&
      latestFixture.fixture.status.long !== "Not Started"
    ) {
      console.log("Match Inplay.");
      await fetchAllMatchData({ fixtureId: latestFixtureId, teamId: teamId });
    } else {
      console.log("Match is not within 1 hour and is not in play");
    }

    console.log("Successful");
  } catch (error) {
    console.error("Error fetching match data:", error);
  }
};

//  if (process.env.FIRESTORE_EMULATOR_HOST) {
//   console.log(
//     "Using Firestore Emulator:",
//     process.env.FIRESTORE_EMULATOR_HOST
//   );
// } else {
//   console.log("Using Firestore Production Database");
// }

module.exports = {
  fetchFixtureData,
  fetchStatisticsData,
  fetchLineupData,
  fetchEventsData,
  fetchAllMatchData,
  checkTeamsLatestFixture,
};
