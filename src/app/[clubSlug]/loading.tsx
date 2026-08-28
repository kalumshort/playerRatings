import PageSkeleton from "@/components/ui/PageSkeleton";

/**
 * [clubSlug]/layout.tsx resolves the group by slug and then reads the user's
 * role — two sequential Firestore round trips before any club page renders.
 * Without this the user sat on the previous page for the whole trip.
 */
export default function Loading() {
  return <PageSkeleton rows={4} />;
}
