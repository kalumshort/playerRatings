import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";

export async function getAuthSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;

  if (!sessionCookie) {
    return { isLoggedIn: false, userId: null };
  }

  try {
    // checkRevoked: true ensures invalidated/signed-out sessions are rejected
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    return { isLoggedIn: true, userId: decoded.uid };
  } catch {
    // Cookie exists but is expired, revoked, or tampered with
    return { isLoggedIn: false, userId: null };
  }
}
