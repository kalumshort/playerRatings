// The Cloud Functions for Firebase SDK to create Cloud Functions and triggers.
const { logger } = require("firebase-functions");
// const admin = require("firebase-admin");

const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");

const axios = require("axios");

// const { onDocumentCreated } = require("firebase-functions/v2/firestore");

// The Firebase Admin SDK to access Firestore.
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const {
  fetchFixtureData,
  fetchStatisticsData,
  fetchLineupData,
  fetchEventsData,
  fetchAllMatchData,
} = require("./helperFunctions");

initializeApp();

// Your Football API Key
// const FOOTBALL_API_KEY = "e1cea611a4d193af4f01c7a61969b778"; // Replace with your API key
// const BASE_URL = "https://v3.football.api-sports.io";

// const headers = {
//   "x-rapidapi-host": "v3.football.api-sports.io",
//   "x-rapidapi-key": "e1cea611a4d193af4f01c7a61969b778",
// };

// prevIds = [
//   1208202, 1208190, 1314296, 1208178, 1299226, 1208170, 1208154, 1208148,
//   1299212, 1208138, 1208128, 1299196, 1208117, 1309282, 1208112, 1299176,
//   1208095, 1208082, 1299158, 1208077, 1299134, 1208063, 1298643, 1208058,
//   1208047, 1208033, 1208021, 1222610, 1225638, 1219972, 1217973, 1210218,
//   1208854,
// ];

// Fetch and Save Fixtures
exports.updateFixtures = onSchedule("every day 00:00", async (event) => {
  try {
    // Fetch fixtures from API
    const fixturesResponse = await axios.get(
      `https://v3.football.api-sports.io/fixtures`,
      {
        params: {
          team: 33, // Example: Manchester United team ID
          season: 2024, // Example: 2024 season
        },
        headers: {
          "x-rapidapi-host": "v3.football.api-sports.io",
          "x-rapidapi-key": "e1cea611a4d193af4f01c7a61969b778", // Your API key here
        },
      }
    );
    const fixtures = fixturesResponse.data.response;

    for (const fixtureObj of fixtures) {
      const year = fixtureObj.league.season;
      const fixtureId = fixtureObj.fixture.id;

      const fixtureData = {
        fixture: fixtureObj.fixture,
        league: fixtureObj.league,
        teams: fixtureObj.teams,
        goals: fixtureObj.goals,
        score: fixtureObj.score,
        matchDate: fixtureObj.fixture.timestamp, // Add match date to the data
      };

      await getFirestore()
        .collection("fixtures")
        .doc(year.toString())
        .collection("33")
        .doc(fixtureId.toString())
        .set(fixtureData, { merge: true });
    }

    logger.info(`Successfully updated ${fixtures.length} fixtures.`);

    const squadDataResponse = await axios.get(
      `https://v3.football.api-sports.io/players/squads?team=33`,
      {
        headers: {
          "x-rapidapi-host": "v3.football.api-sports.io",
          "x-rapidapi-key": "e1cea611a4d193af4f01c7a61969b778",
        },
      }
    );
    const squadPlayers = squadDataResponse.data.response[0].players;

    await getFirestore()
      .collection("teamSquads")
      .doc("33")
      .set({ activeSquad: squadPlayers }, { merge: true });
  } catch (error) {
    logger.error("Error updating fixtures:", error);
  }
});

exports.updateFixturesRequest = onRequest(async (req, res) => {
  try {
    const response = await axios.get(
      `https://v3.football.api-sports.io/fixtures`,
      {
        params: {
          team: 33, // Example: Manchester United team ID
          season: 2024, // Example: 2024 season
        },
        headers: {
          "x-rapidapi-host": "v3.football.api-sports.io",
          "x-rapidapi-key": "e1cea611a4d193af4f01c7a61969b778", // Your API key here
        },
      }
    );
    const fixtures = response.data.response;

    for (const fixtureObj of fixtures) {
      const year = fixtureObj.league.season;
      const fixtureId = fixtureObj.fixture.id;

      const fixtureData = {
        fixture: fixtureObj.fixture,
        league: fixtureObj.league,
        teams: fixtureObj.teams,
        goals: fixtureObj.goals,
        score: fixtureObj.score,
        matchDate: fixtureObj.fixture.timestamp,
      };

      await getFirestore()
        .collection("fixtures")
        .doc(year.toString())
        .collection("data")
        .doc(fixtureId.toString())
        .set(fixtureData, { merge: true });
    }

    logger.info(`Successfully updated ${fixtures.length} fixtures.`);

    res.status(200).send(`Successfully updated ${fixtures.length} fixtures.`);
  } catch (error) {
    logger.error("Error updating fixtures:", error);
    res.status(500).send("Failed to update fixtures");
  }
});

exports.prevIds = onRequest(async (req, res) => {
  const prevIds = [1208210];
  // events
  // statistics
  // lineups
  for (const fixtureId of prevIds) {
    try {
      const response = await axios.get(
        `https://v3.football.api-sports.io/fixtures/events?fixture=${fixtureId}`,
        {
          headers: {
            "x-rapidapi-host": "v3.football.api-sports.io",
            "x-rapidapi-key": "e1cea611a4d193af4f01c7a61969b778",
          },
        }
      );

      const events = response.data.response;

      await getFirestore()
        .collection("fixtures")
        .doc("2024")
        .collection("data")
        .doc(fixtureId.toString())
        .set({ events }, { merge: true });
    } catch (error) {
      console.error(`Error for fixture ${fixtureId}:`, error.message);
    }
  }

  res.send("Lineups added to Firebase.");
});

exports.fetchSingleFixtureData = onRequest(async (req, res) => {
  const fixtureId = 1208239;
  if (!fixtureId) {
    return res.status(400).send("Fixture ID is required");
  }

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

    res.status(200).send(`Successfully updated fixture.`);
  } catch (error) {
    console.error(
      `Error fetching or saving data for fixture ${fixtureId}:`,
      error.stack
    );
    return res
      .status(500)
      .send(`Error fetching fixture data: ${error.message}`);
  }
});

exports.scheduledLatestTeamDataFetch = onSchedule(
  "every 5 minutes",
  async (event) => {
    const now = Math.floor(Date.now() / 1000);

    try {
      // Query the next match
      const matchesRef = getFirestore().collection(`fixtures/2024/data`);
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
        await fetchAllMatchData(latestFixtureId);
      } else if (
        latestFixture.fixture.status.long !== "Match Finished" &&
        latestFixture.fixture.status.long !== "Not Started"
      ) {
        console.log("Match Inplay.");
        await fetchAllMatchData(latestFixtureId);
      } else {
        console.log("Match is not within 1 hour and is not in play");
      }

      console.log("Successful");
    } catch (error) {
      console.error("Error fetching match data:", error);
    }
  }
);

// exports.conversionFunction = onRequest(async (req, res) => {
//   try {
//     const sourcePath = "players";
//     const destinationPath = "groups/001/seasons/2024/players";

//     if (!sourcePath || !destinationPath) {
//       return res.status(400).send("Missing source or destination path.");
//     }

//     const db = getFirestore();
//     await copyCollection(db, sourcePath, destinationPath);

//     res
//       .status(200)
//       .send(`Successfully copied ${sourcePath} to ${destinationPath}`);
//   } catch (error) {
//     console.error("Error copying Firestore data:", error);
//     res.status(500).send("Internal Server Error");
//   }
// });

// async function copyCollection(db, sourcePath, destinationPath) {
//   const sourceCollection = await db.collection(sourcePath).get();

//   for (const doc of sourceCollection.docs) {
//     const newDocRef = db.collection(destinationPath).doc(doc.id);
//     await newDocRef.set(doc.data());

//     // Recursively copy subcollections
//     const subcollections = await doc.ref.listCollections();
//     for (const subcollection of subcollections) {
//       await copyCollection(
//         db,
//         `${sourcePath}/${doc.id}/${subcollection.id}`,
//         `${destinationPath}/${doc.id}/${subcollection.id}`
//       );
//     }
//   }
// }
// exports.scheduledLatestTeamDataFetch = onRequest(async (req, res) => {
//   const now = Math.floor(Date.now() / 1000);

//   try {
//     // Query the next match
//     const matchesRef = getFirestore().collection(`fixtures/2024/data`);
//     const nextFixture = await matchesRef
//       .where("matchDate", ">=", now)
//       .orderBy("matchDate", "asc")
//       .limit(1)
//       .get();

//     const lastFixture = await matchesRef
//       .where("matchDate", "<=", now)
//       .orderBy("matchDate", "desc")
//       .limit(1)
//       .get();

//     if (nextFixture.empty || lastFixture.empty) {
//       console.log("Fixture was empty");
//       return null;
//     }

//     const nextFixtureData = nextFixture.docs[0].data();
//     const lastFixtureData = lastFixture.docs[0].data();

//     let latestFixture = null;

//     const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

//     if (lastFixtureData.matchDate * 1000 < twentyFourHoursAgo) {
//       latestFixture = nextFixtureData;
//     } else {
//       latestFixture = lastFixtureData;
//     }

//     const matchStartingTimestamp = latestFixture?.fixture?.timestamp;
//     const latestFixtureId = latestFixture?.fixture?.id;

//     if (!latestFixtureId) {
//       return res.status(500).send(`Error: No latest Fixture Id`);
//     }

//     // Calculate the difference in seconds
//     const timeDifference = Math.abs(now - matchStartingTimestamp);

//     // Check if the difference is within 1 hour (3600 seconds)
//     if (timeDifference <= 3600) {
//       console.log("The timestamp is within an hour of the starting time.");
//       await fetchAllMatchData(latestFixtureId);
//     } else if (
//       latestFixture.fixture.status.long !== "Match Finished" &&
//       latestFixture.fixture.status.long !== "Not Started"
//     ) {
//       console.log("Match Inplay.");
//       await fetchAllMatchData(latestFixtureId);
//     } else {
//       console.log("Match is not within 1 hour and is not in play");
//     }

//     res.status(200).send(`Sucessful`);
//   } catch (error) {
//     console.error("Error fetching match data:", error);
//     return res
//       .status(500)
//       .send(`Error fetching fixture data: ${error.message}`);
//   }
// });
