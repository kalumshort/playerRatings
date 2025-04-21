import React, { createContext, useContext, useState, useEffect } from "react";

import { getAuth, onAuthStateChanged } from "firebase/auth";

// Create the AuthContext
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userLoading, setIsLoading] = useState(true); // Add loading state

  useEffect(() => {
    const auth = getAuth(); // Initialize Firebase Auth
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // Set user state
      setIsLoading(false); // Set loading to false after user state is determined
    });

    // Clean up subscription when component unmounts
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, userLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
