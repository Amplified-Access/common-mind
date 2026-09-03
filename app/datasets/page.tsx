import type { Metadata } from "next";

import { Container } from "@/components/common/container";
import { ImageHero } from "@/components/common/image-hero";
import { datasets } from "@/components/datasets/data";
import { DatasetCard } from "@/components/datasets/dataset-card";

export const metadata: Metadata = {
  title: "Datasets · CommonMind",
  description:
    "Explore open language resources for training, adapting, and evaluating AI across underserved languages.",
};

const DatasetsPage = () => {
  return (
    <>
      <ImageHero
        title="Datasets"
        tagline="The data behind local AI."
        imageSrc="/flat-lay-statistics-presentation-with-chart.jpg"
      />
      <section
        id="catalogue"
        className="scroll-mt-20 border-black/10 bg-[#f4f4f4] pb-16"
      >
        <Container>
          <h2 className="text-2xl font-semibold tracking-tight text-black">
            Dataset catalogue
          </h2>
          <p className="mt-2 max-w-2xl text-gray-600">
            The original sources behind every model on our{" "}
            <a href="/models" className="underline underline-offset-4">
              models page
            </a>
            , with links back to the datasets themselves.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {datasets.map((dataset) => (
              <DatasetCard key={dataset.slug} dataset={dataset} />
            ))}
          </div>
        </Container>
      </section>
    </>
  );
};

export default DatasetsPage;
