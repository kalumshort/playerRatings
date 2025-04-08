import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, setDoc, Timestamp, updateDoc } from "firebase/firestore";
import { auth, db } from "./Firebase";

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
    console.log("User created with ID:", userId);

    // Store important user information in Firestore
    await setDoc(doc(db, "users", userId), {
      email: email, // Store the user's email
      createdAt: Timestamp.fromDate(new Date()), // Timestamp when the account was created
      isActive: true, // Mark the user as active by default
      lastLogin: Timestamp.fromDate(new Date()), // Timestamp for the first login (could be updated later)
      role: "user", // Default role (you can change to 'admin' or other roles if needed)
    });

    alert("Account created successfully! User ID: " + userId);
  } catch (err) {
    console.error("Error creating account:", err);
    alert("Error creating account: " + err.message); // Display error to user
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
      });
    }
  } catch (err) {
    console.error("Error creating account:", err);
    alert("Error creating account: " + err.message); // Display error to user
  }
};
