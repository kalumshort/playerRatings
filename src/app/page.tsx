// app/page.tsx
import { getAuthSession } from "@/lib/firebase/getAuth";
import { getAdminDb } from "@/lib/firebase/admin";
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
    const db = getAdminDb();
    const userDoc = await db.collection("users").doc(userId).get();

    if (userDoc.exists) {
      const rawData = userDoc.data();

      // SANITIZE: Server Components can only pass plain JSON to the client, so
      // strip Firestore Timestamps first, then convert the known date fields.
      userData = {
        ...JSON.parse(JSON.stringify(rawData)),
        lastLogin: rawData?.lastLogin?.toMillis?.() ?? null,
        createdAt: rawData?.createdAt?.toMillis?.() ?? null,
      };
    }

    if (userData?.activeGroup) {
      const groupDoc = await db
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

  // RootPage reads `userHomeGroup.slug` — keep the shape it expects, otherwise
  // its "still syncing" guard can never resolve from server data.
  return (
    <RootPage
      initialIsLoggedIn={true}
      serverUserData={{
        ...userData,
        userHomeGroup: groupSlug ? { slug: groupSlug } : null,
      }}
    />
  );
}
