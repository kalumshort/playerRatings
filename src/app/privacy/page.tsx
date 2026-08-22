import PrivacyPolicyPage from "@/components/client/Footer/PrivacyPolicy";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How we protect and manage your data at 11Votes.",
  alternates: { canonical: "https://11votes.com/privacy" },
};

export default function Page() {
  return <PrivacyPolicyPage />;
}
