// app/page.tsx
import { getAuthSession } from "@/lib/firebase/getAuth";
import { adminDb } from "@/lib/firebase/admin";
import RootPage from "@/components/client/RootPage";
import { redirect } from "next/navigation";

export default async function Page() {
  const { isLoggedIn, userId } = await getAuthSession();

  if (!isLoggedIn || !userId) {
    return <RootPage initialIsLoggedIn={false} serverUserData={null} />;
  }

  let groupSlug = null;
  let userData = null;

  try {
    const userDoc = await adminDb.collection("users").doc(userId).get();

    if (userDoc.exists) {
      const rawData = userDoc.data();

      // SANITIZE: Convert Firebase Timestamps to plain numbers or strings
      userData = {
        ...rawData,
        // Convert specific fields if you know them
        lastLogin: rawData?.lastLogin?.toMillis() || null,
        createdAt: rawData?.createdAt?.toMillis() || null,
        // Or just convert the whole object to be safe:
        ...JSON.parse(JSON.stringify(rawData)),
      };
    }

    if (userData?.activeGroup) {
      const groupDoc = await adminDb
        .collection("groups")
        .doc(userData.activeGroup)
        .get();
      if (groupDoc.exists) {
        groupSlug = groupDoc.data()?.slug;
      }
    }
  } catch (error) {
    // Check if the error is actually a redirect (though moving redirect outside
    // is cleaner, this is a safe way to handle try/catch in Next.js)
    console.error("Data fetch error:", error);
  }

  // --- 🚦 REDIRECTS MUST HAPPEN OUTSIDE TRY/CATCH ---
  if (groupSlug) {
    redirect(`/${groupSlug}`);
  }

  return (
    <RootPage
      initialIsLoggedIn={true}
      serverUserData={{ ...userData, groupSlug }}
    />
  );
}
