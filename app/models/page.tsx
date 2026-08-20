import type { Metadata } from "next";

import { Hero } from "@/components/common/hero";

export const metadata: Metadata = {
  title: "Models · CommonMind",
  description:
    "Explore open models built for languages and contexts underserved by mainstream AI.",
};

const ModelsPage = () => {
  return (
    <Hero
      title="Models"
      tagline="Open models for local languages."
      topics={[
        { label: "Translation" },
        { label: "Conversation" },
        { label: "Speech" },
        { label: "Instruction" },
        { label: "Research" },
      ]}
      description="Explore open models built for languages and contexts underserved by mainstream AI."
      ctas={[
        { label: "Try a model", href: "/playground" },
        { label: "Build with a model", href: "/build" },
      ]}
    />
  );
};

export default ModelsPage;
