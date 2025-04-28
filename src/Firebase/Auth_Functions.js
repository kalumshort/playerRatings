import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, setDoc, Timestamp, updateDoc } from "firebase/firestore";
import { auth, db } from "./Firebase";
import {
  fetchUserDataFailure,
  fetchUserDataStart,
  fetchUserDataSuccess,
} from "../redux/Reducers/userDataReducer";
import {
  groupDataFailure,
  groupDataStart,
  groupDataSuccess,
} from "../redux/Reducers/groupReducer";

export const handleCreateAccount = async ({ email, password }) => {
  try {
    // Create a new user with email and password
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Get the user ID (UID)
    const userId = userCredential.user.uid;

    // Store important user information in Firestore
    await setDoc(doc(db, "users", userId), {
      email: email, // Store the user's email
      createdAt: Timestamp.fromDate(new Date()), // Timestamp when the account was created
      isActive: true, // Mark the user as active by default
      lastLogin: Timestamp.fromDate(new Date()), // Timestamp for the first login (could be updated later)
      role: "user", // Default role (you can change to 'admin' or other roles if needed)
      groups: ["002"], //UnitedBetaGroup
      activeGroup: "002",
    });
  } catch (err) {
    console.error("Error creating account:", err);
  }
};

export const handleCreateAccountGoogle = async () => {
  const provider = new GoogleAuthProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Get user information from Google
    const userId = user.uid;
    const email = user.email;
    const displayName = user.displayName; // User's display name
    const photoURL = user.photoURL; // User's profile picture URL
    const providerId = user.providerData[0].providerId; // Google provider id

    // Check if the user already exists in Firestore by email or UID
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      // User exists, just sign them in

      await updateDoc(userRef, {
        lastLogin: Timestamp.fromDate(new Date()), // Update the last login timestamp
      });

      return; // You can handle the login logic here if needed
    } else {
      await setDoc(userRef, {
        email: email, // Store the user's email
        displayName: displayName, // Store the user's display name
        photoURL: photoURL, // Store the user's profile picture URL
        providerId: providerId, // Store the provider id (Google)
        createdAt: Timestamp.fromDate(new Date()), // Timestamp when the account was created
        isActive: true, // Mark the user as active by default
        lastLogin: Timestamp.fromDate(new Date()), // Timestamp for the first login (could be updated later)
        role: "user", // Default role (you can change to 'admin' or other roles if needed)
        groups: ["002"], //UnitedBetaGroup
        activeGroup: "002",
      });
    }
  } catch (err) {
    console.error("Error creating account:", err);
  }
};

export const fetchUserData = (userId) => async (dispatch) => {
  dispatch(fetchUserDataStart());
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = { ...userDoc.data(), uid: userId };

      // Convert `Timestamp` fields to a serializable format (ISO string)
      if (userData.createdAt instanceof Timestamp) {
        userData.createdAt = userData.createdAt.toDate().toISOString(); // Convert to ISO string
      }

      if (userData.lastLogin instanceof Timestamp) {
        userData.lastLogin = userData.lastLogin.toDate().toISOString(); // Convert to ISO string
      }

      dispatch(fetchUserDataSuccess(userData)); // Dispatch with the serialized user data
      try {
        if (userData.groups) {
          dispatch(groupDataStart());
          const groupObj = {};

          for (let i = 0; i < userData.groups.length; i++) {
            const groupId = userData.groups[i];
            const groupRef = doc(db, "groups", groupId);
            const groupDoc = await getDoc(groupRef);

            if (groupDoc.exists()) {
              groupObj[groupId] = { ...groupDoc.data(), groupId: groupId };
            }

            console.log(groupDoc.data());
          }

          dispatch(groupDataSuccess(groupObj));
        }
      } catch (err) {
        dispatch(groupDataFailure(err.message));
      }
    } else {
      dispatch(fetchUserDataFailure("User not found"));
    }
  } catch (err) {
    dispatch(fetchUserDataFailure(err.message)); // Dispatch failure action on error
  }
};

export const updateUserField = async (userId, field, newValue) => {
  if (!userId || !field || !newValue) {
    return;
  }

  try {
    const userRef = doc(db, "users", userId); // Reference to the user's Firestore document
    await updateDoc(userRef, {
      [field]: newValue, // Dynamically update the specified field
    });
    console.log(`Successfully updated ${field} to ${newValue}`);
  } catch (err) {
    console.error("Error updating user field:", err.message);
  }
};
