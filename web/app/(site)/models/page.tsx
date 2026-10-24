import { Container } from "@/components/common/container";
import { modelCatalog, servedLanguages, taskLabel } from "@/components/models/catalog";
import { ModelsHero } from "@/components/models/models-hero";
import { RegistryGrid } from "@/components/models/registry-grid";
import { registryModels, tasks } from "@/components/models/registry";
import { Translator } from "@/components/playground/translator";
import { Section, SectionHeader } from "@/components/system/primitives";
import { copyFor, getContent } from "@/lib/content";
import { getPageCopy, pageMetadata } from "@/lib/copy";
import { Emphasized } from "@/lib/copy/emphasized";

export const generateMetadata = () => pageMetadata("models");

// Research is a kind of release, not a task a model performs.
const modelTasks = tasks
  .filter((t) => t.id !== "research")
  .map(({ id, label }) => ({ id, label }));

const ModelsPage = async () => {
  const [content, copy] = await Promise.all([getContent(), getPageCopy("models")]);
  return (
    <>
      <ModelsHero
        eyebrow={copy.hero.eyebrow}
        title={<Emphasized text={copy.hero.title} />}
        lede={copy.hero.lede}
        windows={registryModels.map((m) => ({
          name: m.name,
          language: servedLanguages(m).join(", "),
          tab: taskLabel(m.task),
          code: copyFor(content, m.slug).usage.code,
        }))}
      />

      <Section id="registry">
        <Container>
          <RegistryGrid entries={modelCatalog} tasks={modelTasks} />
        </Container>
      </Section>

      <Section id="try">
        <Container className="flex flex-col gap-16">
          <SectionHeader
            eyebrow={copy.playground.eyebrow}
            title={copy.playground.title}
            lede={copy.playground.lede}
          />
          <Translator />
        </Container>
      </Section>
    </>
  );
};

export default ModelsPage;
