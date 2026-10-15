import "server-only";

import type { PortableTextBlock } from "next-sanity";
import { cache } from "react";

import { sanityFetch } from "@/lib/sanity/client";

import { CONTENT_QUERY, LEGAL_PAGE_QUERY } from "./queries";
import type { Content, ModelCopy } from "./types";

export type * from "./types";

/**
 * All of the site's editorial content, in one query. The whole set is small,
 * and `cache` makes the layout and every component in a request share one
 * fetch (which Next caches for a minute; lib/sanity/client.ts).
 */
export const getContent = cache(async (): Promise<Content> => {
  const content = await sanityFetch<Content | null>(CONTENT_QUERY);
  if (!content?.settings) {
    throw new Error(
      'Sanity has no "siteSettings" document. Run `pnpm sanity:seed` (docs/cms.md).',
    );
  }
  return content;
});

const NO_COPY: Omit<ModelCopy, "slug"> = {
  tagline: "",
  overview: "",
  metrics: [],
  capabilities: [],
  achievements: [],
  usage: { language: "python", code: "" },
};

/** A registry model's written copy; empty until an editor writes it. */
export function copyFor(content: Content, slug: string): ModelCopy {
  return content.models.find((m) => m.slug === slug) ?? { slug, ...NO_COPY };
}

export type LegalPage = {
  title: string;
  description: string;
  /** ISO date. */
  updated: string;
  body: PortableTextBlock[];
  closing: PortableTextBlock[];
};

/** A legal page's text ("legal-privacy", "legal-terms"), or null if unpublished. */
export const getLegalPage = cache((id: string) =>
  sanityFetch<LegalPage | null>(LEGAL_PAGE_QUERY, { id }),
);
