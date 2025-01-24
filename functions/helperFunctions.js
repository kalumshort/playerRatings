const axios = require("axios");

const { getFirestore } = require("firebase-admin/firestore");

const fetchFixtureData = async (fixtureId) => {
  try {
    const response = await axios.get(
      `https://v3.football.api-sports.io/fixtures?id=${fixtureId}`,
      {
        headers: {
          "x-rapidapi-host": "v3.football.api-sports.io",
          "x-rapidapi-key": "e1cea611a4d193af4f01c7a61969b778", // Your API key
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
      `https://v3.football.api-sports.io/fixtures/statistics?fixture=${fixtureId}`,
      {
        headers: {
          "x-rapidapi-host": "v3.football.api-sports.io",
          "x-rapidapi-key": "e1cea611a4d193af4f01c7a61969b778", // Your API key
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
      `Error fetching data for fixture ${fixtureId}:`,
      error.message
    );
    throw error; // Re-throw the error to handle it in the calling function
  }
};
const fetchEventsData = async (fixtureId) => {
  try {
    const response = await axios.get(
      `https://v3.football.api-sports.io/fixtures/events?fixture=${fixtureId}`,
      {
        headers: {
          "x-rapidapi-host": "v3.football.api-sports.io",
          "x-rapidapi-key": "e1cea611a4d193af4f01c7a61969b778", // Your API key
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
      `Error fetching data for fixture ${fixtureId}:`,
      error.message
    );
    throw error; // Re-throw the error to handle it in the calling function
  }
};
const fetchLineupData = async (fixtureId) => {
  try {
    const response = await axios.get(
      `https://v3.football.api-sports.io/fixtures/lineups?fixture=${fixtureId}`,
      {
        headers: {
          "x-rapidapi-host": "v3.football.api-sports.io",
          "x-rapidapi-key": "e1cea611a4d193af4f01c7a61969b778", // Your API key
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
      `Error fetching data for fixture ${fixtureId}:`,
      error.message
    );
    throw error; // Re-throw the error to handle it in the calling function
  }
};

const fetchAllMatchData = async (fixtureId) => {
  console.log(fixtureId);
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
      .collection("data")
      .doc(fixtureId.toString())
      .set(combinedFixtureData, { merge: true });

    return;
  } catch (error) {
    console.error(
      `Error fetching or saving data for fixture ${fixtureId}:`,
      error.stack
    );
    return;
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
};
