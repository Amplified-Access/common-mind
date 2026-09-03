import type { Metadata } from "next";

import { ImageHero } from "@/components/common/image-hero";
import { SectionPlaceholder } from "@/components/common/section-placeholder";

export const metadata: Metadata = {
  title: "Build · CommonMind",
  description:
    "Use CommonMind models and tools to build local-language AI applications, from prototypes to real-world deployments.",
};

const BuildPage = () => {
  return (
    <>
      <ImageHero
        title="Build"
        tagline="Build with CommonMind."
        imageSrc="/working-from-home-ergonomic-workstation.jpg"
      />
      <SectionPlaceholder id="quickstart" title="Quickstart" />
      <SectionPlaceholder id="documentation" title="Documentation" />
    </>
  );
};

export default BuildPage;
