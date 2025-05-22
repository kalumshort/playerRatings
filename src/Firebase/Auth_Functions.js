import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, Timestamp, updateDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

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

export const handleCreateAccount = async ({
  email,
  password,
  groupId = "002",
}) => {
  console.log(groupId, email, password);
  try {
    // Call the Cloud Function to add the user to the group
    const functions = getFunctions();
    // Create a new user with email and password
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Get the user ID (UID)
    const userId = userCredential.user.uid;

    const addUserToGroup = httpsCallable(functions, "addUserToGroup"); // Call your addUserToGroup function
    const createUserDoc = httpsCallable(functions, "createUserDoc");

    await createUserDoc({ userId, email });

    await addUserToGroup({
      groupId: groupId, // The group to add the user to
      userId: userId, // The user's UID
      userData: {
        email: email,
        role: "user", // Optionally, you could pass more data like role, username, etc.
      },
    });
  } catch (err) {
    console.error("Error creating account:", err);
  }
};

export const handleAddUserToGroup = async ({ userData, groupId }) => {
  try {
    const functions = getFunctions();

    const addUserToGroup = httpsCallable(functions, "addUserToGroup"); // Call your addUserToGroup function

    await addUserToGroup({
      groupId: groupId, // The group to add the user to
      userId: userData.uid, // The user's UID
      userData: {
        email: userData.email,
        role: "user", // Optionally, you could pass more data like role, username, etc.
      },
    });

    // Return success status
    return {
      success: true,
      message: "User successfully added to the group.",
    };
  } catch (err) {
    console.error("Error adding user to group:", err);

    // Return error status
    return {
      success: false,
      message: `Error adding user to group: ${err.message}`,
    };
  }
};

export const handleCreateAccountGoogle = async ({ groupId }) => {
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
    const functions = getFunctions();
    const addUserToGroup = httpsCallable(functions, "addUserToGroup"); // Call your addUserToGroup function

    if (userDoc.exists()) {
      // User exists, just sign them in

      if (groupId) {
        if (!userDoc.data().groups.includes(groupId)) {
          await addUserToGroup({
            groupId: groupId, // The group to add the user to
            userId: userId, // The user's UID
            userData: {
              email: email,
              role: "user", // Optionally, you could pass more data like role, username, etc.
            },
          });
        }
      }

      await updateDoc(userRef, {
        lastLogin: Timestamp.fromDate(new Date()), // Update the last login timestamp
      });

      return; // You can handle the login logic here if needed
    } else {
      // Call the Cloud Function to add the user to the group

      const createUserDoc = httpsCallable(functions, "createUserDoc");

      await createUserDoc({
        userId,
        email,
        displayName: displayName,
        photoURL: photoURL,
        providerId: providerId,
      });

      await addUserToGroup({
        groupId: groupId || "002", // The group to add the user to
        userId: userId, // The user's UID
        userData: {
          email: email,
          role: "user", // Optionally, you could pass more data like role, username, etc.
        },
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

      try {
        if (userData.groups) {
          dispatch(groupDataStart());
          const groupObj = {};

          // Initialize an array to store permissions for each group
          const groupPermissions = {};

          for (let i = 0; i < userData.groups.length; i++) {
            const groupId = userData.groups[i];
            const groupRef = doc(db, "groups", groupId);
            const groupDoc = await getDoc(groupRef);

            if (groupDoc.exists()) {
              groupObj[groupId] = { ...groupDoc.data(), groupId: groupId };
              // Fetch the permissions/role of the user in the group
              const groupUserRef = doc(
                db,
                `groupUsers/${groupId}/members`,
                userId
              );
              const groupUserDoc = await getDoc(groupUserRef);
              if (groupUserDoc.exists()) {
                const groupUserData = groupUserDoc.data();

                // Save the user's permissions for this group in groupPermissions
                groupPermissions[groupId] = groupUserData.role || {}; // Assuming `permissions` is the field
              }
            } else {
              // This will log if the group doesn't exist
              console.error(
                `Group ${groupId} does not exist or the user does not have permission to access it.`
              );
            }
          }

          // Dispatch the updated user data with permissions
          dispatch(fetchUserDataSuccess({ ...userData, groupPermissions }));
          dispatch(groupDataSuccess(groupObj));
        } else {
          dispatch(fetchUserDataSuccess(userData));
        }
      } catch (err) {
        // This will show the exact error message
        console.error("Error fetching group data:", err.message);
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
  } catch (err) {
    console.error("Error updating user field:", err.message);
  }
};

export const updateGroupField = async (groupId, field, newValue) => {
  if (!groupId || !field || !newValue) {
    return;
  }

  try {
    const userRef = doc(db, "groups", groupId); // Reference to the user's Firestore document
    await updateDoc(userRef, {
      [field]: newValue, // Dynamically update the specified field
    });
  } catch (err) {
    console.error("Error updating user field:", err.message);
  }
};
