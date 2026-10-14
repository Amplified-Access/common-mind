import type { Metadata } from "next";

import { Container } from "@/components/common/container";
import { DataLabHome } from "@/components/data-lab/data-lab-home";
import { HeroSignIn } from "@/components/data-lab/hero-sign-in";
import { PageHero } from "@/components/system/page-hero";
import { Section } from "@/components/system/primitives";

export const metadata: Metadata = {
  title: "Data Lab",
  description:
    "Translate, write, and review civic text in your language. Verified contributions build CommonMind's open datasets, starting with the Civic Corpus.",
};

const DataLabPage = () => {
  return (
    <>
      <PageHero
        align="split"
        sideGrids
        eyebrow="Data Lab"
        title="Build civic language data together."
        tags={["VOLUNTEER", "HUMAN-WRITTEN", "OPEN DATA"]}
        aside={<HeroSignIn />}
      />
      <Section className="pt-0">
        <Container>
          <DataLabHome />
        </Container>
      </Section>
    </>
  );
};

export default DataLabPage;
