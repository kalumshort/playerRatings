"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

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
    // Only import the client SDK inside the useEffect
    const initAuth = async () => {
      const { auth } = await import("@/lib/firebase/client");
      const { onAuthStateChanged } = await import("firebase/auth");

      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);

        // Sync cookie
        if (currentUser) {
          document.cookie = `uid=${currentUser.uid}; path=/; max-age=3600; SameSite=Lax`;
        } else {
          document.cookie =
            "uid=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
        }
        setUserLoading(false);
      });
      return unsubscribe;
    };

    const unsubPromise = initAuth();
    return () => {
      unsubPromise.then((unsub) => unsub && unsub());
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userLoading, userId: user?.uid }}>
      {children}
    </AuthContext.Provider>
  );
};
