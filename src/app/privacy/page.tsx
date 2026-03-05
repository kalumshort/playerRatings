import PrivacyPolicyPage from "@/components/client/Footer/PrivacyPolicy";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | 11Votes",
  description: "How we protect and manage your data at 11Votes.",
};

export default function Page() {
  return <PrivacyPolicyPage />;
}
