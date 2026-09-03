import type { Metadata } from "next";

import { ImageHero } from "@/components/common/image-hero";
import { SectionPlaceholder } from "@/components/common/section-placeholder";

export const metadata: Metadata = {
  title: "Benchmarks · CommonMind",
  description:
    "See how CommonMind models perform, how they compare with base models, and where they still need to improve.",
};

const BenchmarksPage = () => {
  return (
    <>
      <ImageHero
        title="Benchmarks"
        tagline="Measure what improves."
        imageSrc="/flat-lay-statistics-presentation-with-chart.jpg"
      />
      <SectionPlaceholder id="comparison" title="Benchmark comparison" />
      <SectionPlaceholder id="methodology" title="Benchmark methodology" />
    </>
  );
};

export default BenchmarksPage;
