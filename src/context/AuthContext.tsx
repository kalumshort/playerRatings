"use client"; // Required for Firebase listeners and React Context

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { onIdTokenChanged, type User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client"; // Ensure your firebase config is exported

interface AuthContextValue {
  user: User | null;
  userLoading: boolean;
  userId: string | null;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  userLoading: true,
  userId: null,
});

export const useAuth = () => useContext(AuthContext);

/** Hands the ID token to the server so it can mint a verified session cookie. */
async function syncSession(currentUser: User | null) {
  try {
    if (currentUser) {
      const idToken = await currentUser.getIdToken();
      await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
    } else {
      await fetch("/api/session", { method: "DELETE" });
    }
  } catch (error) {
    console.error("Failed to sync session:", error);
  }
}

export const AuthProvider = ({
  children,
  serverIsLoggedIn = false,
}: {
  children: React.ReactNode;
  /** What the server believed at render time, so we only refresh on a real mismatch. */
  serverIsLoggedIn?: boolean;
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const router = useRouter();

  // Tracks who the server currently believes we are, so a routine hourly token
  // refresh doesn't trigger a pointless re-render of every server component.
  const serverKnowsUser = useRef(serverIsLoggedIn);

  useEffect(() => {
    // onIdTokenChanged (rather than onAuthStateChanged) also fires on token
    // refresh, which keeps the session cookie from silently ageing out.
    const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
      setUser(currentUser);

      const isLoggedIn = !!currentUser;
      const serverIsStale = serverKnowsUser.current !== isLoggedIn;

      // 2. Sync the httpOnly session cookie (crucial for Server Components).
      //    The server verifies it with the Admin SDK, so it can't be forged.
      await syncSession(currentUser);
      serverKnowsUser.current = isLoggedIn;

      // 3. Only re-render server components when the server's view was wrong.
      if (serverIsStale) {
        router.refresh();
      }

      // 4. ONLY set loading to false once we have a definitive answer
      setUserLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <AuthContext.Provider
      value={{ user, userLoading, userId: user?.uid ?? null }}
    >
      {children}
    </AuthContext.Provider>
  );
};
