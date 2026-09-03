import type { Metadata } from "next";

import { Container } from "@/components/common/container";
import { ImageHero } from "@/components/common/image-hero";
import { datasets } from "@/components/datasets/data";
import { languages } from "@/components/languages/data";
import { LanguageCard } from "@/components/languages/language-card";
import { models } from "@/components/models/data";

export const metadata: Metadata = {
  title: "Languages · CommonMind",
  description:
    "Explore the models and datasets being built around each language.",
};

const LanguagesPage = () => {
  const packages = languages.map((language) => {
    const languageModels = models.filter((model) =>
      model.languages.includes(language.code),
    );
    const languageModelNames = new Set(languageModels.map((m) => m.name));
    const languageDatasets = datasets.filter((dataset) =>
      dataset.usedBy.some((name) => languageModelNames.has(name)),
    );

    return { language, models: languageModels, datasets: languageDatasets };
  });

  return (
    <>
      <ImageHero
        title="Languages"
        tagline="Start with the language."
        imageSrc="/close-up-man-repairing-computer-chips.jpg"
      />
      <section
        id="catalogue"
        className="scroll-mt-20 border-black/10 bg-[#f4f4f4] pb-16"
      >
        <Container>
          <h2 className="text-2xl font-semibold tracking-tight text-black">
            Language catalogue
          </h2>
          <p className="mt-2 max-w-2xl text-gray-600">
            Every model and dataset we&apos;ve shipped, grouped by the
            language it serves.
          </p>
          <div className="mt-8 flex flex-col gap-6">
            {packages.map(({ language, models: languageModels, datasets: languageDatasets }) => (
              <LanguageCard
                key={language.code}
                language={language}
                models={languageModels}
                datasets={languageDatasets}
              />
            ))}
          </div>
          <p className="mt-8 text-sm text-gray-500">
            More languages — Luo, Oromo, Dinka, and others — are on the
            roadmap. This page will grow as models and datasets ship for
            them.
          </p>
        </Container>
      </section>
    </>
  );
};

export default LanguagesPage;
