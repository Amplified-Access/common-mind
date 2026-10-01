import type { Metadata } from "next";

import { Container } from "@/components/common/container";
import { RegistryTable } from "@/components/models/registry-table";
import { Translator } from "@/components/playground/translator";
import { PageHero } from "@/components/system/page-hero";
import { Section, SectionHeader } from "@/components/system/primitives";

export const metadata: Metadata = {
  title: "Models",
  description:
    "Open models for civic language understanding across languages beyond the mainstream.",
};

const ModelsPage = () => {
  return (
    <>
      <PageHero
        variant="gradient"
        title="Open models for civic language understanding."
      />

      <Section id="registry">
        <Container className="flex flex-col gap-20">
          <SectionHeader title="The registry." />
          <RegistryTable />
        </Container>
      </Section>

      <Section id="try">
        <Container className="flex flex-col gap-20">
          <SectionHeader title="Playground." className="items-center text-center md:justify-center" />
          <Translator />
        </Container>
      </Section>
    </>
  );
};

export default ModelsPage;
