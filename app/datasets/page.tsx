import type { Metadata } from "next";

import { Container } from "@/components/common/container";
import { DatasetGrid } from "@/components/datasets/dataset-grid";
import { PageHero } from "@/components/system/page-hero";
import { LinkButton } from "@/components/system/primitives";

export const metadata: Metadata = {
  title: "Datasets",
  description:
    "Explore the open datasets supporting language model development, training, and evaluation across languages beyond the mainstream.",
};

const DatasetsPage = () => {
  return (
    <PageHero
      align="split"
      sideGrids
      eyebrow="Datasets"
      title="Language data for multilingual AI."
      lede="Explore the open datasets supporting language model development, training, and evaluation across languages beyond the mainstream."
      tags={["OPEN DATA", "MULTILINGUAL AI", "RESEARCH"]}
      className="pb-(--section-pad)"
      after={
        <Container id="catalogue" className="scroll-mt-24">
          <DatasetGrid />
        </Container>
      }
    >
      <div>
        <LinkButton href="#catalogue">Explore Datasets</LinkButton>
      </div>
    </PageHero>
  );
};

export default DatasetsPage;
