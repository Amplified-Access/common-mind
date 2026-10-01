import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/common/container";
import { publications } from "@/components/research/data";
import { PublicationArticle } from "@/components/research/publication-article";

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
    <section className="pt-20 pb-20 sm:pt-28 sm:pb-28">
      <Container size="lg">
        <PublicationArticle publication={publication} />
      </Container>
    </section>
  );
};

export default ResearchArticlePage;
