import type { Metadata } from "next";

import PrivateGroupsPage from "@/components/client/PrivateGroups/PrivateGroupsPage";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo/jsonLd";

export const metadata: Metadata = {
  title: "Private Groups for Football Creators",
  description:
    "Turn your audience into your panel. A members-only club hub that hands you a consensus XI, a live mood curve and a full ratings card after every match — your fans' numbers, nobody else's.",
  alternates: { canonical: "https://11votes.com/private-groups" },
  openGraph: {
    title: "Private Groups for Football Creators | 11Votes",
    description:
      "Your audience predicts, picks the XI and rates every player. You get the data — a consensus XI, a mood curve and a ratings card, every match.",
    url: "https://11votes.com/private-groups",
    type: "website",
  },
};

export default function Page() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "" },
          { name: "Private Groups", path: "/private-groups" },
        ])}
      />
      <PrivateGroupsPage />
    </>
  );
}
