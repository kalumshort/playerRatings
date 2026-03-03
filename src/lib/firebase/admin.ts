import "server-only";
import * as admin from "firebase-admin";

const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
  : undefined;

const firebaseAdminConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: privateKey,
};

function initializeAdmin() {
  // If an app already exists, use it. Otherwise, initialize.
  if (admin.apps.length > 0) {
    return admin.app();
  }

  if (!firebaseAdminConfig.projectId || !firebaseAdminConfig.privateKey) {
    throw new Error("Missing Firebase Admin environment variables.");
  }

  return admin.initializeApp({
    credential: admin.credential.cert(
      firebaseAdminConfig as admin.ServiceAccount,
    ),
  });
}

// Getters
export const getAdminDb = () => {
  const app = initializeAdmin();
  return admin.firestore(app); // Passing the app instance is safer
};

export const getAdminAuth = () => {
  const app = initializeAdmin();
  return admin.auth(app);
};
