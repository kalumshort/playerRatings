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

  // Add this check inside your getAdminApp function
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  // If we are in a build environment (CI), we might not have these keys.
  // Return a dummy object if missing to prevent the build from crashing.
  if (!projectId || !clientEmail || !privateKey) {
    console.warn(
      "Firebase Admin credentials missing. Admin SDK will not be available.",
    );
    return admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
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
