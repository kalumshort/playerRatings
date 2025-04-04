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
} from "firebase/firestore";

import { getAnalytics } from "firebase/analytics";

// Load environment variables (Optional, but recommended)
const firebaseConfig = {
  apiKey:
    process.env.REACT_APP_FIREBASE_API_KEY ||
    "AIzaSyAjX2Cg56qn2WDyp_jgJw1jpmUTIZxpkwk",
  authDomain:
    process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ||
    "player-ratings-ef06c.firebaseapp.com",
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
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

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
      console.error(`No such document! ${path}/${docId}`);
      return null;
    }
  } catch (error) {
    console.error("Error getting document: ", error);
    return null;
  }
};

export const firebaseAddDoc = async ({ path, data }) => {
  try {
    const docRef = await addDoc(collection(db, path), data);
    console.log("Document written with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
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

    // Sanitize data
    const sanitizedData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined)
    );

    // Firestore reference and write
    const docRef = doc(db, path, docId);
    await setDoc(docRef, sanitizedData, { merge });
    console.log("Document successfully written/updated!");
  } catch (e) {
    console.error("Error setting document: ", e);
  }
};

export const handlePredictTeamSubmit = async ({ players, matchId }) => {
  await firebaseAddDoc({
    path: `groups/001/seasons/2024/predictions/${matchId}/teamSubmissions`,
    data: players,
  });
  await firebaseSetDoc({
    path: `groups/001/seasons/2024/predictions`,
    docId: matchId,
    data: { totalTeamSubmits: increment(1) },
  });

  for (const [key, player] of Object.entries(players)) {
    console.log(key);
    await firebaseSetDoc({
      path: `groups/001/seasons/2024/predictions`,
      docId: matchId,
      data: { totalPlayersSubmits: { [player.id]: increment(1) } },
    });
  }
};

export const handlePredictTeamScore = async (data) => {
  await firebaseSetDoc({
    path: `groups/001/seasons/2024/predictions`,
    docId: data.matchId,
    data: {
      scorePrecitions: { [data.score]: increment(1) },
      homeGoals: { [data.homeGoals]: increment(1) },
      awayGoals: { [data.awayGoals]: increment(1) },
    },
  });
};
export const handlePredictWinningTeam = async (data) => {
  await firebaseSetDoc({
    path: `groups/001/seasons/2024/predictions`,
    docId: data.matchId,
    data: {
      result: { [data.choice]: increment(1), totalVotes: increment(1) },
    },
  });
};

export const handlePredictPreMatchMotm = async (data) => {
  await firebaseSetDoc({
    path: `groups/001/seasons/2024/predictions`,
    docId: data.matchId,
    data: {
      preMatchMotm: { [data.playerId]: increment(1) },
      preMatchMotmVotes: increment(1),
    },
  });
};

export const handlePlayerRatingSubmit = async (data) => {
  await firebaseSetDoc({
    path: `groups/001/seasons/2024/playerRatings/${data.matchId}/players`,
    docId: data.playerId,
    data: {
      totalSubmits: increment(1),
      totalRating: increment(data.rating),
    },
  });
  await firebaseSetDoc({
    path: `groups/001/seasons/2024/players/${data.playerId}/matches`,
    docId: data.matchId,
    data: {
      totalSubmits: increment(1),
      totalRating: increment(data.rating),
    },
  });
  await firebaseSetDoc({
    path: `groups/001/seasons/2024/players`,
    docId: data.playerId,
    data: {
      totalSubmits: increment(1),
      totalRating: increment(data.rating),
    },
  });
};
export const handleMatchMotmVote = async (data) => {
  await firebaseSetDoc({
    path: `groups/001/seasons/2024/playerRatings`,
    docId: data.matchId,
    data: {
      motmTotalVotes: increment(data.value),
      playerVotes: {
        [data.playerId]: increment(1),
      },
    },
  });
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
