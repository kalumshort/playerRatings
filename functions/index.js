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
        .collection("fixtures/2024/33")
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

// exports.prevIds = onRequest(async (req, res) => {
//   const prevIds = [1208210];
//   // events
//   // statistics
//   // lineups
//   for (const fixtureId of prevIds) {
//     try {
//       const response = await axios.get(
//         `https://v3.football.api-sports.io/fixtures/events?fixture=${fixtureId}`,
//         {
//           headers: {
//             "x-rapidapi-host": "v3.football.api-sports.io",
//             "x-rapidapi-key": "e1cea611a4d193af4f01c7a61969b778",
//           },
//         }
//       );

//       const events = response.data.response;

//       await getFirestore()
//         .collection("fixtures")
//         .doc("2024")
//         .collection("data")
//         .doc(fixtureId.toString())
//         .set({ events }, { merge: true });
//     } catch (error) {
//       console.error(`Error for fixture ${fixtureId}:`, error.message);
//     }
//   }

//   res.send("Lineups added to Firebase.");
// });

exports.fetchSingleFixtureData = onRequest(async (req, res) => {
  const preIds = [];
  for (const fixtureId of preIds) {
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
        .collection("33")
        .doc(fixtureId.toString())
        .set(combinedFixtureData, { merge: true });

      console.log(`Finished ${fixtureId} `);
    } catch (error) {
      console.error(
        `Error fetching or saving data for fixture ${fixtureId}:`,
        error.stack
      );
      return res
        .status(500)
        .send(`Error fetching fixture data: ${error.message}`);
    }
  }
  res.status(200).send(`Successfull`);
});

exports.scheduledLatestTeamDataFetch = onSchedule(
  "every 5 minutes",
  async (event) => {
    const now = Math.floor(Date.now() / 1000);

    try {
      // Query the next match
      const matchesRef = getFirestore().collection(`fixtures/2024/33`);
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
// exports.function = onRequest(async (req, res) => {
//   const players = {
//     526: {
//       id: 526,
//       name: "A. Onana",
//       number: 24,
//       position: "G",
//       img: "https://resources.premierleague.com/premierleague/photos/players/110x140/p202641.png",
//     },
//     342970: {
//       id: 342970,
//       name: "L. Yoro",
//       number: 15,
//       position: "D",
//       img: "https://resources.premierleague.com/premierleague/photos/players/110x140/p550864.png",
//     },
//     2935: {
//       id: 2935,
//       name: "H. Maguire",
//       number: 5,
//       position: "D",
//       img: "https://resources.premierleague.com/premierleague/photos/players/110x140/p95658.png",
//     },
//     2467: {
//       id: 2467,
//       name: "L. Martínez",
//       number: 6,
//       position: "D",
//       img: "https://resources.premierleague.com/premierleague/photos/players/110x140/p221820.png",
//     },
//     545: {
//       id: 545,
//       name: "N. Mazraoui",
//       number: 3,
//       position: "D",
//       img: "https://resources.premierleague.com/premierleague/photos/players/110x140/p230001.png",
//     },
//     51494: {
//       id: 51494,
//       name: "M. Ugarte",
//       number: 25,
//       position: "M",
//       img: "https://resources.premierleague.com/premierleague/photos/players/110x140/p232112.png",
//     },
//     284322: {
//       id: 284322,
//       name: "K. Mainoo",
//       number: 37,
//       position: "M",
//       img: "https://resources.premierleague.com/premierleague/photos/players/110x140/p516895.png",
//     },
//     886: {
//       id: 886,
//       name: "Diogo Dalot",
//       number: 20,
//       position: "D",
//       img: "https://resources.premierleague.com/premierleague/photos/players/110x140/p216051.png",
//     },
//     157997: {
//       id: 157997,
//       name: "A. Diallo",
//       number: 16,
//       position: "F",
//       img: "https://resources.premierleague.com/premierleague/photos/players/110x140/p493250.png",
//     },
//     1485: {
//       id: 1485,
//       name: "B. Fernandes",
//       number: 8,
//       position: "M",
//       img: "https://resources.premierleague.com/premierleague/photos/players/110x140/p141746.png",
//     },
//     288006: {
//       id: 288006,
//       name: "R. Højlund",
//       number: 9,
//       position: "F",
//       img: "https://resources.premierleague.com/premierleague/photos/players/110x140/p497894.png",
//     },
//     9971: {
//       id: 9971,
//       name: "Antony",
//       number: 21,
//       position: "F",
//       img: "https://resources.premierleague.com/premierleague/photos/players/110x140/p467169.png",
//     },
//     747: {
//       id: 747,
//       name: "Casemiro",
//       number: 18,
//       position: "M",
//       img: "https://resources.premierleague.com/premierleague/photos/players/110x140/p61256.png",
//     },
//     174: {
//       id: 174,
//       name: "C. Eriksen",
//       number: 14,
//       position: "M",
//       img: "https://resources.premierleague.com/premierleague/photos/players/110x140/p80607.png",
//     },
//     70100: {
//       id: 70100,
//       name: "J. Zirkzee",
//       number: 11,
//       position: "F",
//       img: "https://resources.premierleague.com/premierleague/photos/players/110x140/p458249.png",
//     },
//     284324: {
//       id: 284324,
//       name: "A. Garnacho",
//       number: 17,
//       position: "F",
//       img: "https://resources.premierleague.com/premierleague/photos/players/110x140/p493105.png",
//     },
//     50132: {
//       id: 50132,
//       name: "A. Bayındır",
//       number: 1,
//       position: "G",
//       img: "https://resources.premierleague.com/premierleague/photos/players/110x140/p451302.png",
//     },
//     284400: {
//       id: 284400,
//       name: "T. Collyer",
//       number: 43,
//       position: "M",
//       img: "https://resources.premierleague.com/premierleague/photos/players/110x140/p490881.png",
//     },
//     18772: {
//       id: 18772,
//       name: "J. Evans",
//       number: 35,
//       position: "D",
//       img: "https://resources.premierleague.com/premierleague/photos/players/110x140/p37642.png",
//     },
//     532: {
//       id: 532,
//       name: "M. de Ligt",
//       number: 4,
//       position: "D",
//       img: "https://resources.premierleague.com/premierleague/photos/players/110x140/p209365.png",
//     },
//     889: {
//       id: 889,
//       name: "V. Lindelöf",
//       number: 2,
//       position: "D",
//       img: "https://resources.premierleague.com/premierleague/photos/players/110x140/p184667.png",
//     },
//     891: {
//       id: 891,
//       name: "L. Shaw",
//       number: 23,
//       position: "D",
//       img: "https://resources.premierleague.com/premierleague/photos/players/110x140/p106760.png",
//     },
//     2931: {
//       id: 2931,
//       name: "T. Heaton",
//       number: 22,
//       position: "G",
//       img: "https://resources.premierleague.com/premierleague/photos/players/110x140/p21205.png",
//     },
//     37145: {
//       id: 37145,
//       name: "T. Malacia",
//       number: 12,
//       position: "D",
//       grid: "3:1",
//       img: "https://resources.premierleague.com/premierleague/photos/players/110x140/p222690.png",
//     },
//     403064: {
//       id: 403064,
//       name: "H. Amass",
//       number: 41,
//       position: "D",
//       img: "https://resources.premierleague.com/premierleague/photos/players/110x140/p577974.png",
//     },
//     909: {
//       id: 909,
//       name: "M. Rashford",
//       number: 10,
//       position: "F",
//       img: "https://resources.premierleague.com/premierleague/photos/players/110x140/p176297.png",
//     },
//     153434: {
//       id: 153434,
//       name: "W. Fish",
//       number: 48,
//       position: "D",
//       img: "https://resources.premierleague.com/premierleague/photos/players/110x140/Photo-Missing.png",
//     },
//     303016: {
//       id: 303016,
//       name: "M. Oyedele",
//       number: 59,
//       position: "M",
//       img: "https://resources.premierleague.com/premierleague/photos/players/110x140/Photo-Missing.png",
//     },
//     284391: {
//       id: 284391,
//       name: "S. Murray",
//       number: 61,
//       position: "D",
//       img: "https://resources.premierleague.com/premierleague/photos/players/110x140/Photo-Missing.png",
//     },
//     396729: {
//       id: 396729,
//       name: "J. Scanlon",
//       number: 63,
//       position: "M",
//       img: "https://resources.premierleague.com/premierleague/photos/players/110x140/Photo-Missing.png",
//     },
//     19220: {
//       id: 19220,
//       name: "M. Mount",
//       number: 7,
//       position: "M",
//       img: "https://resources.premierleague.com/premierleague/photos/players/110x140/p184341.png",
//     },
//     362270: {
//       id: 362270,
//       name: "E. Wheatley",
//       number: 36,
//       position: "F",
//       img: "https://resources.premierleague.com/premierleague/photos/players/110x140/p575034.png",
//     },
//     303017: {
//       id: 303017,
//       name: "S. Mather",
//       number: 53,
//       position: "M",
//       img: "https://resources.premierleague.com/premierleague/photos/players/110x140/Photo-Missing.png",
//     },
//     383770: {
//       id: 383770,
//       name: "J. Fletcher",
//       number: 57,
//       position: "M",
//       img: "https://resources.premierleague.com/premierleague/photos/players/110x140/Photo-Missing.png",
//     },
//     284382: {
//       id: 284382,
//       name: "D. Mee",
//       number: 45,
//       position: "G",
//       img: "https://resources.premierleague.com/premierleague/photos/players/110x140/Photo-Missing.png",
//     },
//     382452: {
//       id: 382452,
//       name: "P. Dorgu",
//       number: 13,
//       position: "D",
//       img: "https://resources.premierleague.com/premierleague/photos/players/110x140/p596777.png",
//     },
//     402329: {
//       id: 402329,
//       name: "A. Heaven",
//       number: 26,
//       position: "D",
//       img: "https://resources.premierleague.com/premierleague/photos/players/110x140/p606745.png",
//     },
//     696969: {
//       id: 696969,
//       name: "Ruben Amorim",
//       position: "Manager",
//       img: "https://resources.premierleague.com/premierleague/photos/players/110x140/man53637.png",
//     },
//   };
//   const db = getFirestore();

//   Object.keys(players).forEach(async (playerId) => {
//     const player = players[playerId];
//     const playerData = {
//       img: player.img,
//       id: player.id,
//       name: player.name,
//     };

//     await db
//       .collection("playerImages")
//       .doc(playerId.toString())
//       .set(playerData, { merge: true });
//   });
//   res.status(200).send(`Success`);
// });
// exports.conversionFunction = onRequest(async (req, res) => {
//   try {
//     const sourcePath = "fixtures/2024/data";
//     const destinationPath = "fixtures/2024/33";

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
//     const matchesRef = getFirestore().collection(`fixtures/2024/33`);
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
