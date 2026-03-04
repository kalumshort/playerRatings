import "server-only";

// Force Node to ignore the bundler and use the runtime require
const admin = eval("require('firebase-admin')");

function getAppInstance() {
  if (admin.apps.length > 0) return admin.app();

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const app = getAppInstance();

export const getAdminDb = () => admin.firestore(app);
export const getAdminAuth = () => admin.auth(app);
