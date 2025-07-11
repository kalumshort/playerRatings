// The Cloud Functions for Firebase SDK to create Cloud Functions and triggers.
const { logger } = require("firebase-functions");
// const admin = require("firebase-admin");

const { onSchedule } = require("firebase-functions/v2/scheduler");

const axios = require("axios");

// const { onDocumentCreated } = require("firebase-functions/v2/firestore");

// The Firebase Admin SDK to access Firestore.
const { initializeApp } = require("firebase-admin/app");
const {
  getFirestore,
  FieldValue,
  Timestamp,
} = require("firebase-admin/firestore");
const { fetchAllMatchData } = require("./helperFunctions");
const { onCall, HttpsError } = require("firebase-functions/https");

initializeApp();

exports.createUserDoc = onCall(async (request, context) => {
  const { data } = request;
  const { userId, email, displayName, photoURL, providerId } = data;

  if (!userId || !email) {
    throw new HttpsError("invalid-argument", "Missing userId or email");
  }

  try {
    const db = getFirestore();
    const userRef = db.collection("users").doc(userId);

    await userRef.set({
      email: email,
      createdAt: Timestamp.now(),
      isActive: true,
      lastLogin: Timestamp.now(),
      role: "user",
      displayName: displayName || null, // Optional field
      photoURL: photoURL || null, // Optional field
      providerId: providerId || null, // Optional field
    });

    return {
      success: true,
      message: `User document for ${userId} created successfully.`,
    };
  } catch (error) {
    console.error("Error creating user document:", error);
    throw new HttpsError("internal", "Unable to create user document");
  }
});
exports.addUserToGroup = onCall(async (request, context) => {
  const { data } = request; // Now we can access the `data` object correctly

  const { groupId, userId, userData } = data; // Destructure the data correctly

  try {
    const db = getFirestore(); // Use getFirestore to access Firestore
    const groupRef = db
      .collection("groupUsers")
      .doc(groupId)
      .collection("members")
      .doc(userId);

    // Add user data (could include username, email, etc.)
    await groupRef.set(userData);
    // Reference for the user data document
    const userDocRef = db.collection("users").doc(userId);

    // Update the user document to include the groupId in the groups array
    await userDocRef.update({
      groups: FieldValue.arrayUnion(groupId), // Add groupId to the array
      activeGroup: groupId, // Set the activeGroup field
    });

    return {
      success: true,
      message: `User ${userId} added to group ${groupId} and updated user data`,
    };
  } catch (error) {
    console.error("Error adding user to group: ", error);
    throw new HttpsError("internal", "Unable to add user to group");
  }
});
exports.removeUserFromGroup = onCall(async (request, context) => {
  const { data } = request; // Accessing the data from the request

  const { groupId, userId } = data; // Destructure groupId and userId from the data

  try {
    const db = getFirestore(); // Use getFirestore to access Firestore
    const groupRef = db
      .collection("groupUsers")
      .doc(groupId)
      .collection("members")
      .doc(userId);

    // Remove the user from the group by deleting their document
    await groupRef.delete();

    return {
      success: true,
      message: `User ${userId} removed from group ${groupId}`,
    };
  } catch (error) {
    console.error("Error removing user from group: ", error);
    throw new HttpsError("internal", "Unable to remove user from group");
  }
});

exports.updateFixtures = onSchedule(
  {
    schedule: "every day 00:00",
    timeoutSeconds: 240, // ⏱️ 4 minutes
    memory: "512MiB", // Optional: increase memory if needed
  },
  async (event) => {
    try {
      const SEASON = 2025;
      const LEAGUE_ID = 39; // Premier League

      // Step 1: Get all teams in the Premier League
      const teamsResponse = await axios.get(
        `https://api-football-v1.p.rapidapi.com/v3/teams`,
        {
          params: {
            league: LEAGUE_ID,
            season: SEASON,
          },
          headers: {
            "x-rapidapi-key":
              "094b48b189mshadfe2267d2aa592p18a8efjsn02511bf918c6",
            "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
          },
        }
      );

      const teams = teamsResponse.data.response;

      for (const teamObj of teams) {
        const teamId = teamObj.team.id;
        const teamName = teamObj.team.name;

        logger.info(`Processing team: ${teamName} (${teamId})`);

        // Step 2: Fetch fixtures
        const fixturesResponse = await axios.get(
          `https://api-football-v1.p.rapidapi.com/v3/fixtures`,
          {
            params: {
              team: teamId,
              season: SEASON,
            },
            headers: {
              "x-rapidapi-key":
                "094b48b189mshadfe2267d2aa592p18a8efjsn02511bf918c6",
              "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
            },
          }
        );

        const fixtures = fixturesResponse.data.response;

        for (const fixtureObj of fixtures) {
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
            .collection(`fixtures/${SEASON}/${teamId}`)
            .doc(fixtureId.toString())
            .set(fixtureData, { merge: true });
        }

        logger.info(`Saved ${fixtures.length} fixtures for team ${teamName}`);

        // Step 3: Fetch squad
        const squadResponse = await axios.get(
          `https://api-football-v1.p.rapidapi.com/v3/players/squads`,
          {
            params: { team: teamId },
            headers: {
              "x-rapidapi-key":
                "094b48b189mshadfe2267d2aa592p18a8efjsn02511bf918c6",
              "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
            },
          }
        );

        const squadPlayers = squadResponse.data.response[0]?.players;

        const playerIds = squadPlayers.map((player) => player.id);

        // Fetch the existing teamSquads document from Firestore
        const teamSquadsDoc = await getFirestore()
          .collection("teamSquads")
          .doc(teamId.toString())
          .get();

        // Get the existing seasonSquad if it exists, or initialize an empty array
        const existingSeasonSquad = teamSquadsDoc.exists
          ? teamSquadsDoc.data().seasonSquad || []
          : [];

        // Merge the new players with the existing seasonSquad (prevent duplicates)
        const updatedSeasonSquad = [
          ...existingSeasonSquad,
          ...squadPlayers.filter(
            (newPlayer) =>
              !existingSeasonSquad.some(
                (existingPlayer) => existingPlayer.id === newPlayer.id
              )
          ),
        ];

        // Save both squad and manager into teamSquads
        await getFirestore()
          .collection("teamSquads")
          .doc(teamId.toString())
          .set(
            {
              activeSquad: squadPlayers,
              playerIds: playerIds,
              seasonSquad: updatedSeasonSquad,
            },
            { merge: true }
          );

        logger.info(`Saved squad and manager for ${teamName}`);
      }

      logger.info(`Finished processing all Premier League teams`);
    } catch (error) {
      logger.error("Error updating data:", error.message, error);
    }
  }
);

exports.scheduledLatestTeamDataFetch = onSchedule(
  "every 5 minutes",
  async (event) => {
    const now = Math.floor(Date.now() / 1000);

    try {
      // Query the next match
      const matchesRef = getFirestore().collection(`fixtures/2025/33`);
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

// exports.fetchLatestMatchStats = onRequest(async (req, res) => {
//   try {
//     const now = Math.floor(Date.now() / 1000);

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
//       res.status(404).send("No match found.");
//       return;
//     }

//     const nextFixtureData = nextFixture.docs[0].data();
//     const lastFixtureData = lastFixture.docs[0].data();

//     let latestFixture = null;

//     const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

//     if (lastFixtureData.matchDate.seconds * 1000 < twentyFourHoursAgo) {
//       latestFixture = nextFixtureData;
//     } else {
//       latestFixture = lastFixtureData;
//     }

//     const matchStartingTimestamp = latestFixture?.fixture?.timestamp;
//     const latestFixtureId = latestFixture?.fixture?.id;

//     if (!latestFixtureId) {
//       console.error("Error: No latest Fixture Id");
//       res.status(500).send("Error fetching match data: No latest Fixture Id.");
//       return;
//     }

//     await fetchAllMatchData(latestFixtureId);

//     console.log("Successful");
//     res.status(200).send("Successful");
//   } catch (error) {
//     console.error("Error fetching match data:", error);
//     res.status(500).send(`Error fetching match data: ${error.message}`);
//   }
// });

// exports.eventsFunction = onRequest(async (req, res) => {
//   try {
//     const matchesRef = getFirestore().collection(`fixtures/2024/33`);
//     const snapshot = await matchesRef.get();

//     if (snapshot.empty) {
//       console.log("No documents found in collection.");
//       res.status(404).send("No documents found.");
//       return;
//     }

//     snapshot.forEach(async (doc) => {
//       const fixtureData = doc.data();
//       const latestFixtureId = fixtureData?.fixture?.id;

//       if (!latestFixtureId) {
//         console.error(`Error: No fixture id found for document ${doc.id}`);
//         return;
//       }

//       await fetchAllMatchData(latestFixtureId);
//       console.log(`Fetched data for fixture: ${latestFixtureId}`);
//     });

//     console.log("Successfully fetched all match data.");
//     res.status(200).send("Successfully fetched all match data.");
//   } catch (error) {
//     console.error("Error fetching match data:", error);
//     res.status(500).send(`Error fetching match data: ${error.message}`);
//   }
// });

// Your Football API Key
// const FOOTBALL_API_KEY = "e1cea611a4d193af4f01c7a61969b778"; // Replace with your API key
// const BASE_URL = "https://api-football-v1.p.rapidapi.com/v3";
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

// exports.tetttt = onRequest(async (req, res) => {
//   try {
//     const squadResponse = await axios.get(
//       `https://api-football-v1.p.rapidapi.com/v3/players/squads`,
//       {
//         params: { team: 33 },
//         headers: {
//   "x-rapidapi-key":
//   "094b48b189mshadfe2267d2aa592p18a8efjsn02511bf918c6",
// "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
// },
//       }
//     );

//     const squadPlayers = squadResponse.data.response[0]?.players;

//     const playerIds = squadPlayers.map((player) => player.id);

//     // Fetch the existing teamSquads document from Firestore
//     const teamSquadsDoc = await getFirestore()
//       .collection("teamSquads")
//       .doc("33")
//       .get();

//     // Get the existing seasonSquad if it exists, or initialize an empty array
//     const existingSeasonSquad = teamSquadsDoc.exists
//       ? teamSquadsDoc.data().seasonSquad || []
//       : [];

//     // Merge the new players with the existing seasonSquad (prevent duplicates)
//     const updatedSeasonSquad = [
//       ...existingSeasonSquad,
//       ...squadPlayers.filter(
//         (newPlayer) =>
//           !existingSeasonSquad.some(
//             (existingPlayer) => existingPlayer.id === newPlayer.id
//           )
//       ),
//     ];

//     // Save both squad and manager into teamSquads
//     await getFirestore().collection("teamSquads").doc("33").set(
//       {
//         activeSquad: squadPlayers,
//         playerIds: playerIds,
//         seasonSquad: updatedSeasonSquad,
//       },
//       { merge: true }
//     );

//     logger.info(`Saved squad and manager for uniited`);
//     res
//       .status(200)
//       .send(`Successfully copied ${sourcePath} to ${destinationPath}`);
//   } catch (error) {
//     console.error("Error copying Firestore data:", error);
//     res.status(500).send("Internal Server Error");
//   }
// });

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
// const headers = {
//   "x-rapidapi-host": "v3.football.api-sports.io",
//   "x-rapidapi-key": "e1cea611a4d193af4f01c7a61969b778",
// };

// Fetch and Save Fixtures
// exports.updateFixturesRequest = onRequest(async (req, res) => {
//   try {
//     const response = await axios.get(
//       `https://api-football-v1.p.rapidapi.com/v3/fixtures`,
//       {
//         params: {
//           team: 33, // Example: Manchester United team ID
//           season: 2024, // Example: 2024 season
//         },
//         headers: {
//           "x-rapidapi-host": "v3.football.api-sports.io",
//           "x-rapidapi-key": "e1cea611a4d193af4f01c7a61969b778", // Your API key here
//         },
//       }
//     );
//     const fixtures = response.data.response;

//     for (const fixtureObj of fixtures) {
//       const year = fixtureObj.league.season;
//       const fixtureId = fixtureObj.fixture.id;

//       const fixtureData = {
//         fixture: fixtureObj.fixture,
//         league: fixtureObj.league,
//         teams: fixtureObj.teams,
//         goals: fixtureObj.goals,
//         score: fixtureObj.score,
//         matchDate: fixtureObj.fixture.timestamp,
//       };

//       await getFirestore()
//         .collection("fixtures")
//         .doc(year.toString())
//         .collection("data")
//         .doc(fixtureId.toString())
//         .set(fixtureData, { merge: true });
//     }

//     logger.info(`Successfully updated ${fixtures.length} fixtures.`);

//     res.status(200).send(`Successfully updated ${fixtures.length} fixtures.`);
//   } catch (error) {
//     logger.error("Error updating fixtures:", error);
//     res.status(500).send("Failed to update fixtures");
//   }
// });

// exports.prevIds = onRequest(async (req, res) => {
//   const prevIds = [1208210];
//   // events
//   // statistics
//   // lineups
//   for (const fixtureId of prevIds) {
//     try {
//       const response = await axios.get(
//         `https://api-football-v1.p.rapidapi.com/v3/fixtures/events?fixture=${fixtureId}`,
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

// exports.fetchSingleFixtureData = onRequest(async (req, res) => {
//   const preIds = [];
//   for (const fixtureId of preIds) {
//     if (!fixtureId) {
//       return res.status(400).send("Fixture ID is required");
//     }

//     try {
//       const fixtureData = await fetchFixtureData(fixtureId);

//       const fixtureStatsData = await fetchStatisticsData(fixtureId);

//       const fixtureLineupData = await fetchLineupData(fixtureId);

//       const fixtureEventsData = await fetchEventsData(fixtureId);

//       const combinedFixtureData = {
//         ...fixtureData,
//         statistics: fixtureStatsData,
//         lineups: fixtureLineupData,
//         events: fixtureEventsData,
//       };

//       const year = combinedFixtureData?.league?.season;

//       if (!year) {
//         throw new Error("League season not found in the fixture data.");
//       }

//       await getFirestore()
//         .collection("fixtures")
//         .doc(year.toString())
//         .collection("33")
//         .doc(fixtureId.toString())
//         .set(combinedFixtureData, { merge: true });

//       console.log(`Finished ${fixtureId} `);
//     } catch (error) {
//       console.error(
//         `Error fetching or saving data for fixture ${fixtureId}:`,
//         error.stack
//       );
//       return res
//         .status(500)
//         .send(`Error fetching fixture data: ${error.message}`);
//     }
//   }
//   res.status(200).send(`Successfull`);
// });
