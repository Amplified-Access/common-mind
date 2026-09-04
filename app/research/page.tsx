import type { Metadata } from "next";

import { Container } from "@/components/common/container";
import { ImageHero } from "@/components/common/image-hero";
import { publications, releases } from "@/components/research/data";
import { PublicationCard } from "@/components/research/publication-card";
import { ReleasesList } from "@/components/research/releases-list";

export const metadata: Metadata = {
  title: "Research · CommonMind",
  description:
    "Explore research on building, evaluating, and deploying AI for languages and contexts underserved by mainstream systems.",
};

const ResearchPage = () => {
  return (
    <>
      <ImageHero
        title="Research"
        tagline="Researching AI from where people are."
        imageSrc="/flat-lay-statistics-presentation-with-chart.jpg"
      />
      <section
        id="catalogue"
        className="scroll-mt-20 border-black/10 bg-[#f4f4f4] pb-16"
      >
        <Container>
          <h2 className="text-2xl font-semibold tracking-tight text-black">
            Research catalogue
          </h2>
          <p className="mt-2 max-w-2xl text-gray-600">
            Write-ups on how we train and evaluate CommonMind models, every
            number sourced from the model card or benchmark it came from.
          </p>
          <div className="mt-8 flex flex-col gap-8">
            {publications.map((publication) => (
              <PublicationCard key={publication.slug} publication={publication} />
            ))}
          </div>
        </Container>
      </section>
      <section
        id="releases"
        className="scroll-mt-20 border-black/10 bg-[#f4f4f4] pb-16"
      >
        <Container>
          <h2 className="text-2xl font-semibold tracking-tight text-black">
            Releases
          </h2>
          <p className="mt-2 max-w-2xl text-gray-600">
            Every model we&apos;ve shipped, in order.
          </p>
          <div className="mt-8">
            <ReleasesList releases={releases} />
          </div>
        </Container>
      </section>
    </>
  );
};

export default ResearchPage;
