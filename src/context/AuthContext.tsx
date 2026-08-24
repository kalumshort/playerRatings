"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from "react";
import {
  User,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { toast } from "sonner";

// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────

interface AuthContextType {
  user: User | null;
  userLoading: boolean;
  userId: string | null;
  hasPasswordProvider: boolean;
  isSocialOnly: boolean;
  /**
   * Re-reads the current user from Firebase and forces dependent state
   * (notably `hasPasswordProvider`) to recompute. Call this after any
   * operation that mutates the user in place — linking a provider, changing
   * email — since those do not fire `onAuthStateChanged`.
   */
  refreshUser: () => Promise<void>;
  /**
   * Signs out of Firebase *and* deletes the httpOnly session cookie, in that
   * order, before resolving. Resolves `true` only when both succeeded — a
   * caller that redirects on a failed sign-out would land on a page the server
   * still considers authenticated and be bounced straight back.
   */
  signOut: () => Promise<boolean>;
}

const defaultContext: AuthContextType = {
  user: null,
  userLoading: true,
  userId: null,
  hasPasswordProvider: false,
  isSocialOnly: true,
  refreshUser: async () => {
    console.warn("refreshUser called outside AuthProvider");
  },
  signOut: async () => {
    console.warn("signOut called outside AuthProvider");
    return false;
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

async function clearSessionCookie(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/session", { method: "DELETE" });
    if (!res.ok) {
      console.error("Failed to clear session cookie:", await res.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error("Session cookie deletion error:", error);
    return false;
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
  // Firebase mutates the `User` object in place when a provider is linked, so
  // the object reference never changes and React bails out of re-rendering.
  // Bumping this counter is what actually forces derived state to recompute.
  const [authVersion, setAuthVersion] = useState(0);

  const refreshUser = useCallback(async () => {
    if (!auth.currentUser) return;
    await auth.currentUser.reload();
    setUser(auth.currentUser);
    setAuthVersion((v) => v + 1);
  }, []);

  const hasPasswordProvider = useMemo(
    () => user?.providerData?.some((p) => p.providerId === "password") ?? false,
    // authVersion is intentionally a dependency: see the comment above.
    [user, authVersion],
  );

  const isSocialOnly = !hasPasswordProvider;

  const handleSignOut = async (): Promise<boolean> => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Sign out failed:", error);
      toast.error("Sign out failed. Please try again.");
      return false;
    }

    // The cookie is what the server reads, so it has to be gone before the
    // caller navigates. onAuthStateChanged clears it too, but that fires on its
    // own schedule and the redirect would win the race.
    const cleared = await clearSessionCookie();
    if (!cleared) {
      toast.error("Sign out failed. Please try again.");
    }
    return cleared;
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
      refreshUser,
      signOut: handleSignOut,
    }),
    [user, userLoading, hasPasswordProvider, isSocialOnly, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
