import "server-only";
import { getUserIdFromSession } from "@/lib/auth-server";

/**
 * Thin wrapper over {@link getUserIdFromSession} for callers that want a
 * boolean alongside the id. Both go through the same verified session cookie.
 */
export async function getAuthSession() {
  const userId = await getUserIdFromSession();

  return {
    isLoggedIn: !!userId,
    userId,
  };
}
