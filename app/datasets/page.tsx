import type { Metadata } from "next";

import { Container } from "@/components/common/container";
import { DatasetGrid } from "@/components/datasets/dataset-grid";
import { PageHero } from "@/components/system/page-hero";

export const metadata: Metadata = {
  title: "Datasets",
  description:
    "Open datasets capturing how communities speak about public services, government, rights, elections, and local priorities.",
};

const DatasetsPage = () => {
  return (
    <PageHero
      align="split"
      sideGrids
      eyebrow="Datasets"
      title="Civic language data, built in context."
      lede="Explore open datasets capturing how communities speak about public services, government, rights, elections, and local priorities. Every source behind every model."
      className="pb-(--section-pad)"
      after={
        <Container>
          <DatasetGrid />
        </Container>
      }
    />
  );
};

export default DatasetsPage;
