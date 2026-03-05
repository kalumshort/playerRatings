import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { auth, clientDB } from "./client";

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
  const userId = userCredential.user.uid;

  await createUserDoc({ userId, email });

  if (groupId) {
    await addUserToGroup({
      groupId,
      userId,
      userData: { email, role: "user" },
    });
  }
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
      await addUserToGroup({
        groupId,
        userId,
        userData: { email, role: "user" },
      });
    }
    // Update login timestamp
    await updateDoc(userRef, { lastLogin: Timestamp.now() });
  } else {
    // New User via Google
    await createUserDoc({
      userId,
      email,
      displayName,
      photoURL,
      providerId: result.providerId,
    });

    if (groupId) {
      await addUserToGroup({
        groupId,
        userId,
        userData: { email, role: "user" },
      });
    }
  }
  return result.user;
};
