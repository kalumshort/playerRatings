import "server-only";
import * as admin from "firebase-admin";

/**
 * We use a dedicated function to initialize the app only once.
 * By using the standard import, we ensure the library is loaded
 * by the Node.js runtime correctly.
 */
function getAppInstance() {
  // Check if already initialized
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // Use a temporary variable to hold the formatted key
  // Replace ONLY if the key exists and contains escaped newlines
  const rawKey = process.env.ADMIN_PRIVATE_KEY;
  if (!rawKey) {
    throw new Error("Missing ADMIN_PRIVATE_KEY environment variable.");
  }

  const privateKey = rawKey.includes("\\n")
    ? rawKey.replace(/\\n/g, "\n")
    : rawKey;

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.ADMIN_PROJECT_ID,
      clientEmail: process.env.ADMIN_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });
}

// Initialize and export the services
const app = getAppInstance();

export const adminDb = admin.firestore(app);
export const adminAuth = admin.auth(app);
