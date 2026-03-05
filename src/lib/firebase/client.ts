import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions"; // 1. Import the service

const firebaseConfig = {
  apiKey: process.env.CLIENT_API_KEY,
  authDomain: process.env.CLIENT_AUTH_DOMAIN,
  projectId: process.env.PROJECT_ID,
  storageBucket: process.env.CLIENT_STORAGE_BUCKET,
  messagingSenderId: process.env.CLIENT_MESSAGING_SENDER_ID,
  appId: process.env.CLIENT_APP_ID,
  measurementId: process.env.CLIENT_MEASUREMENT_ID,
};
if (typeof window !== "undefined") {
  console.log("DEBUG_API_KEY_LENGTH:", process.env.CLIENT_API_KEY?.length);
}
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const clientDB = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// 2. Initialize Functions

export const functions = getFunctions(app, "us-central1");
export default app;
