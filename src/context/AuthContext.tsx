"use client"; // Required for Firebase listeners and React Context

import React, { createContext, useContext, useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client"; // Ensure your firebase config is exported

const AuthContext = createContext({
  user: null,
  userLoading: true,
  userId: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // 1. Update User State
      setUser(currentUser);

      // 2. Sync Cookie (Crucial for Server Components)
      if (currentUser) {
        document.cookie = `uid=${currentUser.uid}; path=/; max-age=3600; SameSite=Lax`;
      } else {
        document.cookie =
          "uid=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
      }

      // 3. ONLY set loading to false once we have a definitive answer
      setUserLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userLoading, userId: user?.uid }}>
      {children}
    </AuthContext.Provider>
  );
};
