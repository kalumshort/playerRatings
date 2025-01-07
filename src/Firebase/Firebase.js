// firebase.js
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  doc,
  setDoc,
  onSnapshot,
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
    const documents = []; // Array to store the fetched documents
    querySnapshot.forEach((doc) => {
      documents.push({ id: doc.id, ...doc.data() }); // Include the document ID and its data
    });
    return documents; // Return the array of documents
  } catch (error) {
    console.error("Error getting documents: ", error);
    return []; // Return an empty array in case of an error
  }
};

// 2. Firestore ADD Document
export const firebaseAddDoc = async ({ path, data }) => {
  try {
    const docRef = await addDoc(collection(db, path), data);
    console.log("Document written with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
};

// 3. Firestore SET Document
export const firebaseSetDoc = async ({
  path,
  docId = `${Date.now()}`,
  data = {},
  merge = true,
}) => {
  try {
    const docRef = doc(db, path, docId);
    await setDoc(docRef, data, { merge });
    console.log("Document successfully written/updated!");
  } catch (e) {
    console.error("Error setting document: ", e);
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
