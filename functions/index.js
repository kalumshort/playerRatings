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

const db = getFirestore(); // Initialize once

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
    console.log("1");
    const groupRef = db
      .collection("groupUsers")
      .doc(String(groupId))
      .collection("members")
      .doc(String(userId));
    console.log("groupRef", groupRef);
    // Add user data (could include username, email, etc.)
    await groupRef.set(userData);
    // Reference for the user data document
    const userDocRef = db.collection("users").doc(userId);

    // Update the user document to include the groupId in the groups array
    await userDocRef.update({
      groups: FieldValue.arrayUnion(String(groupId)), // Add groupId to the array
      activeGroup: String(groupId), // Set the activeGroup field
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

// exports.updateFixtures = onSchedule(
//   {
//     schedule: "every day 00:00",
//     timeoutSeconds: 240, // ⏱️ 4 minutes
//     memory: "512MiB", // Optional: increase memory if needed
//   },
//   async (event) => {
//     try {
//       const SEASON = 2025;
//       const LEAGUE_ID = 39; // Premier League

//       // Step 1: Get all teams in the Premier League
//       const teamsResponse = await axios.get(
//         `https://api-football-v1.p.rapidapi.com/v3/teams`,
//         {
//           params: {
//             league: LEAGUE_ID,
//             season: SEASON,
//           },
//           headers: {
//             "x-rapidapi-key":
//               "094b48b189mshadfe2267d2aa592p18a8efjsn02511bf918c6",
//             // "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
//           },
//         }
//       );

//       const teams = teamsResponse.data.response;

//       for (const teamObj of teams) {
//         const teamId = teamObj.team.id;
//         const teamName = teamObj.team.name;
//         // if (teamId !== 33) {
//         //   continue; // Skip teams that are not Manchester United
//         // }

//         logger.info(`Processing team: ${teamName} (${teamId})`);

//         // Step 2: Fetch fixtures
//         const fixturesResponse = await axios.get(
//           `https://api-football-v1.p.rapidapi.com/v3/fixtures`,
//           {
//             params: {
//               team: teamId,
//               season: SEASON,
//             },
//             headers: {
//               "x-rapidapi-key":
//                 "094b48b189mshadfe2267d2aa592p18a8efjsn02511bf918c6",
//               // "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
//             },
//           }
//         );

//         const fixtures = fixturesResponse.data.response;

//         for (const fixtureObj of fixtures) {
//           const fixtureId = fixtureObj.fixture.id;

//           const fixtureData = {
//             fixture: fixtureObj.fixture,
//             league: fixtureObj.league,
//             teams: fixtureObj.teams,
//             goals: fixtureObj.goals,
//             score: fixtureObj.score,
//             matchDate: fixtureObj.fixture.timestamp,
//           };

//           await getFirestore()
//             .collection(`fixtures/${SEASON}/fixtures`)
//             .doc(fixtureId.toString())
//             .set(fixtureData, { merge: true });
//         }

//         logger.info(`Saved ${fixtures.length} fixtures for team ${teamName}`);

//         // Step 3: Fetch squad
//         const squadResponse = await axios.get(
//           `https://api-football-v1.p.rapidapi.com/v3/players/squads`,
//           {
//             params: { team: teamId },
//             headers: {
//               "x-rapidapi-key":
//                 "094b48b189mshadfe2267d2aa592p18a8efjsn02511bf918c6",
//               // "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
//             },
//           }
//         );

//         const squadPlayers = squadResponse.data.response[0]?.players;

//         const playerIds = squadPlayers.map((player) => player.id);

//         // Fetch the existing teamSquads document from Firestore
//         const teamSquadsDoc = await getFirestore()
//           .collection(`teamSquads/${teamId}/season`)
//           .doc(SEASON.toString())
//           .get();

//         // Get the existing seasonSquad if it exists, or initialize an empty array
//         const existingSeasonSquad = teamSquadsDoc.exists
//           ? teamSquadsDoc.data().seasonSquad || []
//           : [];

//         // Merge the new players with the existing seasonSquad (prevent duplicates)
//         const updatedSeasonSquad = [
//           ...existingSeasonSquad,
//           ...squadPlayers.filter(
//             (newPlayer) =>
//               !existingSeasonSquad.some(
//                 (existingPlayer) => existingPlayer.id === newPlayer.id
//               )
//           ),
//         ];

//         // Save both squad and manager into teamSquads
//         await getFirestore()
//           .collection(`teamSquads/${teamId}/season`)
//           .doc(SEASON.toString())
//           .set(
//             {
//               activeSquad: squadPlayers,
//               playerIds: playerIds,
//               seasonSquad: updatedSeasonSquad,
//             },
//             { merge: true }
//           );

//         logger.info(`Saved squad and manager for ${teamName}`);
//       }

//       logger.info(`Finished processing all Premier League teams`);
//     } catch (error) {
//       logger.error("Error updating data:", error.message, error);
//     }
//   }
// );

exports.updateFixtures = onSchedule(
  {
    schedule: "every day 00:00",
    timeoutSeconds: 540,
    memory: "512MiB",
  },
  async (event) => {
    try {
      const SEASON = 2025;
      const LEAGUE_ID = 39;
      const API_KEY = "094b48b189mshadfe2267d2aa592p18a8efjsn02511bf918c6";
      const BASE_URL = "https://api-football-v1.p.rapidapi.com/v3";

      // ======================================================
      // PART 1: GET THE LIST OF TEAMS
      // ======================================================
      logger.info(`Fetching team list for League ${LEAGUE_ID}...`);

      const teamsResponse = await axios.get(`${BASE_URL}/teams`, {
        params: { league: LEAGUE_ID, season: SEASON },
        headers: { "x-rapidapi-key": API_KEY },
      });

      const teams = teamsResponse.data.response;
      const uniqueMatchesMap = {};

      logger.info(`Processing ${teams.length} teams...`);

      // ======================================================
      // PART 2: LOOP TEAMS (Fixtures + Squads)
      // ======================================================
      for (const teamObj of teams) {
        const teamId = teamObj.team.id;
        const teamName = teamObj.team.name;

        // 🛡️ Safety: Try/Catch inside loop ensures one bad team doesn't crash the whole script
        try {
          // --- A. FETCH FIXTURES ---
          const fixturesResponse = await axios.get(`${BASE_URL}/fixtures`, {
            params: { team: teamId, season: SEASON },
            headers: { "x-rapidapi-key": API_KEY },
          });

          const teamFixtures = fixturesResponse.data.response || [];

          // Add to map (Deduplication happens here automatically)
          teamFixtures.forEach((fixtureObj) => {
            const matchId = fixtureObj.fixture.id;
            uniqueMatchesMap[matchId] = {
              matchId: matchId.toString(),
              homeTeamId: fixtureObj.teams.home.id,
              awayTeamId: fixtureObj.teams.away.id,
              status: fixtureObj.fixture.status.short,
              kickoffTime: fixtureObj.fixture.date,
              timestamp: fixtureObj.fixture.timestamp,
              leagueId: fixtureObj.league.id,
              leagueName: fixtureObj.league.name,
              fixture: fixtureObj.fixture,
              league: fixtureObj.league,
              teams: fixtureObj.teams,
              goals: fixtureObj.goals,
              score: fixtureObj.score,
            };
          });

          // --- B. FETCH SQUADS ---
          const squadResponse = await axios.get(`${BASE_URL}/players/squads`, {
            params: { team: teamId },
            headers: { "x-rapidapi-key": API_KEY },
          });

          // 🛡️ Safety: Default to empty array if undefined
          const squadPlayers = squadResponse.data.response[0]?.players || [];
          const playerIds = squadPlayers.map((player) => player.id);

          const teamSquadsRef = db
            .collection(`teamSquads/${teamId}/season`)
            .doc(SEASON.toString());
          const teamSquadsDoc = await teamSquadsRef.get();

          const existingSeasonSquad = teamSquadsDoc.exists
            ? teamSquadsDoc.data().seasonSquad || []
            : [];

          const updatedSeasonSquad = [
            ...existingSeasonSquad,
            ...squadPlayers.filter(
              (newPlayer) =>
                !existingSeasonSquad.some((p) => p.id === newPlayer.id)
            ),
          ];

          await teamSquadsRef.set(
            {
              activeSquad: squadPlayers,
              playerIds: playerIds,
              seasonSquad: updatedSeasonSquad,
              lastUpdated: new Date(),
            },
            { merge: true }
          );

          logger.info(`Processed ${teamName} (Fixtures & Squad)`);
        } catch (teamError) {
          logger.error(`Error processing team ${teamName}:`, teamError.message);
          // Loop continues!
        }
      }

      // ======================================================
      // PART 3: BATCH WRITE MATCHES
      // ======================================================
      const uniqueMatchesArray = Object.values(uniqueMatchesMap);
      logger.info(
        `Writing ${uniqueMatchesArray.length} unique matches to Firestore...`
      );

      const writePromises = uniqueMatchesArray.map((matchData) => {
        return db
          .collection(`fixtures/${SEASON}/fixtures`)
          .doc(matchData.matchId)
          .set(matchData, { merge: true });
      });

      await Promise.all(writePromises);
      logger.info(`Done. Matches and Squads updated.`);
    } catch (error) {
      logger.error("Critical error in daily update:", error.message, error);
    }
  }
);

exports.scheduledLiveMatchUpdate = onSchedule(
  {
    schedule: "every 1 minutes",
    timeoutSeconds: 60,
    memory: "256MiB", // Low memory needed, we are only processing active games
  },
  async (event) => {
    try {
      const now = Math.floor(Date.now() / 1000); // Current Unix Timestamp

      // 1. DEFINE THE "HOT ZONE"
      // We look back 4 hours (active games/just finished) and ahead 1 hour (lineups)
      const LOOKBACK_SECONDS = 4 * 60 * 60;
      const LOOKAHEAD_SECONDS = 60 * 60;

      const minTime = now - LOOKBACK_SECONDS;
      const maxTime = now + LOOKAHEAD_SECONDS;

      // 2. QUERY FIRESTORE
      // Find matches scheduled in this window
      const snapshot = await db
        .collection("matches")
        .where("timestamp", ">=", minTime)
        .where("timestamp", "<=", maxTime)
        .get();

      if (snapshot.empty) {
        logger.info("No active matches found in the Hot Zone.");
        return;
      }

      const matchesToUpdate = [];

      // 3. FILTER LOGIC (Decide what actually needs an API call)
      snapshot.forEach((doc) => {
        const data = doc.data();
        const status = data.fixture.status.short; // e.g., 'NS', 'FT', '1H', '2H'
        const matchTime = data.timestamp;

        // A. Is the match already marked as FINISHED in our DB?
        // If yes, we don't need to check it again every minute.
        if (["FT"].includes(status)) {
          return; // Skip it
        }

        // B. Is it NOT STARTED yet?
        if (status === "NS") {
          // Only update if it starts within 60 mins (for Lineups)
          const timeUntilKickoff = matchTime - now;
          if (timeUntilKickoff <= 3600) {
            matchesToUpdate.push(doc.id);
          }
          return;
        }

        // C. If we are here, the status is likely LIVE (1H, 2H, HT, ET, etc.)
        // OR the status is 'NS' but the time has passed (Kickoff just happened)
        matchesToUpdate.push(doc.id);
      });

      if (matchesToUpdate.length === 0) {
        logger.info(
          "Matches found in window, but none require updates (all finished or too early)."
        );
        return;
      }

      logger.info(
        `Updating ${
          matchesToUpdate.length
        } active/upcoming matches: ${matchesToUpdate.join(", ")}`
      );

      // 4. FETCH DATA (Parallel Execution)
      // We run fetchAllMatchData for all valid matches
      const updatePromises = matchesToUpdate.map(async (fixtureId) => {
        try {
          await fetchAllMatchData({ fixtureId });
        } catch (err) {
          logger.error(`Failed to update fixture ${fixtureId}`, err);
        }
      });

      await Promise.all(updatePromises);
      logger.info("Live update cycle completed.");
    } catch (error) {
      logger.error("Error in scheduledLiveMatchUpdate:", error);
    }
  }
);

// exports.updateFixturesonCall = onRequest(async (req, res) => {
//   try {
//     const SEASON = 2025;
//     const LEAGUE_ID = 39;
//     const API_KEY = "094b48b189mshadfe2267d2aa592p18a8efjsn02511bf918c6";
//     const BASE_URL = "https://api-football-v1.p.rapidapi.com/v3";

//     // ======================================================
//     // PART 1: GET THE LIST OF TEAMS
//     // ======================================================
//     logger.info(`Fetching team list for League ${LEAGUE_ID}...`);

//     const teamsResponse = await axios.get(`${BASE_URL}/teams`, {
//       params: { league: LEAGUE_ID, season: SEASON },
//       headers: { "x-rapidapi-key": API_KEY },
//     });

//     const teams = teamsResponse.data.response;
//     const uniqueMatchesMap = {};

//     logger.info(`Processing ${teams.length} teams...`);

//     // ======================================================
//     // PART 2: LOOP TEAMS (Fixtures + Squads)
//     // ======================================================
//     for (const teamObj of teams) {
//       const teamId = teamObj.team.id;
//       const teamName = teamObj.team.name;

//       // 🛡️ Safety: Try/Catch inside loop ensures one bad team doesn't crash the whole script
//       try {
//         // --- A. FETCH FIXTURES ---
//         const fixturesResponse = await axios.get(`${BASE_URL}/fixtures`, {
//           params: { team: teamId, season: SEASON },
//           headers: { "x-rapidapi-key": API_KEY },
//         });

//         const teamFixtures = fixturesResponse.data.response || [];

//         // Add to map (Deduplication happens here automatically)
//         teamFixtures.forEach((fixtureObj) => {
//           const matchId = fixtureObj.fixture.id;
//           uniqueMatchesMap[matchId] = {
//             matchId: matchId.toString(),
//             homeTeamId: fixtureObj.teams.home.id,
//             awayTeamId: fixtureObj.teams.away.id,
//             status: fixtureObj.fixture.status.short,
//             kickoffTime: fixtureObj.fixture.date,
//             timestamp: fixtureObj.fixture.timestamp,
//             leagueId: fixtureObj.league.id,
//             leagueName: fixtureObj.league.name,
//             fixture: fixtureObj.fixture,
//             league: fixtureObj.league,
//             teams: fixtureObj.teams,
//             goals: fixtureObj.goals,
//             score: fixtureObj.score,
//           };
//         });

//         // --- B. FETCH SQUADS ---
//         const squadResponse = await axios.get(`${BASE_URL}/players/squads`, {
//           params: { team: teamId },
//           headers: { "x-rapidapi-key": API_KEY },
//         });

//         // 🛡️ Safety: Default to empty array if undefined
//         const squadPlayers = squadResponse.data.response[0]?.players || [];
//         const playerIds = squadPlayers.map((player) => player.id);

//         const teamSquadsRef = db
//           .collection(`teamSquads/${teamId}/season`)
//           .doc(SEASON.toString());
//         const teamSquadsDoc = await teamSquadsRef.get();

//         const existingSeasonSquad = teamSquadsDoc.exists
//           ? teamSquadsDoc.data().seasonSquad || []
//           : [];

//         const updatedSeasonSquad = [
//           ...existingSeasonSquad,
//           ...squadPlayers.filter(
//             (newPlayer) =>
//               !existingSeasonSquad.some((p) => p.id === newPlayer.id)
//           ),
//         ];

//         await teamSquadsRef.set(
//           {
//             activeSquad: squadPlayers,
//             playerIds: playerIds,
//             seasonSquad: updatedSeasonSquad,
//             lastUpdated: new Date(),
//           },
//           { merge: true }
//         );

//         logger.info(`Processed ${teamName} (Fixtures & Squad)`);
//       } catch (teamError) {
//         logger.error(`Error processing team ${teamName}:`, teamError.message);
//         // Loop continues!
//       }
//     }

//     // ======================================================
//     // PART 3: BATCH WRITE MATCHES
//     // ======================================================
//     const uniqueMatchesArray = Object.values(uniqueMatchesMap);
//     logger.info(
//       `Writing ${uniqueMatchesArray.length} unique matches to Firestore...`
//     );

//     const writePromises = uniqueMatchesArray.map((matchData) => {
//       return db
//         .collection(`fixtures/${SEASON}/fixtures`)
//         .doc(matchData.matchId)
//         .set(matchData, { merge: true });
//     });

//     await Promise.all(writePromises);
//     logger.info(`Done. Matches and Squads updated.`);
//     res.status(200).send("Successful");
//   } catch (error) {
//     logger.error("Critical error in daily update:", error.message, error);
//     res.status(500).send("Successful");
//   }
// });
// exports.fixtureDataConversion = onRequest(
//   {
//     timeoutSeconds: 540, // ⏱️ 9 minutes
//     memory: "512MiB",
//   },
//   async (req, res) => {
//     try {
//       logger.info("Starting conversion: Fetching matches from Firestore...");

//       // 1. Get ALL matches
//       const snapshot = await db.collection("fixtures/2025/fixtures").get();

//       if (snapshot.empty) {
//         res.status(404).send("No matches found to process.");
//         return;
//       }

//       const totalMatches = snapshot.size;
//       const now = Math.floor(Date.now() / 1000); // Current time in UNIX seconds

//       logger.info(`Found ${totalMatches} matches. Filtering...`);

//       let processedCount = 0;
//       let futureSkippedCount = 0;
//       let alreadyDoneCount = 0;

//       // 2. Loop through the documents
//       for (const doc of snapshot.docs) {
//         const fixtureId = doc.id;
//         const data = doc.data();

//         // 🛑 CHECK 1: DATA EXISTENCE
//         // If 'events' field exists, we assume we already ran the detailed fetch.
//         // We skip this to save API calls.
//         if (data.events) {
//           alreadyDoneCount++;
//           continue;
//         }

//         // 🕒 CHECK 2: TIME (Past matches only)
//         const matchTime = data.timestamp || data.matchDate;

//         // If no timestamp, or if match is in the future (> now), skip it.
//         if (!matchTime || matchTime > now) {
//           futureSkippedCount++;
//           continue;
//         }

//         try {
//           // If we reach here: Match is in the past AND has no events data.
//           // Fetch the data!
//           await fetchAllMatchData({ fixtureId });
//           processedCount++;

//           // Log progress periodically
//           if (processedCount % 20 === 0) {
//             logger.info(
//               `Processed ${processedCount} new matches... (Skipped ${alreadyDoneCount} existing)`
//             );
//           }
//         } catch (matchError) {
//           logger.error(
//             `Error processing match ${fixtureId}:`,
//             matchError.message
//           );
//         }
//       }

//       const summary = `Finished. Processed: ${processedCount} | Already Done: ${alreadyDoneCount} | Future Skipped: ${futureSkippedCount}`;
//       logger.info(summary);
//       res.status(200).send(summary);
//     } catch (error) {
//       logger.error(
//         "Critical error in fixture conversion:",
//         error.message,
//         error
//       );
//       res.status(500).send("Internal Server Error");
//     }
//   }
// );

// exports.fetchLatestMatchStats = onRequest(async (req, res) => {
//   try {
//     const now = Math.floor(Date.now() / 1000);

//     // Query the next match
//     const matchesRef = getFirestore().collection(`fixtures/2025/33`);
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
//     const matchesRef = getFirestore().collection(`fixtures/2025/33`);
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
//     const sourcePath = "fixtures/2025/data";
//     const destinationPath = "fixtures/2025/33";

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
//     const matchesRef = getFirestore().collection(`fixtures/2025/33`);
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
//           season: 2025, // Example: 2025 season
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
//         .doc("2025")
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
