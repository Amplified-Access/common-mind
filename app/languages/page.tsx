import type { Metadata } from "next";

import { Hero } from "@/components/common/hero";
import { SectionPlaceholder } from "@/components/common/section-placeholder";

export const metadata: Metadata = {
  title: "Languages · CommonMind",
  description:
    "Explore the models, datasets, benchmarks, and research being built around each language.",
};

const LanguagesPage = () => {
  return (
    <>
      <Hero
        title="Languages"
        tagline="Start with the language."
        topics={[
          { label: "Luganda" },
          { label: "Swahili" },
          { label: "Luo" },
          { label: "Oromo" },
          { label: "Dinka" },
          { label: "More" },
        ]}
        description="Explore the models, datasets, benchmarks, and research being built around each language."
        ctas={[
          { label: "Choose a language", href: "#catalogue" },
          { label: "Try a language", href: "/playground" },
        ]}
      />
      <SectionPlaceholder id="catalogue" title="Language catalogue" />
    </>
  );
};

export default LanguagesPage;
