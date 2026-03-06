// lib/firebase/client.ts
// Only import in client-side code ('use client' components/hooks/pages)

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  CACHE_SIZE_UNLIMITED,
} from "firebase/firestore";
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

// Dev-time config validation
if (process.env.NODE_ENV !== "production") {
  const missing = Object.entries(firebaseConfig)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    console.warn(
      "[Firebase Client] Missing required config values:",
      missing.join(", "),
      "\nCheck .env.local or App Hosting environment variables.",
    );
  }
}

// Client debug logging
if (typeof window !== "undefined") {
  console.log("[Firebase Client] Config loaded:", {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY
      ? `${process.env.NEXT_PUBLIC_FIREBASE_API_KEY.slice(0, 6)}...`
      : "missing",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "missing",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "missing",
  });
}

// Singleton app
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Modern Firestore init with offline persistence + multi-tab support
export const clientDB = initializeFirestore(app, {
  localCache: persistentLocalCache({
    cacheSizeBytes: CACHE_SIZE_UNLIMITED,
    tabManager: persistentMultipleTabManager(),
  }),
});

// Other services
export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, "us-central1");

export default app;
