import type { Metadata } from "next";

/**
 * `profile/page.tsx` is a client component, so it cannot export metadata
 * itself. Without this the route rendered with no <title> at all.
 *
 * noindex because the page is entirely user-specific — there is nothing here
 * for a crawler, and robots.ts disallows the path for the same reason.
 */
export const metadata: Metadata = {
  title: "Your profile",
  description: "Manage your 11Votes account, club and preferences.",
  robots: { index: false, follow: false },
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
