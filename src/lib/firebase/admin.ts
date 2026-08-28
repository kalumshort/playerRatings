import * as admin from "firebase-admin";

/**
 * Firebase Admin, initialised lazily on first use.
 *
 * This used to call initializeApp({ credential: cert(...) }) at module load.
 * `cert()` throws when the ADMIN_* variables are absent, and `next build`
 * imports every route module to collect page data — so a build without
 * production service-account credentials died on
 * "Service account object must contain a string project_id property",
 * pointing at whichever route happened to be collected first.
 *
 * A build should never need production credentials: every route in this app is
 * dynamic (server-rendered per request), so nothing actually talks to Firestore
 * until a request arrives. Deferring the init to first use makes that true in
 * practice as well as in principle, and keeps CI from needing secrets it should
 * not have to hold.
 *
 * Exported as getters rather than instances so the deferral survives
 * `import { adminDb }` — a plain const would be evaluated at import time again.
 */
function getApp(): admin.app.App {
  // Guarded for HMR, which re-runs this module without clearing the app.
  if (admin.apps.length > 0) return admin.app();

  const projectId = process.env.ADMIN_PROJECT_ID;
  const clientEmail = process.env.ADMIN_CLIENT_EMAIL;
  // Firebase Admin expects the private key with actual newlines. If the env
  // var is a single line, replace the escaped \n:
  const privateKey = process.env.ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    // Named explicitly: the SDK's own message ("must contain a string
    // project_id property") names none of these and sends you hunting.
    const missing = [
      !projectId && "ADMIN_PROJECT_ID",
      !clientEmail && "ADMIN_CLIENT_EMAIL",
      !privateKey && "ADMIN_PRIVATE_KEY",
    ].filter(Boolean);

    throw new Error(
      `Firebase Admin is not configured. Missing: ${missing.join(", ")}.`,
    );
  }

  return admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });
}

/**
 * Proxies so `adminDb.collection(...)` still reads naturally at call sites
 * while the underlying app is only built on the first property access.
 */
const lazy = <T extends object>(resolve: () => T): T =>
  new Proxy({} as T, {
    get(_target, prop, receiver) {
      const value = Reflect.get(resolve() as object, prop, receiver);
      return typeof value === "function" ? value.bind(resolve()) : value;
    },
  });

const adminDb = lazy<admin.firestore.Firestore>(() => getApp().firestore());
const adminAuth = lazy<admin.auth.Auth>(() => getApp().auth());

export { adminDb, adminAuth };
