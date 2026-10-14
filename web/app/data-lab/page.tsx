import type { Metadata } from "next";

import { Container } from "@/components/common/container";
import { DataLabHome } from "@/components/data-lab/data-lab-home";
import { SignInLink } from "@/components/data-lab/sign-in-link";
import { PageHero } from "@/components/system/page-hero";
import { Section } from "@/components/system/primitives";
import { TagChain } from "@/components/system/tag-chain";

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
        lede="Translate, write, and review civic text in your language. Every contribution joins CommonMind's open datasets once a second speaker approves it, starting with the Civic Corpus."
        beneathTitle={<SignInLink />}
        beneathLede={<TagChain tags={["VOLUNTEER", "HUMAN-WRITTEN", "OPEN DATA"]} className="lg:w-max lg:flex-nowrap" />}
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
