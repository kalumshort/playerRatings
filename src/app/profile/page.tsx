import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Your Profile | 11Votes",
  description: "Manage your football preferences and voting history.",
};

export default async function ProfilePage() {
  // 1. Server-side Auth Check
  // We check the cookie you set in AuthProvider to prevent a "Flash of Unauthenticated Content"
  const cookieStore = await cookies();
  const uid = cookieStore.get("uid")?.value;

  // 2. Redirect if not logged in - happens BEFORE the browser renders anything
  if (!uid) {
    redirect("/");
  }

  return (
    <main style={{ padding: "20px" }}>
      {/* We pass the uid to a Client Component. 
          This is where your Firebase listeners for user data will live.
      */}
      test
    </main>
  );
}
