import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getLegalPage } from "@/lib/content";

import { LegalDocument } from "./legal-document";
import { LegalBody, LegalText } from "./legal-text";

// A legal page edited in the Studio: "legal-privacy", "legal-terms".

const monthYear = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

export async function legalMetadata(id: string, path: string): Promise<Metadata> {
  const page = await getLegalPage(id);
  return page
    ? { title: page.title, description: page.description, alternates: { canonical: path } }
    : {};
}

export async function CmsLegalPage({ id }: { id: string }) {
  const page = await getLegalPage(id);
  if (!page) notFound();
  return (
    <LegalDocument
      title={page.title}
      updated={monthYear(page.updated)}
      closing={page.closing.length > 0 && <LegalText value={page.closing} />}
    >
      <LegalBody value={page.body} />
    </LegalDocument>
  );
}
