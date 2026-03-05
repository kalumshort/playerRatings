import "server-only";
import * as admin from "firebase-admin";

function getAdminApp() {
  if (!admin.apps.length) {
    return admin.initializeApp();
  }
  return admin.app();
}

const app = getAdminApp();

export const adminDb = app.firestore();
export const adminAuth = app.auth();
