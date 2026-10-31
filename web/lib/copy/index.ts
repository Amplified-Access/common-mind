import "server-only";

import type { Metadata } from "next";
import { cache } from "react";

import { sanityFetch } from "@/lib/sanity/client";

import { overlay } from "./overlay";
import { pageDocumentId, PAGES, type PageCopy, type PageKey } from "./pages";

export { Emphasized } from "./emphasized";

/** A page's words: the published text laid over the original wording. */
export const getPageCopy = cache(async <K extends PageKey>(key: K): Promise<PageCopy<K>> => {
  const edits = await sanityFetch<unknown>("*[_id == $id][0]", { id: pageDocumentId(key) });
  return overlay(PAGES[key].copy, edits);
});

type PageWithMeta = {
  [K in PageKey]: PageCopy<K> extends { meta: { title: string; description: string } } ? K : never;
}[PageKey];

/**
 * A page's title and description for search results and link previews, and
 * its canonical URL: the page's path, resolved against the site's address.
 */
export async function pageMetadata(key: PageWithMeta, path: string): Promise<Metadata> {
  const { meta } = await getPageCopy(key);
  return { title: meta.title, description: meta.description, alternates: { canonical: path } };
}
