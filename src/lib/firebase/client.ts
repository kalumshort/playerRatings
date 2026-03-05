// lib/firebase/client.ts  (or wherever this file lives)
// This file should ONLY be imported in client components / pages / hooks

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Optional but very helpful: validate config in development
if (process.env.NODE_ENV !== "production") {
  const missing = Object.entries(firebaseConfig)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    console.warn(
      "[Firebase Client] Missing config values:",
      missing.join(", "),
      "\nMake sure NEXT_PUBLIC_FIREBASE_* variables are set in .env.local or App Hosting environment variables.",
    );
  }
}

// Debug in browser console (only runs client-side)
if (typeof window !== "undefined") {
  console.log(
    "[Firebase Client] API Key length:",
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.length ?? "undefined",
  );
  console.log(
    "[Firebase Client] Project ID:",
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "undefined",
  );
  console.log(
    "[Firebase Client] Auth Domain:",
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "undefined",
  );
}

// Initialize (singleton pattern - safe in Next.js)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Client-side services
export const clientDB = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, "us-central1");

// Optional: export the app itself if needed elsewhere
export default app;
