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

  const { userId } = await getAuthSession();

  const userData = userId ? await getUserData(userId) : null;

  const groupQuery = await adminDb
    .collection("groups")
    .where("slug", "==", clubSlug)
    .limit(1)
    .get();

  if (groupQuery.empty) notFound();

  const doc = groupQuery.docs[0];
  const rawData = doc.data();

  const groupData = {
    ...rawData,
    id: doc.id,
    groupId: doc.id,
    updatedAt: rawData.updatedAt?.toMillis?.() || rawData.updatedAt || null,
    createdAt: rawData.createdAt?.toMillis?.() || rawData.createdAt || null,
  } as any;

  const currentYear = "2025";

  const isUsersClub = groupData.league
    ? userData?.leagueTeams?.[groupData?.league] === groupData.id
    : true;
  const isGuestView = !isUsersClub || !userId;

  return (
    <ClubViewProvider isGuestView={isGuestView}>
      <GroupClientInitializer groupData={groupData} />

      {/* If you need user data in your initializers, pass it here */}
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
