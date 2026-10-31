import { CmsLegalPage, legalMetadata } from "@/components/legal/cms-legal-page";

export const generateMetadata = () => legalMetadata("legal-privacy", "/privacy");

export default function PrivacyPage() {
  return <CmsLegalPage id="legal-privacy" />;
}
