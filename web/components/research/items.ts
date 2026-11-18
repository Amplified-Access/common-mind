import { getModel } from "@/components/models/registry";
import type { Content } from "@/lib/content/types";

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
export function researchItems({
  datasets,
  publications,
  releases,
}: Pick<Content, "datasets" | "publications" | "releases">): ResearchItem[] {
  const reports: ResearchItem[] = publications.map((p) => {
    const languages = p.tags.filter((t) => LANGUAGES.includes(t));
    const topics = p.tags.filter((t) => !LANGUAGES.includes(t));
    return {
      id: `report-${p.slug}`,
      title: p.card.title ?? p.title,
      kind: "Technical Report",
      description: p.card.description,
      tags: p.card.tags,
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
      title: r.card.title ?? r.title,
      kind: "Model Release",
      description: r.card.description,
      tags: r.card.tags,
      languages,
      topics: ["Model releases"],
      date: r.date,
      href: r.href,
      cta: r.card.cta,
    };
  });

  const corpus: ResearchItem = {
    id: "civic-corpus",
    title: "The Civic Corpus",
    kind: "Research",
    description:
      "An open foundation for multilingual civic understanding, connecting local expressions, civic terminology, and structured language data to shared concepts across communities.",
    tags: ["Luganda", "Terminology"],
    languages: ["Luganda"],
    topics: ["Terminology"],
    href: "/research/civic-corpus",
    cta: "Explore the Corpus",
  };

  const datasetIndex: ResearchItem = {
    id: "datasets",
    title: "Open Language Datasets",
    kind: "Datasets",
    description: `Explore ${datasets.length} open datasets supporting multilingual model development, training, and evaluation across Luganda and Swahili.`,
    tags: ["Multilingual", "Open Data"],
    languages: LANGUAGES,
    topics: ["Datasets"],
    href: "/datasets",
    cta: "Browse Datasets",
  };

  const signing: ResearchItem = {
    id: "sign",
    title: "Sign",
    kind: "Research",
    description: "Type or speak in English and a virtual signer shows it in sign language.",
    tags: ["Sign language", "3D avatar"],
    languages: [],
    topics: ["Sign language"],
    href: "/sign",
    cta: "Try the Signer",
  };

  const dated = [...reports, ...releaseItems].sort((a, b) =>
    (b.date ?? "").localeCompare(a.date ?? ""),
  );
  return [signing, corpus, ...dated, datasetIndex];
}
