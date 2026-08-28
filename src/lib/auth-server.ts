// lib/auth-server.ts
import { cookies } from "next/headers";

export async function getUserIdFromSession() {
  // cookies() returns a Promise in newer Next.js versions
  const cookieStore = await cookies();
  return cookieStore.get("uid")?.value || null;
}
