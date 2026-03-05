import "server-only";

// Force Node to ignore the bundler and use the runtime require
const admin = eval("require('firebase-admin')");
function getAppInstance() {
  // DIAGNOSTIC: Check if secrets are actually loaded in the Cloud environment
  const hasKey = !!process.env.ADMIN_PRIVATE_KEY;
  const hasEmail = !!process.env.ADMIN_CLIENT_EMAIL;
  const hasId = !!process.env.ADMIN_PROJECT_ID;

  console.log("--- FIREBASE ADMIN DIAGNOSTICS ---");
  console.log("Has Private Key:", hasKey);
  console.log("Has Client Email:", hasEmail);
  console.log("Has Project ID:", hasId);
  console.log("----------------------------------");

  if (admin.apps.length > 0) return admin.app();

  if (!hasKey || !hasEmail || !hasId) {
    throw new Error(
      `Firebase Admin failed to init: Missing env vars (Key:${hasKey}, Email:${hasEmail}, ID:${hasId})`,
    );
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.ADMIN_PROJECT_ID,
      clientEmail: process.env.ADMIN_CLIENT_EMAIL,
      privateKey: process.env.ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const app = getAppInstance();

export const getAdminDb = () => admin.firestore(app);
export const getAdminAuth = () => admin.auth(app);
