"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import {
  User,
  getAuth,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";

// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────

interface AuthContextType {
  user: User | null;
  userLoading: boolean;
  userId: string | null;
  hasPasswordProvider: boolean;
  isSocialOnly: boolean;
  signOut: () => Promise<void>;
}

const defaultContext: AuthContextType = {
  user: null,
  userLoading: true,
  userId: null,
  hasPasswordProvider: false,
  isSocialOnly: true,
  signOut: async () => {
    console.warn("signOut called outside AuthProvider");
  },
};

// ────────────────────────────────────────────────
// Context
// ────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType>(defaultContext);

// ────────────────────────────────────────────────
// Custom Hook
// ────────────────────────────────────────────────

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === defaultContext) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

// ────────────────────────────────────────────────
// Provider
// ────────────────────────────────────────────────

interface AuthProviderProps {
  children: ReactNode;
  enableCookieSync?: boolean; // default: true – disable if using server-side cookies
}

export const AuthProvider = ({
  children,
  enableCookieSync = true,
}: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  // Derived state – updates whenever user changes
  const hasPasswordProvider = useMemo(
    () => user?.providerData?.some((p) => p.providerId === "password") ?? false,
    [user],
  );

  const isSocialOnly = !hasPasswordProvider;

  // Sign-out helper – centralized and typed
  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth);
      if (enableCookieSync) {
        document.cookie =
          "uid=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
      }
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  useEffect(() => {
    // Listen to auth state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      // Optional cookie sync (useful for Next.js middleware / server components)
      if (enableCookieSync) {
        if (currentUser) {
          document.cookie = `uid=${currentUser.uid}; path=/; max-age=3600; SameSite=Lax`;
        } else {
          document.cookie =
            "uid=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
        }
      }

      // Only stop loading once we have the initial state
      setUserLoading(false);
    });

    // Cleanup
    return () => unsubscribe();
  }, [enableCookieSync]);

  const value: AuthContextType = useMemo(
    () => ({
      user,
      userLoading,
      userId: user?.uid ?? null,
      hasPasswordProvider,
      isSocialOnly,
      signOut: handleSignOut,
    }),
    [user, userLoading, hasPasswordProvider, isSocialOnly],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
