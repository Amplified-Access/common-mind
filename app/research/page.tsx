import type { Metadata } from "next";

import { Hero } from "@/components/common/hero";
import { SectionPlaceholder } from "@/components/common/section-placeholder";

export const metadata: Metadata = {
  title: "Research · CommonMind",
  description:
    "Explore research on building, evaluating, and deploying AI for languages and contexts underserved by mainstream systems.",
};

const ResearchPage = () => {
  return (
    <>
      <Hero
        title="Research"
        tagline="Researching AI from where people are."
        topics={[
          { label: "Models" },
          { label: "Evaluation" },
          { label: "Local knowledge" },
          { label: "Efficient AI" },
          { label: "Participatory AI" },
        ]}
        description="Explore research on building, evaluating, and deploying AI for languages and contexts underserved by mainstream systems."
        ctas={[
          { label: "Read the research", href: "#catalogue" },
          { label: "View releases", href: "#releases" },
        ]}
      />
      <SectionPlaceholder id="catalogue" title="Research catalogue" />
      <SectionPlaceholder id="releases" title="Releases" />
    </>
  );
};

export default ResearchPage;
