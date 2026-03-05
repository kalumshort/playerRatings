// lib/firebase/client.ts
// Only import in client-side code ('use client' components/hooks/pages)

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager, // ← Import this for multi-tab sync
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
  databaseURL:
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
    (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
      ? `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`
      : undefined),
};

// Dev-time config validation
if (process.env.NODE_ENV !== "production") {
  const missing = Object.entries(firebaseConfig)
    .filter(([key, value]) => key !== "databaseURL" && !value)
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
      ? `${process.env.NEXT_PUBLIC_FIREBASE_API_KEY.slice(0, 6)}... (length: ${process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.length ?? 0})`
      : "missing",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "missing",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "missing",
    databaseURL: firebaseConfig.databaseURL ?? "not set",
  });
}

// Singleton app
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Modern Firestore init with offline persistence + multi-tab support
export const clientDB = initializeFirestore(app, {
  localCache: persistentLocalCache({
    cacheSizeBytes: CACHE_SIZE_UNLIMITED, // or e.g. 100 * 1024 * 1024 for 100 MB
    tabManager: persistentMultipleTabManager(), // ← Enables automatic multi-tab synchronization
  }),
});

console.log(
  "[Firebase Client] Initialized with PersistentLocalCache (multi-tab support enabled)",
);

// Other services
export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, "us-central1");

export default app;
