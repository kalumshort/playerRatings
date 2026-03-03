import "server-only";
import * as admin from "firebase-admin";

/**
 * Singleton Pattern for Firebase Admin
 * Ensures the SDK is initialized only once to prevent memory leaks
 * and connection exhaustion in serverless environments.
 */

// Use a global to persist the app instance across function warm-starts
const globalForAdmin = global as typeof global & { adminApp: admin.app.App };

function getAdminApp(): admin.app.App {
  if (globalForAdmin.adminApp) {
    return globalForAdmin.adminApp;
  }

  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || !privateKey || !clientEmail) {
    throw new Error("Missing Firebase Admin environment variables.");
  }

  const app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  globalForAdmin.adminApp = app;
  return app;
}

// Initialize once at the module level
const app = getAdminApp();

// Export the instances
export const getAdminDb = () => admin.firestore(app);
export const getAdminAuth = () => admin.auth(app);
