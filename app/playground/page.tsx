import type { Metadata } from "next";

import { ImageHero } from "@/components/common/image-hero";
import { SectionPlaceholder } from "@/components/common/section-placeholder";

export const metadata: Metadata = {
  title: "Playground · CommonMind",
  description:
    "Choose a model, enter something, and experience CommonMind directly in your browser.",
};

const PlaygroundPage = () => {
  return (
    <>
      <ImageHero
        title="Playground"
        tagline="Try AI in your language."
        imageSrc="/man-speaking-into-his-smartphone-s-speaker.jpg"
      />
      <SectionPlaceholder id="model-selector" title="Model selector" />
      <SectionPlaceholder id="experiment" title="Interactive playground" />
    </>
  );
};

export default PlaygroundPage;
