import { Layers01Icon } from "@hugeicons/core-free-icons";
import { Container } from "@/components/common/container";
import { modelCatalog } from "@/components/models/catalog";
import { RegistryGrid } from "@/components/models/registry-grid";
import { tasks } from "@/components/models/registry";
import { Translator } from "@/components/playground/translator";
import { PageHero } from "@/components/system/page-hero";
import { Section, SectionHeader } from "@/components/system/primitives";
import { getPageCopy, pageMetadata } from "@/lib/copy";
import { Emphasized } from "@/lib/copy/emphasized";

export const generateMetadata = () => pageMetadata("models");

// Research is a kind of release, not a task a model performs.
const modelTasks = tasks
  .filter((t) => t.id !== "research")
  .map(({ id, label }) => ({ id, label }));

const ModelsPage = async () => {
  const copy = await getPageCopy("models");
  return (
    <>
      <PageHero
        tile={Layers01Icon}
        eyebrow={copy.hero.eyebrow}
        title={<Emphasized text={copy.hero.title} />}
        lede={copy.hero.lede}
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
