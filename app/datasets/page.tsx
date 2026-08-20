import type { Metadata } from "next";

import { Hero } from "@/components/common/hero";
import { SectionPlaceholder } from "@/components/common/section-placeholder";

export const metadata: Metadata = {
  title: "Datasets · CommonMind",
  description:
    "Explore open language resources for training, adapting, and evaluating AI across underserved languages.",
};

const DatasetsPage = () => {
  return (
    <>
      <Hero
        title="Datasets"
        tagline="The data behind local AI."
        topics={[
          { label: "Translation" },
          { label: "Instructions" },
          { label: "Speech" },
          { label: "Evaluation" },
          { label: "Local knowledge" },
        ]}
        description="Explore open language resources for training, adapting, and evaluating AI across underserved languages."
        ctas={[
          { label: "Browse datasets", href: "#catalogue" },
          { label: "Use a dataset", href: "/build" },
        ]}
      />
      <SectionPlaceholder id="catalogue" title="Dataset catalogue" />
    </>
  );
};

export default DatasetsPage;
