import type { Metadata } from "next";

import { Container } from "@/components/common/container";
import { ImageHero } from "@/components/common/image-hero";
import { models } from "@/components/models/data";
import { ModelCard } from "@/components/models/model-card";

export const metadata: Metadata = {
  title: "Models · CommonMind",
  description:
    "Explore open models built for languages and contexts underserved by mainstream AI.",
};

const ModelsPage = () => {
  return (
    <>
      <ImageHero
        title="Models"
        tagline="Open models for local languages."
        imageSrc="/man-speaking-into-his-smartphone-s-speaker.jpg"
      />
      <section
        id="featured"
        className="scroll-mt-20 border-black/10 bg-[#f4f4f4] pb-16"
      >
        <Container>
          <h2 className="text-2xl font-semibold tracking-tight text-black">
            Featured models
          </h2>
          <div className="mt-8 flex flex-col gap-8">
            {models.map((model) => (
              <ModelCard key={model.slug} model={model} />
            ))}
          </div>
        </Container>
      </section>
    </>
  );
};

export default ModelsPage;
