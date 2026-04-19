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
// Helpers
// ────────────────────────────────────────────────

async function mintSessionCookie(user: User): Promise<void> {
  try {
    const idToken = await user.getIdToken();
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) {
      console.error("Failed to mint session cookie:", await res.text());
    }
  } catch (error) {
    console.error("Session cookie creation error:", error);
  }
}

async function clearSessionCookie(): Promise<void> {
  try {
    await fetch("/api/auth/session", { method: "DELETE" });
  } catch (error) {
    console.error("Session cookie deletion error:", error);
  }
}

// ────────────────────────────────────────────────
// Provider
// ────────────────────────────────────────────────

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  const hasPasswordProvider = useMemo(
    () => user?.providerData?.some((p) => p.providerId === "password") ?? false,
    [user],
  );

  const isSocialOnly = !hasPasswordProvider;

  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth);
      await clearSessionCookie();
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // Mint a real httpOnly session cookie verified by Firebase Admin.
        // This replaces the old plain `uid` cookie and fixes the stale tab
        // guest bug — the server can now cryptographically verify the session.
        await mintSessionCookie(currentUser);
      } else {
        await clearSessionCookie();
      }

      setUserLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Firebase ID tokens expire every hour — refresh the session cookie
  // automatically so long-lived tabs never go stale.
  useEffect(() => {
    if (!user) return;

    const REFRESH_INTERVAL = 55 * 60 * 1000; // 55 minutes
    const interval = setInterval(async () => {
      await mintSessionCookie(user);
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [user]);

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
