import { registryModels } from "@/components/models/registry";

export type BenchmarkEntry = {
  model: string;
  org: string;
  isOurs: boolean;
  bleu: number;
  chrf: number;
  /** Total parameters in billions, when publicly disclosed. */
  params?: number;
  href: string;
};

export type LanguageBenchmark = {
  code: string;
  label: string;
  evalSet: string;
  note?: string;
  entries: BenchmarkEntry[];
};

function ours(slug: string): BenchmarkEntry {
  const model = registryModels.find((m) => m.slug === slug);
  if (!model) throw new Error(`Unknown model slug: ${slug}`);
  return {
    model: model.name,
    org: "CommonMind",
    isOurs: true,
    bleu: model.evaluation.bleu,
    chrf: model.evaluation.chrf,
    params: model.base.paramsNumeric,
    href: `/models/${model.slug}`,
  };
}

const CRANE_SW = "https://huggingface.co/CraneAILabs/swahili-gemma-1b";
const CRANE_LG = "https://huggingface.co/CraneAILabs/ganda-gemma-1b";

// External figures are published third-party numbers, not re-run by us, and
// cited by source. Every entry in the Swahili set was scored on the same
// FLORES-200 devtest split, so BLEU/chrF++ are directly comparable.
export const swahiliFlores: LanguageBenchmark = {
  code: "sw",
  label: "English → Swahili",
  evalSet: "FLORES-200 devtest · 1,012 sentence pairs",
  entries: [
    {
      model: "Gemma 3 1B (base)",
      org: "Google",
      isOurs: false,
      bleu: 0.41,
      chrf: 14.28,
      params: 1,
      href: "https://huggingface.co/google/gemma-3-1b-it",
    },
    { model: "Gemma 3 4B", org: "Google", isOurs: false, bleu: 10.9, chrf: 44.1, params: 4, href: CRANE_SW },
    {
      model: "Swahili-gemma-1B (Crane)",
      org: "Crane AI Labs",
      isOurs: false,
      bleu: 27.6,
      chrf: 56.8,
      params: 1,
      href: CRANE_SW,
    },
    ours("swahili-gemma-1b-it"),
    { model: "Gemma 3 27B", org: "Google", isOurs: false, bleu: 29.4, chrf: 60.0, params: 27, href: CRANE_SW },
    { model: "GPT-5 Mini", org: "OpenAI", isOurs: false, bleu: 31.8, chrf: 62.4, href: CRANE_SW },
    ours("swahili-nllb-600m"),
    { model: "Gemini 2.0 Flash", org: "Google", isOurs: false, bleu: 35.6, chrf: 64.6, href: CRANE_SW },
    ours("swahili-nllb-1-3b"),
  ],
};

// Luganda: our model was scored on a test split of its SALT + Kimera training data that
// overlaps the training sentences, so it is only compared head-to-head with the base
// model on that same split.
export const lugandaHeldOut: LanguageBenchmark = {
  code: "lg",
  label: "English ↔ Luganda",
  evalSet: "SALT + Kimera test split, overlaps training · 100 examples",
  entries: [
    {
      model: "Gemma 3 1B (base)",
      org: "Google",
      isOurs: false,
      bleu: 0.06,
      chrf: 8.84,
      params: 1,
      href: "https://huggingface.co/google/gemma-3-1b-it",
    },
    ours("luganda-gemma-1b-it"),
  ],
};

// Published English→Luganda FLORES-200 references. Shown for context only:
// a different evaluation set from ours, so not a head-to-head comparison.
export const lugandaFloresReferences: LanguageBenchmark = {
  code: "lg-ref",
  label: "English → Luganda · published references",
  evalSet: "FLORES-200 devtest · 1,012 sentence pairs",
  note: "Published by Crane AI Labs on FLORES-200, a different evaluation set from the split above.",
  entries: [
    { model: "Gemma 3 4B", org: "Google", isOurs: false, bleu: 1.1, chrf: 20.05, href: CRANE_LG },
    { model: "Gemma 3 27B", org: "Google", isOurs: false, bleu: 3.65, chrf: 31.37, href: CRANE_LG },
    { model: "GPT-5 Mini", org: "OpenAI", isOurs: false, bleu: 5.14, chrf: 36.55, href: CRANE_LG },
    { model: "Ganda-gemma-1B", org: "Crane AI Labs", isOurs: false, bleu: 6.99, chrf: 40.32, href: CRANE_LG },
    { model: "Gemini 2.0 Flash", org: "Google", isOurs: false, bleu: 7.94, chrf: 43.38, href: CRANE_LG },
  ],
};

/* ------------------------------------------------------------------ */
/* CivicBench Africa                                                   */
/* ------------------------------------------------------------------ */

export type BenchComponent = {
  id: string;
  name: string;
  measures: string;
  metric: string;
  format: string;
  /** Anchor to live results on this page, where results exist. */
  results?: string;
};

export const civicBench: BenchComponent[] = [
  {
    id: "asr",
    name: "Civic Speech Recognition",
    measures: "Transcription fidelity across community voice reports and public meeting recordings.",
    metric: "WER · CER",
    format: "audio → reference transcript",
  },
  {
    id: "code-switching",
    name: "Code-Switching",
    measures: "Robustness across transitions between local languages and English within the same conversation.",
    metric: "WER on switched spans",
    format: "audio/text with switch annotations",
  },
  {
    id: "terminology",
    name: "Civic Terminology",
    measures: "Mapping locally expressed civic concepts to shared meanings across languages and contexts.",
    metric: "Accuracy · top-k",
    format: "expression → concept",
  },
  {
    id: "translation",
    name: "Translation",
    measures: "Preservation of meaning between English and local languages on standardised evaluation sets.",
    metric: "BLEU · chrF++",
    format: "parallel sentence pairs",
    results: "#results",
  },
  {
    id: "classification",
    name: "Issue Classification",
    measures: "Classification of community reports across civic domains, including public services, elections, and governance.",
    metric: "Macro-F1",
    format: "report → category",
  },
  {
    id: "ner",
    name: "Entity Recognition",
    measures: "Extraction of institutions, public services, official roles, and geographic references from civic discourse.",
    metric: "Span F1",
    format: "BIO-tagged spans",
  },
  {
    id: "geo",
    name: "Geographic Interpretation",
    measures: "Resolution of local place references, from villages and parishes to administrative boundaries.",
    metric: "Accuracy by administrative level",
    format: "mention → admin unit",
  },
  {
    id: "context",
    name: "Claim and Context Assessment",
    measures: "Identification of claims requiring additional evidence, verification, or contextual interpretation.",
    metric: "Calibrated F1",
    format: "claim → context flag",
  },
  {
    id: "summarisation",
    name: "Report Summarisation",
    measures: "Faithful synthesis of community reports and public discussions, distinguishing concerns raised from responses provided.",
    metric: "Faithfulness · ROUGE-L",
    format: "transcript → structured summary",
  },
];
