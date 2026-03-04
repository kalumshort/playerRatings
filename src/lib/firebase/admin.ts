import * as admin from "firebase-admin";

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

function initializeAdmin() {
  if (admin.apps.length) return;

  if (
    !process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_CLIENT_EMAIL ||
    !privateKey
  ) {
    // ❗ DO NOT throw during build
    console.warn("Firebase Admin env vars missing — skipping init");
    return;
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

initializeAdmin();

export const adminDb =
  admin.apps.length > 0 ? admin.firestore() : (null as any);

export const adminAuth = admin.apps.length > 0 ? admin.auth() : (null as any);
