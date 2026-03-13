import { adminDb } from "@/lib/firebase/admin";
import { notFound } from "next/navigation";
import { getAuthSession } from "@/lib/firebase/getAuth"; // Import this

import GroupClientInitializer from "@/components/client/GroupClientInitializer";
import DataInitializer from "@/components/client/DataInitializer";
import { Group } from "@/lib/redux/slices/groupSlice";
import ClubBanner from "@/components/client/Widgets/ClubBanner";
import { getUserData } from "@/lib/firebase/firebase-admin-queries";
import { ClubViewProvider } from "@/context/ClubViewProvider";

export default async function ClubLayout({ children, params }) {
  const { clubSlug } = await params;

  // 1. Get Auth session
  const { userId } = await getAuthSession();

  // 2. Fetch User Data (will use cache if called elsewhere in the same request)
  const userData = userId ? await getUserData(userId) : null;

  // 3. Fetch Group Data
  const groupQuery = await adminDb
    .collection("groups")
    .where("slug", "==", clubSlug)
    .limit(1)
    .get();

  if (groupQuery.empty) notFound();

  const doc = groupQuery.docs[0];
  const groupData = {
    id: doc.id,
    groupId: doc.id,
    ...doc.data(),
  } as Group;

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
