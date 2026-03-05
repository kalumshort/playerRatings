import TermsOfServicePage from "@/components/client/Footer/TermsOfService";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | 11Votes",
  description: "The rules and guidelines for using the 11Votes platform.",
};

export default function Page() {
  return <TermsOfServicePage />;
}
