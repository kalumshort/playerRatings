import "server-only";

/**
 * Fully safe Firebase Admin singleton
 * Compatible with:
 * - Next 16
 * - Turbopack
 * - ESM
 * - Firebase Hosting
 */

let adminModule: any = null;

async function getAdmin() {
  if (!adminModule) {
    const imported = await import("firebase-admin");
    adminModule = imported.default ?? imported; // <-- KEY FIX
  }

  if (!adminModule.apps.length) {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!projectId || !clientEmail || !privateKey) {
      adminModule.initializeApp({
        credential: adminModule.credential.applicationDefault(),
      });
    } else {
      adminModule.initializeApp({
        credential: adminModule.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    }
  }

  return adminModule;
}

export async function getAdminDb() {
  const admin = await getAdmin();
  return admin.firestore();
}

export async function getAdminAuth() {
  const admin = await getAdmin();
  return admin.auth();
}
