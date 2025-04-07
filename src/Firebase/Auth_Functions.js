import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore";
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
