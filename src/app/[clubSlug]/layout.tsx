import { adminDb } from "@/lib/firebase/admin";
import { notFound } from "next/navigation";
import { getAuthSession } from "@/lib/firebase/getAuth";

import GroupClientInitializer from "@/components/client/GroupClientInitializer";
import DataInitializer from "@/components/client/DataInitializer";
import { Group } from "@/lib/redux/slices/groupSlice";
import ClubBanner from "@/components/client/Widgets/ClubBanner";
import { getUserData } from "@/lib/firebase/firebase-admin-queries";
import { ClubViewProvider } from "@/context/ClubViewProvider";

export default async function ClubLayout({ children, params }) {
  const { clubSlug } = await params;

  // 1. Auth & Base Data
  const { userId } = await getAuthSession();

  // 2. Fetch Group Metadata by Slug
  const groupQuery = await adminDb
    .collection("groups")
    .where("slug", "==", clubSlug)
    .limit(1)
    .get();

  if (groupQuery.empty) notFound();

  const groupDoc = groupQuery.docs[0];
  const groupId = groupDoc.id;
  const rawData = groupDoc.data();

  // 3. NEW: Server-Side Role Fetch from Sub-collection
  let userRole = "guest";

  if (userId) {
    const membershipDoc = await adminDb
      .collection("users")
      .doc(userId)
      .collection("joinedGroups")
      .doc(groupId)
      .get();

    if (membershipDoc.exists) {
      userRole = membershipDoc.data()?.role || "member";
    }
  }

  // 4. Construct Payload (Sanitize Timestamps for Client Serialization)
  const groupData = {
    ...rawData,
    id: groupId,
    groupId: groupId,
    role: userRole, // Baked in from server
    updatedAt: rawData.updatedAt?.toMillis?.() || rawData.updatedAt || null,
    createdAt: rawData.createdAt?.toMillis?.() || rawData.createdAt || null,
  } as any;

  const currentYear = "2025";
  console.log(userRole, "USER ROLE IN LAYOUT");
  // Logic: If they have a role other than 'guest', they are a member of this club
  const isUsersClub = userRole !== "guest";
  const isGuestView = !isUsersClub || !userId;

  return (
    <ClubViewProvider isGuestView={isGuestView}>
      {/* Pushes the full-fat data (including role) to Redux immediately */}
      <GroupClientInitializer groupData={groupData} />

      <DataInitializer
        clubId={groupData?.groupClubId}
        currentYear={currentYear}
        groupId={groupData?.id}
      />

      <ClubBanner isGuestView={isGuestView} groupData={groupData} />
      {children}
    </ClubViewProvider>
  );
}
