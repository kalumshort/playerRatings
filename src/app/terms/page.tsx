import TermsOfServicePage from "@/components/client/Footer/TermsOfService";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The rules and guidelines for using the 11Votes platform.",
  alternates: { canonical: "https://11votes.com/terms" },
};

export default function Page() {
  return <TermsOfServicePage />;
}
