import * as admin from "firebase-admin";

function initializeAdmin() {
  // If an app already exists, use it.
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // On Cloud Run/Firebase Hosting, this automatically finds credentials.
  // No need to pass private keys or project IDs manually!
  return admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

// Getters remain the same
export const getAdminDb = () => {
  const app = initializeAdmin();
  return admin.firestore(app);
};

export const getAdminAuth = () => {
  const app = initializeAdmin();
  return admin.auth(app);
};
