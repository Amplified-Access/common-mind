import type { Metadata } from "next";

import { Hero } from "@/components/common/hero";
import { SectionPlaceholder } from "@/components/common/section-placeholder";

export const metadata: Metadata = {
  title: "Benchmarks · CommonMind",
  description:
    "See how CommonMind models perform, how they compare with base models, and where they still need to improve.",
};

const BenchmarksPage = () => {
  return (
    <>
      <Hero
        title="Benchmarks"
        tagline="Measure what improves."
        topics={[
          { label: "Languages" },
          { label: "Models" },
          { label: "Tasks" },
          { label: "Evaluations" },
        ]}
        description="See how CommonMind models perform, how they compare with base models, and where they still need to improve."
        ctas={[
          { label: "Compare models", href: "#comparison" },
          { label: "View methodology", href: "#methodology" },
        ]}
      />
      <SectionPlaceholder id="comparison" title="Benchmark comparison" />
      <SectionPlaceholder id="methodology" title="Benchmark methodology" />
    </>
  );
};

export default BenchmarksPage;
