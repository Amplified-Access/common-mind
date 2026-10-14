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
    "The Data Lab works with the communities who speak each language to build high-quality civic datasets, written and verified by native speakers, for training AI that understands civic discourse in their own languages.",
};

const DataLabPage = () => {
  return (
    <>
      <PageHero
        align="columns"
        sideGrids
        eyebrow="Data Lab"
        title="Build civic language data together."
        lede="The Data Lab works with the communities who speak each language to build high-quality civic datasets, written and verified by native speakers, for training AI that understands civic discourse in their own languages."
        beneathTitle={<SignInLink />}
        beneathLede={<TagChain tags={["NATIVELY VERIFIED", "TRAINING-READY", "OPEN DATA"]} className="lg:flex-nowrap" />}
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
