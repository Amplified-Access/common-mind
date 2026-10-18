import type { CopyTree } from "../overlay";

import { applications } from "./applications";
import { benchmarks } from "./benchmarks";
import { build } from "./build";
import { callToAction } from "./call-to-action";
import { civicCorpus } from "./civic-corpus";
import { dataLab } from "./data-lab";
import { datasetDetail } from "./dataset-detail";
import { datasets } from "./datasets";
import { footer } from "./footer";
import { getStarted } from "./get-started";
import { home } from "./home";
import { languageDetail } from "./language-detail";
import { languages } from "./languages";
import { licenses } from "./licenses";
import { modelDetail } from "./model-detail";
import { models } from "./models";
import { research } from "./research";
import { researchReport } from "./research-report";

// Every page whose words are edited in the Studio: one document each, with
// the id "page-<key>". The Studio's form for a page is generated from its
// original wording here (sanity/pageCopy.ts), and the site lays the
// published text over it (lib/copy).
export const PAGES = {
  home: { title: "Home", copy: home },
  models: { title: "Models", copy: models },
  modelDetail: { title: "A model's page", copy: modelDetail },
  languages: { title: "Languages", copy: languages },
  languageDetail: { title: "A language's page", copy: languageDetail },
  benchmarks: { title: "Benchmarks", copy: benchmarks },
  build: { title: "Build", copy: build },
  getStarted: { title: "Get Started", copy: getStarted },
  research: { title: "Research", copy: research },
  researchReport: { title: "A research report's page", copy: researchReport },
  civicCorpus: { title: "Civic Corpus", copy: civicCorpus },
  datasets: { title: "Datasets", copy: datasets },
  datasetDetail: { title: "A dataset's page", copy: datasetDetail },
  applications: { title: "Applications", copy: applications },
  dataLab: { title: "Data Lab", copy: dataLab },
  licenses: { title: "Licenses", copy: licenses },
  callToAction: { title: "Call to action", copy: callToAction },
  footer: { title: "Footer", copy: footer },
} satisfies Record<string, { title: string; copy: CopyTree }>;

export type PageKey = keyof typeof PAGES;
export type PageCopy<K extends PageKey> = (typeof PAGES)[K]["copy"];

export const pageDocumentId = (key: PageKey) => `page-${key}`;
export const pageTypeName = (key: PageKey) => `${key}Page`;
