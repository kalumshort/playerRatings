import { cookies } from "next/headers";

export async function getAuthSession() {
  const cookieStore = await cookies();
  const uid = cookieStore.get("uid")?.value;

  return {
    isLoggedIn: !!uid,
    userId: uid || null,
  };
}
