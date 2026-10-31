import { CmsLegalPage, legalMetadata } from "@/components/legal/cms-legal-page";

export const generateMetadata = () => legalMetadata("legal-terms", "/terms");

export default function TermsPage() {
  return <CmsLegalPage id="legal-terms" />;
}
