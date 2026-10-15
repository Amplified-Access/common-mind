import type { CopyTree } from "../overlay";

import { home } from "./home";

// Every page whose words are edited in the Studio: one document each, with
// the id "page-<key>". The Studio's form for a page is generated from its
// original wording here (sanity/pageCopy.ts), and the site lays the
// published text over it (lib/copy).
export const PAGES = {
  home: { title: "Home", copy: home },
} satisfies Record<string, { title: string; copy: CopyTree }>;

export type PageKey = keyof typeof PAGES;
export type PageCopy<K extends PageKey> = (typeof PAGES)[K]["copy"];

export const pageDocumentId = (key: PageKey) => `page-${key}`;
export const pageTypeName = (key: PageKey) => `${key}Page`;
