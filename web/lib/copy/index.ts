import "server-only";

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
