import { modelsForLanguage } from "@/components/models/registry";
import type { Content } from "@/lib/content/types";

import type { Language } from "./data";

// Everything CommonMind has built around one language.
export function ecosystemFor(
  language: Language,
  { datasets, publications }: Pick<Content, "datasets" | "publications">,
) {
  const models = modelsForLanguage(language.code);
  const modelNames = new Set(models.map((m) => m.name));
  const corpora = datasets.filter((d) => d.usedBy.some((u) => modelNames.has(u)));
  const research = publications.filter((p) =>
    p.tags.some((t) => language.tags.includes(t)),
  );
  const benchmarks = models.map((m) => ({
    model: m.name,
    slug: m.slug,
    direction: m.directions.join(" · "),
    bleu: m.evaluation.bleu,
    chrf: m.evaluation.chrf,
    set: m.evaluation.short,
  }));
  return { models, corpora, research, benchmarks };
}
