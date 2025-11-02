// firebase.js
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  addDoc,
  doc,
  setDoc,
  increment,
  updateDoc,
  query,
  where,
  deleteDoc,
} from "firebase/firestore";

import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

// Load environment variables (Optional, but recommended)
const firebaseConfig = {
  apiKey:
    process.env.REACT_APP_FIREBASE_API_KEY ||
    "AIzaSyAjX2Cg56qn2WDyp_jgJw1jpmUTIZxpkwk",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "11votes.com",
  projectId:
    process.env.REACT_APP_FIREBASE_PROJECT_ID || "player-ratings-ef06c",
  storageBucket:
    process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ||
    "player-ratings-ef06c.appspot.com",
  messagingSenderId:
    process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "68709045241",
  appId:
    process.env.REACT_APP_FIREBASE_APP_ID ||
    "1:68709045241:web:3780a64d60b50b529d2328",
  measurementId:
    process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-CSGCEQML6F",
};

// Initialize Firebase app and services
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

export { auth };
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
export const storage = getStorage(app);
export const functions = getFunctions(app); // Get Firebase Functions

// Check if you're running locally (in development mode)
// if (window.location.hostname === "localhost") {
//   // Use the emulator for local development
//   connectFunctionsEmulator(functions, "localhost", 5001); // Adjust port if necessary
// }
// Generates a unique key for new documents
export const newDocKey = Date.now();

export const firebaseGetCollecion = async (path) => {
  try {
    const querySnapshot = await getDocs(collection(db, path));
    const documents = {};
    querySnapshot.forEach((doc) => {
      documents[doc.id] = { ...doc.data(), id: doc.id };
    });
    return documents; // Return the array of documents
  } catch (error) {
    console.error("Error getting documents: ", error);
    return []; // Return an empty array in case of an error
  }
};

export const firebaseGetDocument = async (path, docId) => {
  try {
    const docRef = doc(db, path, docId);

    const docSnapshot = await getDoc(docRef);

    if (docSnapshot.exists()) {
      return { id: docSnapshot.id, ...docSnapshot.data() };
    } else {
      console.log("No such document!", path, docId);
      return null;
    }
  } catch (error) {
    console.error("Error getting document: ", error);
    return null;
  }
};

export const firebaseAddDoc = async ({ path, data, id = null }) => {
  try {
    let docRef;

    if (id) {
      // If an ID is provided, set the document with the given ID
      const docRefWithId = doc(collection(db, path), id);
      await setDoc(docRefWithId, data);
      docRef = docRefWithId;
    } else {
      // Otherwise, let Firestore auto-generate an ID
      docRef = await addDoc(collection(db, path), data);
    }

    // Return success status with document data and ID
    const docData = {
      success: true,
      message: `Document successfully added with ID ${docRef.id}`,
      id: docRef.id,
      ...data,
    };

    return docData; // Return document data including ID and success message
  } catch (e) {
    console.error("Error adding document: ", e);

    // Return error status with error message
    return {
      success: false,
      message: `Error adding document: ${e.message}`,
    };
  }
};

export const firebaseDeleteDoc = async ({ path, id }) => {
  try {
    // Reference to the document to delete
    const docRef = doc(db, path, id);

    // Delete the document
    await deleteDoc(docRef);
    console.log(`Document with ID ${id} successfully deleted`);

    // Return success status with some result data
    return {
      success: true,
      message: `Document with ID ${id} successfully deleted`,
      deletedId: id, // Returning the ID of the deleted document
    };
  } catch (e) {
    console.error("Error deleting document: ", e);

    // Return error status with error message
    return {
      success: false,
      message: `Error deleting document: ${e.message}`,
    };
  }
};

export const firebaseSetDoc = async ({
  path,
  docId = `${Date.now()}`,
  data = {},
  merge = true,
}) => {
  try {
    // Validate inputs
    if (!path || typeof path !== "string") {
      throw new Error("Invalid path provided.");
    }
    if (!docId || typeof docId !== "string") {
      throw new Error("Invalid docId provided.");
    }

    // Sanitize data: Remove any undefined values
    const sanitizedData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined)
    );

    // Firestore reference and write
    const docRef = doc(db, path, docId);
    await setDoc(docRef, sanitizedData, { merge });

    // Return success status with the document ID and a success message
    return {
      success: true,
      message: `Document with ID ${docId} successfully set`,
      id: docId,
      ...sanitizedData, // Return the sanitized data along with success details
    };
  } catch (e) {
    console.error("Error setting document: ", e);

    // Return error status with error message
    return {
      success: false,
      message: `Error setting document: ${e.message}`,
    };
  }
};

export const firebaseUpdateDoc = async ({ path, docId, data = {} }) => {
  try {
    // Validate inputs
    if (!path || typeof path !== "string") {
      throw new Error("Invalid path provided.");
    }
    if (!docId || typeof docId !== "string") {
      throw new Error("Invalid docId provided.");
    }

    // Firestore reference to the document
    const docRef = doc(db, path, docId);

    // Update the document (merge new data)
    await updateDoc(docRef, data);

    // Return success status with the document ID and a success message
    return {
      success: true,
      message: `Document with ID ${docId} successfully updated`,
      id: docId,
      updatedData: data, // Optionally include the updated data
    };
  } catch (e) {
    console.error("Error updating document: ", e);

    // Return error status with the error message
    return {
      success: false,
      message: `Error updating document: ${e.message}`,
    };
  }
};
export const firebaseUpdateOrSetDoc = async ({
  path,
  docId,
  data = {},
  timestamp = Date.now(),
}) => {
  try {
    // Validate inputs
    if (!path || typeof path !== "string") {
      throw new Error("Invalid path provided.");
    }
    if (!docId || typeof docId !== "string") {
      throw new Error("Invalid docId provided.");
    }

    // Firestore reference to the document
    const docRef = doc(db, path, docId);

    // Check if the document exists
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      // Document exists, update it
      await updateDoc(docRef, data);
    } else {
      // Document doesn't exist, create it with timestamp
      await setDoc(docRef, { timestamp });

      // Then update the document with the data
      await updateDoc(docRef, data);
    }
  } catch (e) {
    console.error("Error updating or creating document: ", e);
  }
};

export const handlePredictTeamSubmit = async ({
  players,
  matchId,
  groupId,
  userId,
  currentYear,
}) => {
  // await firebaseAddDoc({
  //   path: `groups/${groupId}/seasons/2025/predictions/${matchId}/teamSubmissions`,
  //   data: players,
  // });
  // await firebaseSetDoc({
  //   path: `groups//${groupId}/seasons/2025/predictions/${matchId}/teamSubmissions`,
  //   docId: matchId,
  //   data: { totalTeamSubmits: increment(1) },
  // });

  for (const [key, player] of Object.entries(players)) {
    console.log(key);
    await firebaseSetDoc({
      path: `groups/${groupId}/seasons/${currentYear}/predictions`,
      docId: matchId,
      data: { totalPlayersSubmits: { [player.id]: increment(1) } },
    });
  }

  await firebaseSetDoc({
    path: `groups/${groupId}/seasons/${currentYear}/predictions`,
    docId: matchId,
    data: { totalTeamSubmits: increment(1) },
  });

  await firebaseUpdateOrSetDoc({
    path: `users/${userId}/groups/${groupId}/seasons/${currentYear}/matches`,
    docId: matchId,
    data: { teamPrediction: players },
  });
};

export const handlePredictTeamScore = async (data) => {
  await firebaseSetDoc({
    path: `groups/${data.groupId}/seasons/${data.currentYear}/predictions`,
    docId: data.matchId,
    data: {
      scorePredictions: { [data.score]: increment(1) },
      homeGoals: { [data.homeGoals]: increment(1) },
      awayGoals: { [data.awayGoals]: increment(1) },
    },
  });
  await firebaseUpdateOrSetDoc({
    path: `users/${data.userId}/groups/${data.groupId}/seasons/${data.currentYear}/matches`,
    docId: data.matchId,
    data: { ScorePrediction: data.score },
  });
};

export const handleSeasonPredictions = async (data) => {
  for (const [questionKey, answer] of Object.entries(data.predictions)) {
    await firebaseSetDoc({
      path: `groups/${data.groupId}/seasons/${data.currentYear}/seasonPredictions`,
      docId: questionKey,
      data: {
        [answer]: increment(1),
        totalSubmits: increment(1),
      },
    });
  }
  await firebaseSetDoc({
    path: `users/${data.userId}/groups/${data.groupId}/seasons`,
    docId: `${data.currentYear}`,
    data: { seasonPredictions: data.predictions },
  });
};

export const handleFixtureMood = async ({
  groupId,
  currentYear,
  matchId,
  timeElapsed,
  moodKey,
}) => {
  try {
    if (!groupId || !currentYear || !matchId || !timeElapsed || !moodKey) {
      throw new Error("Missing required parameters");
    }

    const timestampKey = String(timeElapsed);

    const result = await firebaseSetDoc({
      path: `groups/${groupId}/seasons/${currentYear}/fixtureMoods`,
      docId: matchId,
      data: { [`${timestampKey}`]: { [moodKey]: increment(1) } },
      merge: true,
    });

    return result;
  } catch (error) {
    console.error("Error updating fixture mood:", error);
    return { success: false, message: error.message };
  }
};

export const handlePredictWinningTeam = async (data) => {
  await firebaseSetDoc({
    path: `groups/${data.groupId}/seasons/${data.currentYear}/predictions`,
    docId: data.matchId,
    data: {
      result: { [data.choice]: increment(1), totalVotes: increment(1) },
    },
  });
  await firebaseUpdateOrSetDoc({
    path: `users/${data.userId}/groups/${data.groupId}/seasons/${data.currentYear}/matches`,
    docId: data.matchId,
    data: { result: data.choice },
  });
};

export const handlePredictPreMatchMotm = async (data) => {
  await firebaseSetDoc({
    path: `groups/${data.groupId}/seasons/${data.currentYear}/predictions`,
    docId: data.matchId,
    data: {
      preMatchMotm: { [data.playerId]: increment(1) },
      preMatchMotmVotes: increment(1),
    },
  });
  await firebaseUpdateOrSetDoc({
    path: `users/${data.userId}/groups/${data.groupId}/seasons/${data.currentYear}/matches`,
    docId: data.matchId,
    data: { preMatchMotm: data.playerId },
  });
};

export const handlePlayerRatingSubmit = async (data) => {
  await firebaseSetDoc({
    path: `groups/${data.groupId}/seasons/${data.currentYear}/playerRatings/${data.matchId}/players`,
    docId: data.playerId,
    data: {
      totalSubmits: increment(1),
      totalRating: increment(data.rating),
    },
  });

  await firebaseUpdateOrSetDoc({
    path: `users/${data.userId}/groups/${data.groupId}/seasons/${data.currentYear}/matches`,
    docId: data.matchId,
    data: { [`players.${data.playerId}`]: data.rating },
  });

  await firebaseSetDoc({
    path: `groups/${data.groupId}/seasons/${data.currentYear}/players/${data.playerId}/matches`,
    docId: data.matchId,
    data: {
      totalSubmits: increment(1),
      totalRating: increment(data.rating),
    },
  });

  await firebaseSetDoc({
    path: `groups/${data.groupId}/seasons/${data.currentYear}/players`,
    docId: data.playerId,
    data: {
      totalSubmits: increment(1),
      totalRating: increment(data.rating),
    },
  });
};

export const handleMatchMotmVote = async (data) => {
  await firebaseSetDoc({
    path: `groups/${data.groupId}/seasons/${data.currentYear}/playerRatings`,
    docId: data.matchId,
    data: {
      motmTotalVotes: increment(data.value),
      playerVotes: {
        [data.playerId]: increment(1),
      },
    },
  });

  await firebaseUpdateOrSetDoc({
    path: `users/${data.userId}/groups/${data.groupId}/seasons/${data.currentYear}/matches`,
    docId: data.matchId,
    data: { motm: data.playerId, ratingsSubmitted: true },
  });
};

export const fetchInviteLink = async (group) => {
  if (!group || !group.id) return; // Ensure group and its ID exist

  // Create a reference to the groupInviteLinks collection
  const inviteRef = collection(db, "groupInviteLinks");

  // Create a query to fetch the invite link where groupId matches group.id
  const q = query(inviteRef, where("groupId", "==", group.id));

  try {
    // Get the documents that match the query
    const querySnapshot = await getDocs(q);

    // If we have matching documents, extract the first one
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() }; // Set the invite link
    } else {
      console.log("No invite link found for this group.");
    }
  } catch (error) {
    console.error("Error fetching invite link:", error);
  }
};

// // 4. Firestore Collection Listener Component
// export const CollectionListener = ({ path }) => {
//   const dispatch = useDispatch();

//   React.useEffect(() => {
//     const unsubscribe = onSnapshot(collection(db, path), (querySnapshot) => {
//       const plans = [];
//       querySnapshot.forEach((doc) => {
//         plans.push({ ...doc.data(), id: doc.id });
//       });
//       dispatch(addPlan(plans));
//     });

//     // Cleanup listener on unmount
//     return () => unsubscribe();
//   }, [dispatch, path]);

//   return null;
// };
