import type { Metadata } from "next";

import { Hero } from "@/components/common/hero";

export const metadata: Metadata = {
  title: "CommonMind",
  description:
    "CommonMind is an open AI platform from Amplified Access for building, evaluating, and deploying AI grounded in local languages and local knowledge.",
};

const HomePage = () => {
  return (
    <Hero
      title="CommonMind"
      tagline="Building the open foundations for multilingual AI."
      topics={[
        { label: "Models", href: "/models" },
        { label: "Languages", href: "/languages" },
        { label: "Datasets", href: "/datasets" },
        { label: "Benchmarks", href: "/benchmarks" },
        { label: "Playground", href: "/playground" },
        { label: "Build", href: "/build" },
        { label: "Research", href: "/research" },
      ]}
      description="CommonMind is an open AI platform from Amplified Access for building, evaluating, and deploying AI grounded in local languages and local knowledge."
      ctas={[
        { label: "Explore models", href: "/models" },
        { label: "Try CommonMind", href: "/playground" },
      ]}
    />
  );
};

export default HomePage;
