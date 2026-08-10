import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUserIdFromSession } from "@/lib/auth-server";

export const metadata: Metadata = {
  title: "Your Profile | 11Votes",
  description: "Manage your football preferences and voting history.",
};

export default async function ProfilePage() {
  // 1. Server-side Auth Check
  // Uses the verified session cookie, so this cannot be spoofed from the client.
  const uid = await getUserIdFromSession();

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
