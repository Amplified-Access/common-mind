import type { Metadata } from "next";

import { Hero } from "@/components/common/hero";
import { SectionPlaceholder } from "@/components/common/section-placeholder";

export const metadata: Metadata = {
  title: "Build · CommonMind",
  description:
    "Use CommonMind models and tools to build local-language AI applications, from prototypes to real-world deployments.",
};

const BuildPage = () => {
  return (
    <>
      <Hero
        title="Build"
        tagline="Build with CommonMind."
        topics={[
          { label: "Python" },
          { label: "Hugging Face" },
          { label: "Ollama" },
          { label: "API" },
          { label: "Local" },
          { label: "Edge" },
        ]}
        description="Use CommonMind models and tools to build local-language AI applications, from prototypes to real-world deployments."
        ctas={[
          { label: "Get started", href: "#quickstart" },
          { label: "Read the docs", href: "#documentation" },
          // TODO: point at the project's actual GitHub repository once it exists.
          { label: "View GitHub", href: "#" },
        ]}
      />
      <SectionPlaceholder id="quickstart" title="Quickstart" />
      <SectionPlaceholder id="documentation" title="Documentation" />
    </>
  );
};

export default BuildPage;
