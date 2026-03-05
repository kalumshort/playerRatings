// import { adminDb } from "./admin";

// export const migrateToLeagueTeams = async () => {

//   const usersRef = adminDb.collection("users");
//   const snapshot = await usersRef.get();

//   // Firestore batches have a limit of 500 operations.
//   // If you have >500 users, we'd need a loop, but for now, this is the clean way.
//   const batch = db.batch();
//   let count = 0;

//   snapshot.forEach((doc) => {
//     const data = doc.data();

//     // Condition: Only migrate if they HAVE an activeGroup but DON'T have leagueTeams yet
//     if (data.activeGroup && !data.leagueTeams) {
//       const newLeagueStructure = {
//         leagueTeams: {
//           "premier-league": data.activeGroup, // Move current string here
//           "la-liga": null, // Placeholder for future expansion
//         },
//         // We keep 'activeGroup' for backward compatibility during the transition
//       };

//       batch.set(doc.ref, newLeagueStructure, { merge: true });
//       count++;
//     }
//   });

//   if (count === 0) {
//     return { message: "No users required migration." };
//   }

//   await batch.commit();
//   return {
//     message: `Successfully migrated ${count} users to leagueTeams structure.`,
//   };
// };
