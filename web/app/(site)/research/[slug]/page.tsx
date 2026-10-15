import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/common/container";
import { publications, readTimeForPublication } from "@/components/research/data";
import { PublicationArticle } from "@/components/research/publication-article";
import { PageHero } from "@/components/system/page-hero";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function getPublication(slug: string) {
  return publications.find((publication) => publication.slug === slug);
}

export function generateStaticParams() {
  return publications.map((publication) => ({ slug: publication.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const publication = getPublication(slug);

  if (!publication) {
    return {};
  }

  return {
    title: publication.title,
    description: publication.dek,
  };
}

const ResearchArticlePage = async ({ params }: PageProps) => {
  const { slug } = await params;
  const publication = getPublication(slug);

  if (!publication) {
    notFound();
  }

  return (
    <>
      <PageHero
        ruled
        eyebrow="Research / Technical Report"
        title={publication.title}
        lede={publication.dek}
        tags={[...publication.tags, `${readTimeForPublication(publication)} MIN READ`]}
      />
      <section className="zoom-viewport py-16 sm:py-20">
        <Container size="sm" className="max-w-2xl">
          <PublicationArticle publication={publication} />
        </Container>
      </section>
    </>
  );
};

export default ResearchArticlePage;
