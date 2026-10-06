import { datasets } from "@/components/datasets/data";
import { getModel } from "@/components/models/registry";

import { publications, releases } from "./data";

export type ResearchItem = {
  id: string;
  title: string;
  kind: "Technical Report" | "Research" | "Model Release" | "Datasets";
  description: string;
  tags: string[];
  languages: string[];
  topics: string[];
  /** ISO date, for reports and releases. */
  date?: string;
  href: string;
  cta: string;
};

const LANGUAGES = ["Luganda", "Swahili"];

// Everything on the research index, newest first, as plain data for the
// client-side grid (the full reports stay on the server).
export function researchItems(): ResearchItem[] {
  const reports: ResearchItem[] = publications.map((p) => {
    const languages = p.tags.filter((t) => LANGUAGES.includes(t));
    const topics = p.tags.filter((t) => !LANGUAGES.includes(t));
    return {
      id: `report-${p.slug}`,
      title: p.title,
      kind: "Technical Report",
      description: p.dek,
      tags: [...languages, topics[0]].filter(Boolean).slice(0, 2),
      languages,
      topics,
      date: p.date,
      href: `/research/${p.slug}`,
      cta: "Read the Research",
    };
  });

  const releaseItems: ResearchItem[] = releases.map((r) => {
    const slug = r.href.split("/").pop() ?? "";
    const languages = getModel(slug)?.languageNames.filter((l) => l !== "English") ?? [];
    return {
      id: `release-${r.date}`,
      title: r.title,
      kind: "Model Release",
      description: r.description,
      tags: [...languages, "Release"],
      languages,
      topics: ["Model releases"],
      date: r.date,
      href: r.href,
      cta: "View the Model",
    };
  });

  const corpus: ResearchItem = {
    id: "civic-corpus",
    title: "The Civic Corpus",
    kind: "Research",
    description: "Olukiiko → council → local_government.body. The speech, data, and terminology behind the infrastructure.",
    tags: ["Luganda", "Terminology"],
    languages: ["Luganda"],
    topics: ["Terminology"],
    href: "/research/civic-corpus",
    cta: "Explore the Corpus",
  };

  const datasetIndex: ResearchItem = {
    id: "datasets",
    title: "Datasets",
    kind: "Datasets",
    description: `Every source behind every model: ${datasets.length} open datasets.`,
    tags: ["Swahili", "Luganda"],
    languages: LANGUAGES,
    topics: ["Datasets"],
    href: "/datasets",
    cta: "Browse the Datasets",
  };

  const dated = [...reports, ...releaseItems].sort((a, b) =>
    (b.date ?? "").localeCompare(a.date ?? ""),
  );
  return [corpus, ...dated, datasetIndex];
}
