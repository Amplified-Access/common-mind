import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/common/container";
import { PublicationArticle } from "@/components/research/publication-article";
import { readTimeForPublication } from "@/components/research/read-time";
import { PageHero } from "@/components/system/page-hero";
import { getContent } from "@/lib/content";
import { getPageCopy } from "@/lib/copy";
import { fill } from "@/lib/copy/fill";

type PageProps = {
  params: Promise<{ slug: string }>;
};

async function getPublication(slug: string) {
  const { publications } = await getContent();
  return publications.find((publication) => publication.slug === slug);
}

export async function generateStaticParams() {
  const { publications } = await getContent();
  return publications.map((publication) => ({ slug: publication.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const publication = await getPublication(slug);

  if (!publication) {
    return {};
  }

  return {
    title: publication.title,
    description: publication.dek,
    alternates: { canonical: `/research/${slug}` },
  };
}

const ResearchArticlePage = async ({ params }: PageProps) => {
  const { slug } = await params;
  const publication = await getPublication(slug);

  if (!publication) {
    notFound();
  }

  const copy = await getPageCopy("researchReport");

  return (
    <>
      <PageHero
        ruled
        eyebrow={copy.eyebrow}
        title={publication.title}
        lede={publication.dek}
        tags={[
          ...publication.tags,
          fill(copy.readTime, { minutes: String(readTimeForPublication(publication)) }),
        ]}
      />
      <section className="zoom-viewport py-16 sm:py-20">
        <Container size="sm" className="max-w-2xl">
          <PublicationArticle publication={publication} copy={copy} />
        </Container>
      </section>
    </>
  );
};

export default ResearchArticlePage;
