import { Suspense } from "react";
import { adminDb } from "@/lib/firebase/admin";
import { notFound } from "next/navigation";
import { getAuthSession } from "@/lib/firebase/getAuth";

import GroupClientInitializer from "@/components/client/GroupClientInitializer";
import DataInitializer from "@/components/client/DataInitializer";
import { Group } from "@/lib/redux/slices/groupSlice";
import ClubBanner from "@/components/client/Widgets/ClubBanner";
import ArchivedClubNotice from "@/components/client/Widgets/ArchivedClubNotice";
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
  //
  // Every Timestamp, not a named list of two. A Firestore Timestamp is a class
  // instance, and React refuses to pass one from a server to a client
  // component — it throws and takes the whole subtree with it. Naming fields
  // individually meant the reconcile adding `archivedAt` silently broke every
  // archived club page, which is exactly the page that field exists to power.
  const groupData = Object.fromEntries(
    Object.entries(rawData).map(([key, value]) => [
      key,
      typeof (value as any)?.toMillis === "function"
        ? (value as any).toMillis()
        : value,
    ]),
  ) as any;

  groupData.id = groupId;
  groupData.groupId = groupId;
  groupData.role = userRole; // Baked in from server

  // Logic: If they have a role other than 'guest', they are a member of this club
  const isUsersClub = userRole !== "guest";
  const isGuestView = !isUsersClub || !userId;

  // The club has left the league: no new data will ever be written for it, so
  // its pages default to the last season it was active in and go read-only.
  const isClubArchived = rawData.status === "archived";
  const defaultSeason = isClubArchived ? rawData.lastActiveSeason : null;

  return (
    <ClubViewProvider
      isGuestView={isGuestView}
      isClubArchived={isClubArchived}
    >
      {/* Pushes the full-fat data (including role) to Redux immediately */}
      <GroupClientInitializer groupData={groupData} />

      {/* Reads ?season= (layouts can't) and mirrors it into Redux. Renders null,
          so suspending on searchParams costs nothing and never blocks the page. */}
      <Suspense fallback={null}>
        <DataInitializer
          clubId={groupData?.groupClubId}
          groupId={groupData?.id}
          defaultSeason={defaultSeason}
        />
      </Suspense>

      {isClubArchived && (
        <ArchivedClubNotice
          clubName={groupData.name}
          lastActiveSeason={rawData.lastActiveSeason}
          isGuestView={isGuestView}
        />
      )}

      <ClubBanner
        isGuestView={isGuestView}
        groupData={groupData}
        userId={userId}
      />
      {children}
    </ClubViewProvider>
  );
}
