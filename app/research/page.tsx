import type { Metadata } from "next";

import { ImageHero } from "@/components/common/image-hero";
import { SectionPlaceholder } from "@/components/common/section-placeholder";

export const metadata: Metadata = {
  title: "Research · CommonMind",
  description:
    "Explore research on building, evaluating, and deploying AI for languages and contexts underserved by mainstream systems.",
};

const ResearchPage = () => {
  return (
    <>
      <ImageHero
        title="Research"
        tagline="Researching AI from where people are."
        imageSrc="/flat-lay-statistics-presentation-with-chart.jpg"
      />
      <SectionPlaceholder id="catalogue" title="Research catalogue" />
      <SectionPlaceholder id="releases" title="Releases" />
    </>
  );
};

export default ResearchPage;
