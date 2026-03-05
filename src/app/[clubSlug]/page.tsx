import React from "react";
import { Metadata } from "next";
import { getAdminDb } from "@/lib/firebase/admin";
import { notFound } from "next/navigation";

// Sub-components (We will migrate these next)
import GroupHomeClient from "@/components/client/GroupHomeClient";
import {
  getGroupBySlugServer,
  isGroupMemberServer,
} from "@/lib/firebase/firebase-admin-queries";
import { getUserIdFromSession } from "@/lib/auth-server";
import PrivateGroupPlaceholder from "@/components/ui/PrivateGroupPlaceholder";

interface Props {
  params: Promise<{ clubSlug: string }>;
}

// --- STEP 1: DYNAMIC SEO (Replaces Helmet) ---
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { clubSlug } = await params;
  const adminDb = getAdminDb();

  const groupQuery = await adminDb
    .collection("groups")
    .where("slug", "==", clubSlug)
    .limit(1)
    .get();

  if (groupQuery.empty) return { title: "Club Not Found | 11Votes" };

  const group = groupQuery.docs[0].data();
  const groupName = group.name || group.groupName || "Football";

  return {
    title: `${groupName} Player Ratings & Fan Hub | 11Votes`,
    description: `The ultimate ${groupName} fan community. Rate players after every match, track season stats, and see the real-time fan consensus.`,
    alternates: {
      canonical: `https://11votes.com/${clubSlug}`,
    },
    openGraph: {
      title: `${groupName} Player Ratings | 11Votes`,
      description: `The ultimate ${groupName} fan community.`,
      url: `https://11votes.com/${clubSlug}`,
      type: "website",
      images: group.logoUrl ? [{ url: group.logoUrl }] : [],
    },
  };
}

// --- STEP 2: SERVER COMPONENT ---
export default async function ClubPage({ params }: Props) {
  const { clubSlug } = await params;

  const [group, userId] = await Promise.all([
    getGroupBySlugServer(clubSlug),
    getUserIdFromSession(),
  ]);

  if (!group) notFound();

  // 2. Security Check (Sub-collection lookup for private groups)
  const isPublic = group.visibility === "public";
  const isAuthorized =
    isPublic || (userId ? await isGroupMemberServer(group.id, userId) : false);

  if (!isAuthorized) {
    return <PrivateGroupPlaceholder name={group.name} />;
  }
  // We don't need to fetch data here because the Layout already did it
  // and put it in Redux via the Initializer.
  // We just render the Client Component that holds your layout logic.
  return <GroupHomeClient />;
}
