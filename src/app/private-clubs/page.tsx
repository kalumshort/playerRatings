import type { Metadata } from "next";

import PrivateClubsPage from "@/components/client/PrivateClubs/PrivateClubsPage";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo/jsonLd";

export const metadata: Metadata = {
  title: "Private Clubs for Football Communities",
  description:
    "Give your community a club of its own. Members-only player ratings, a consensus XI, a live mood curve and a season table — scored by your people, counted for your club alone.",
  alternates: { canonical: "https://11votes.com/private-clubs" },
  openGraph: {
    title: "Private Clubs for Football Communities | 11Votes",
    description:
      "Your members predict, pick the XI and rate every player. Your club keeps the numbers — private, and never mixed in with the wider fanbase.",
    url: "https://11votes.com/private-clubs",
    type: "website",
  },
};

export default function Page() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "" },
          { name: "Private Clubs", path: "/private-clubs" },
        ])}
      />
      <PrivateClubsPage />
    </>
  );
}
