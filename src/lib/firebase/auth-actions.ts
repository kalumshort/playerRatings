import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { auth, db, functions } from "./client";

// --- Cloud Function Helpers ---
// Uses the region-configured `functions` instance from ./client rather than a
// fresh getFunctions() call, so every callable resolves to the same backend.
const getAuthFunctions = () => ({
  addUserToGroup: httpsCallable(functions, "addUserToGroup"),
  createUserDoc: httpsCallable(functions, "createUserDoc"),
});

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
  await createUserDoc({ email });

  // The callable derives the uid from the verified auth context and fixes the
  // role server-side, so neither is sent from here.
  if (groupId) {
    await addUserToGroup({ groupId });
  }
  return userCredential.user;
};

export const handleGoogleSignIn = async (groupId?: string) => {
  const provider = new GoogleAuthProvider();
  const { createUserDoc, addUserToGroup } = getAuthFunctions();

  const result = await signInWithPopup(auth, provider);
  const { uid: userId, email, displayName, photoURL } = result.user;

  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    // Check if they need to be added to the group
    const userData = userSnap.data();
    if (groupId && !userData.groups?.includes(groupId)) {
      await addUserToGroup({ groupId });
    }
    // Update login timestamp
    await updateDoc(userRef, { lastLogin: Timestamp.now() });
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
  }
  return result.user;
};
