import type { Metadata } from "next";

import { Container } from "@/components/common/container";
import { ImageHero } from "@/components/common/image-hero";
import { Translator } from "@/components/playground/translator";

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
      <section
        id="experiment"
        className="scroll-mt-20 border-black/10 bg-[#f4f4f4] pb-16"
      >
        <Container>
          <h2 className="text-2xl font-semibold tracking-tight text-black">
            Translate
          </h2>
          <p className="mt-2 max-w-2xl text-gray-600">
            Pick a model and translation direction, then try it out.
          </p>
          <div className="mt-8">
            <Translator />
          </div>
        </Container>
      </section>
    </>
  );
};

export default PlaygroundPage;
