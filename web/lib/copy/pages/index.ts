import type { CopyTree } from "../overlay";

import { applications } from "./applications";
import { benchmarks } from "./benchmarks";
import { build } from "./build";
import { civicCorpus } from "./civic-corpus";
import { dataLab } from "./data-lab";
import { datasets } from "./datasets";
import { home } from "./home";
import { languages } from "./languages";
import { models } from "./models";
import { research } from "./research";

// Every page whose words are edited in the Studio: one document each, with
// the id "page-<key>". The Studio's form for a page is generated from its
// original wording here (sanity/pageCopy.ts), and the site lays the
// published text over it (lib/copy).
export const PAGES = {
  home: { title: "Home", copy: home },
  models: { title: "Models", copy: models },
  languages: { title: "Languages", copy: languages },
  benchmarks: { title: "Benchmarks", copy: benchmarks },
  build: { title: "Build", copy: build },
  research: { title: "Research", copy: research },
  civicCorpus: { title: "Civic Corpus", copy: civicCorpus },
  datasets: { title: "Datasets", copy: datasets },
  applications: { title: "Applications", copy: applications },
  dataLab: { title: "Data Lab", copy: dataLab },
} satisfies Record<string, { title: string; copy: CopyTree }>;

export type PageKey = keyof typeof PAGES;
export type PageCopy<K extends PageKey> = (typeof PAGES)[K]["copy"];

export const pageDocumentId = (key: PageKey) => `page-${key}`;
export const pageTypeName = (key: PageKey) => `${key}Page`;
