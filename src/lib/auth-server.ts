// lib/auth-server.ts
import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { getAdminAuth } from "@/lib/firebase/admin";

export const SESSION_COOKIE = "session";

// Firebase caps session cookies at 14 days. 5 days keeps re-auth reasonably frequent.
export const SESSION_EXPIRES_IN_MS = 5 * 24 * 60 * 60 * 1000;

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
} as const;

/**
 * The single source of truth for server-side identity.
 *
 * The cookie is a Firebase session cookie minted by /api/session after the Admin
 * SDK verified the user's ID token, and it is verified again here on every
 * request — a client cannot forge it. `cache()` dedupes the verification across
 * all server components in a single render pass.
 */
export const getUserIdFromSession = cache(async (): Promise<string | null> => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionCookie) return null;

  try {
    // checkRevoked: true — a signed-out or disabled user loses access immediately.
    const decoded = await getAdminAuth().verifySessionCookie(
      sessionCookie,
      true,
    );
    return decoded.uid;
  } catch {
    // Expired, revoked or tampered-with cookie: treat as logged out.
    return null;
  }
});
