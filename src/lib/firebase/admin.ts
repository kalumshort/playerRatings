import "server-only";

/**
 * Runtime-loaded Firebase Admin singleton
 * Safe for Next 16 + Firebase Hosting (no turbopack hashing)
 */

let adminModule: typeof import("firebase-admin") | null = null;
let appInstance: any = null;

async function getAdmin() {
  if (!adminModule) {
    adminModule = await import("firebase-admin");
  }

  if (!appInstance) {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!projectId || !clientEmail || !privateKey) {
      console.warn(
        "Firebase Admin credentials missing. Using applicationDefault().",
      );

      appInstance = adminModule.initializeApp({
        credential: adminModule.credential.applicationDefault(),
      });
    } else {
      appInstance = adminModule.initializeApp({
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
  return admin.firestore(appInstance);
}

export async function getAdminAuth() {
  const admin = await getAdmin();
  return admin.auth(appInstance);
}
