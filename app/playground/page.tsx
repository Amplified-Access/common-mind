import type { Metadata } from "next";

import { Hero } from "@/components/common/hero";
import { SectionPlaceholder } from "@/components/common/section-placeholder";

export const metadata: Metadata = {
  title: "Playground · CommonMind",
  description:
    "Choose a model, enter something, and experience CommonMind directly in your browser.",
};

const PlaygroundPage = () => {
  return (
    <>
      <Hero
        title="Playground"
        tagline="Try AI in your language."
        topics={[
          { label: "Translate" },
          { label: "Chat" },
          { label: "Speech" },
          { label: "Compare" },
        ]}
        description="Choose a model, enter something, and experience CommonMind directly in your browser."
        ctas={[
          { label: "Choose a model", href: "#model-selector" },
          { label: "Start experimenting", href: "#experiment" },
        ]}
      />
      <SectionPlaceholder id="model-selector" title="Model selector" />
      <SectionPlaceholder id="experiment" title="Interactive playground" />
    </>
  );
};

export default PlaygroundPage;
