import { NeuralNetworkIcon } from "@hugeicons/core-free-icons";
import type { Metadata } from "next";

import { Container } from "@/components/common/container";
import { modelCatalog } from "@/components/models/catalog";
import { RegistryGrid } from "@/components/models/registry-grid";
import { tasks } from "@/components/models/registry";
import { Translator } from "@/components/playground/translator";
import { PageHero } from "@/components/system/page-hero";
import { Section, SectionHeader } from "@/components/system/primitives";

export const metadata: Metadata = {
  title: "Models",
  description:
    "Open models for civic language understanding across languages beyond the mainstream.",
};

// Research is a kind of release, not a task a model performs.
const modelTasks = tasks
  .filter((t) => t.id !== "research")
  .map(({ id, label }) => ({ id, label }));

const ModelsPage = () => {
  return (
    <>
      <PageHero
        tile={NeuralNetworkIcon}
        eyebrow="Model registry"
        title={
          <>
            Open models
            <br className="max-sm:hidden" />
            for multilingual civic AI.
          </>
        }
        lede="Explore, evaluate, and build with open models for transcription, translation, civic terminology mapping, and issue classification in languages beyond the mainstream."
        className="pb-(--section-pad)"
        after={
          <Container id="registry" className="scroll-mt-24">
            <RegistryGrid entries={modelCatalog} tasks={modelTasks} />
          </Container>
        }
      />

      <Section id="try">
        <Container className="flex flex-col gap-16">
          <SectionHeader
            eyebrow="Playground"
            title="See the model in action."
            lede="Choose a model, provide an input, and explore how it processes and interprets civic discourse across supported languages."
          />
          <Translator />
        </Container>
      </Section>
    </>
  );
};

export default ModelsPage;
