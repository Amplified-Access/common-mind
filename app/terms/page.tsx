import type { Metadata } from "next";

import { LegalDocument, LegalSection } from "@/components/legal/legal-document";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "The terms that govern use of CommonMind.",
};

// The structure of the terms, awaiting the text itself.
const sections = [
  "Acceptance of These Terms",
  "Using CommonMind",
  "Models, Datasets, and Benchmarks",
  "Licenses",
  "Contributions",
  "Acceptable Use",
  "Disclaimers",
  "Limitation of Liability",
  "Changes to These Terms",
  "Contact",
];

const TermsPage = () => {
  return (
    <LegalDocument title="Terms of Use" updated="[Pending]">
      {sections.map((title, i) => (
        <LegalSection key={title} number={i + 1} title={title}>
          <p className="text-signal">[Terms to be provided.]</p>
        </LegalSection>
      ))}
    </LegalDocument>
  );
};

export default TermsPage;
