import type { Metadata } from "next";

import { Container } from "@/components/common/container";
import { RegistryTable } from "@/components/models/registry-table";
import { TaskTaxonomy } from "@/components/models/task-taxonomy";
import { Translator } from "@/components/playground/translator";
import { PageHero } from "@/components/system/page-hero";
import { LinkButton, Section, SectionHeader } from "@/components/system/primitives";

export const metadata: Metadata = {
  title: "Models",
  description:
    "Open models for civic language understanding across languages beyond the mainstream.",
};

const ModelsPage = () => {
  return (
    <>
      <PageHero
        title="Open models for civic language understanding."
        lede="Small, open, and measured. Built for languages beyond the mainstream."
        actions={
          <>
            <LinkButton href="#try">Try a model</LinkButton>
            <LinkButton href="/build" variant="secondary">
              Build with a model
            </LinkButton>
          </>
        }
      />

      <Section id="tasks">
        <Container className="flex flex-col gap-20">
          <SectionHeader title="Five tasks. One civic language layer." />
          <TaskTaxonomy />
        </Container>
      </Section>

      <Section id="registry">
        <Container className="flex flex-col gap-20">
          <SectionHeader title="The registry." />
          <RegistryTable />
        </Container>
      </Section>

      <Section id="try">
        <Container className="flex flex-col gap-20">
          <SectionHeader title="Run it. Right here." />
          <Translator />
        </Container>
      </Section>
    </>
  );
};

export default ModelsPage;
