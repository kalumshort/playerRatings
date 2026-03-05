import { getAdminDb } from "@/lib/firebase/admin";
import { notFound } from "next/navigation";
import GroupClientInitializer from "@/components/client/GroupClientInitializer";
import DataInitializer from "@/components/client/DataInitializer";
import { Group } from "@/lib/redux/slices/groupSlice";

export default async function ClubLayout({ children, params }) {
  const { clubSlug } = await params;
  const adminDb = getAdminDb();
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

  return (
    <>
      <GroupClientInitializer groupData={groupData} />

      <DataInitializer
        clubId={groupData?.groupClubId}
        currentYear={currentYear}
        groupId={groupData?.id}
      />

      {children}
    </>
  );
}
