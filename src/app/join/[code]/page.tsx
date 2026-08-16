import type { Metadata } from "next";
import { getAuthSession } from "@/lib/firebase/getAuth";
import {
  getInvitePreview,
  hasJoinedGroupServer,
} from "@/lib/firebase/firebase-admin-queries";
import JoinInviteClient from "@/components/client/Groups/JoinInviteClient";

// An invite is a private, one-off link. Keeping it out of the index also keeps
// the group name behind it out of search results.
export const metadata: Metadata = {
  title: "Join a group | 11votes",
  robots: { index: false, follow: false },
};

export default async function JoinInvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  // The Admin SDK is the only way to read this: firestore.rules denies
  // groupInvites to everyone but the group owner.
  const [preview, { isLoggedIn, userId }] = await Promise.all([
    getInvitePreview(code),
    getAuthSession(),
  ]);

  // Someone re-opening their own invite link should land in the group, not be
  // told they're already a member.
  const alreadyMember =
    preview.valid && userId
      ? await hasJoinedGroupServer(preview.groupId, userId)
      : false;

  return (
    <JoinInviteClient
      preview={preview}
      isLoggedIn={isLoggedIn}
      alreadyMember={alreadyMember}
    />
  );
}
