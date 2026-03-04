import "server-only";
import * as admin from "firebase-admin";

// We use a singleton pattern that relies on native module resolution
const getAdminApp = () => {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    return admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
};

const app = getAdminApp();

export const getAdminDb = () => admin.firestore(app);
export const getAdminAuth = () => admin.auth(app);
