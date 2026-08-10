import { notFound } from "next/navigation";
import GroupClientInitializer from "@/components/client/GroupClientInitializer";
import DataInitializer from "@/components/client/DataInitializer";
import PrivateGroupPlaceholder from "@/components/ui/PrivateGroupPlaceholder";
import { getUserIdFromSession } from "@/lib/auth-server";
import {
  getGroupBySlugServer,
  isGroupMemberServer,
} from "@/lib/firebase/firebase-admin-queries";
import { Group } from "@/lib/redux/slices/groupSlice";

const CURRENT_YEAR = "2025";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ clubSlug: string }>;
}

/**
 * Only the fields the client actually renders. The raw group document also
 * carries membership and admin metadata, which must not be serialised into the
 * RSC payload.
 */
function toPublicGroup(group: any): Group {
  return {
    id: group.id,
    groupId: group.id,
    slug: group.slug,
    name: group.name ?? group.groupName ?? "",
    groupClubId: group.groupClubId ?? "",
    visibility: group.visibility === "public" ? "public" : "private",
    ...(group.logoUrl ? { logoUrl: group.logoUrl } : {}),
    ...(group.headerImage ? { headerImage: group.headerImage } : {}),
  };
}

export default async function ClubLayout({ children, params }: LayoutProps) {
  const { clubSlug } = await params;

  const [group, userId] = await Promise.all([
    getGroupBySlugServer(clubSlug),
    getUserIdFromSession(),
  ]);

  if (!group) notFound();

  // Gate before anything about the group reaches the browser. The pages nested
  // below this layout have no gate of their own and rely on this check.
  const isAuthorized =
    group.visibility === "public" ||
    (userId ? await isGroupMemberServer(group.id, userId) : false);

  if (!isAuthorized) {
    return (
      <PrivateGroupPlaceholder name={group.name ?? group.groupName ?? "This group"} />
    );
  }

  const groupData = toPublicGroup(group);

  return (
    <>
      <GroupClientInitializer groupData={groupData} />

      <DataInitializer
        clubId={groupData?.groupClubId}
        currentYear={CURRENT_YEAR}
        groupId={groupData?.id}
      />

      {children}
    </>
  );
}
