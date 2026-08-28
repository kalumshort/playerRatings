import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { auth, clientDB } from "./client";
import { trackEvent } from "@/lib/analytics";

// --- Cloud Function Helpers ---
const getAuthFunctions = () => {
  const functions = getFunctions();
  return {
    addUserToGroup: httpsCallable(functions, "addUserToGroup"),
    createUserDoc: httpsCallable(functions, "createUserDoc"),
  };
};

// --- Main Actions ---

export const handleCreateAccount = async ({
  email,
  password,
  groupId,
}: any) => {
  const { createUserDoc, addUserToGroup } = getAuthFunctions();

  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );
  // The cloud functions read the uid from the verified auth context, so
  // neither call needs (or accepts) a userId in the payload.
  await createUserDoc({ email });

  if (groupId) {
    await addUserToGroup({ groupId });
  }

  // `method` is GA4's own convention for these two events, which is what makes
  // them break down by provider in the standard reports without any config.
  // No uid, email or display name goes with it — see the PII note in gtag.ts.
  trackEvent("sign_up", {
    method: "password",
    with_invite: Boolean(groupId),
  });

  return userCredential.user;
};

export const handleGoogleSignIn = async (groupId?: string) => {
  const provider = new GoogleAuthProvider();
  const { createUserDoc, addUserToGroup } = getAuthFunctions();

  const result = await signInWithPopup(auth, provider);
  const { uid: userId, email, displayName, photoURL } = result.user;

  const userRef = doc(clientDB, "users", userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    // Check if they need to be added to the group
    const userData = userSnap.data();
    if (groupId && !userData.groups?.includes(groupId)) {
      await addUserToGroup({ groupId });
    }
    // Update login timestamp
    await updateDoc(userRef, { lastLogin: Timestamp.now() });

    trackEvent("login", { method: "google" });
  } else {
    // New User via Google
    await createUserDoc({
      email,
      displayName,
      photoURL,
      providerId: result.providerId,
    });

    if (groupId) {
      await addUserToGroup({ groupId });
    }

    // The absence of a user doc is what distinguishes a first Google sign-in
    // from a returning one — Firebase Auth itself reports both identically.
    trackEvent("sign_up", {
      method: "google",
      with_invite: Boolean(groupId),
    });
  }
  return result.user;
};
