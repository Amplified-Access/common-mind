import { models } from "@/components/models/data";

export type BenchmarkEntry = {
  model: string;
  org: string;
  isOurs: boolean;
  bleu: number;
  chrf: number;
  href: string;
};

export type LanguageBenchmark = {
  code: string;
  label: string;
  evalSet: string;
  entries: BenchmarkEntry[];
};

function metricValue(modelSlug: string, label: string): number {
  const model = models.find((m) => m.slug === modelSlug);
  const metric = model?.metrics.find((m) => m.label === label);
  if (!metric) {
    throw new Error(`Missing "${label}" metric for model "${modelSlug}"`);
  }
  return Number(metric.value);
}

function ours(modelSlug: string): BenchmarkEntry {
  const model = models.find((m) => m.slug === modelSlug);
  if (!model) throw new Error(`Unknown model slug: ${modelSlug}`);
  return {
    model: model.name,
    org: "CommonMind",
    isOurs: true,
    bleu: metricValue(modelSlug, "BLEU score"),
    chrf: metricValue(modelSlug, "chrF++ score"),
    href: `/models#${model.slug}`,
  };
}

// External figures are published, third-party numbers — not independently
// re-run by us — cited by their source so they can be checked. All entries
// in a given section were evaluated on the same FLORES-200 devtest split, so
// BLEU/chrF++ are directly comparable within that section.
export const benchmarks: LanguageBenchmark[] = [
  {
    code: "lg",
    label: "English → Luganda",
    evalSet: "FLORES-200 devtest, 1,012 sentence pairs",
    entries: [
      {
        model: "Gemma 3 1B (base)",
        org: "Google",
        isOurs: false,
        bleu: 0.06,
        chrf: 8.84,
        href: "https://huggingface.co/google/gemma-3-1b-it",
      },
      {
        model: "Gemma 3 4B",
        org: "Google",
        isOurs: false,
        bleu: 1.1,
        chrf: 20.05,
        href: "https://huggingface.co/CraneAILabs/ganda-gemma-1b",
      },
      {
        model: "Gemma 3 27B",
        org: "Google",
        isOurs: false,
        bleu: 3.65,
        chrf: 31.37,
        href: "https://huggingface.co/CraneAILabs/ganda-gemma-1b",
      },
      {
        model: "GPT-5 Mini",
        org: "OpenAI",
        isOurs: false,
        bleu: 5.14,
        chrf: 36.55,
        href: "https://huggingface.co/CraneAILabs/ganda-gemma-1b",
      },
      {
        model: "Ganda-gemma-1B",
        org: "Crane AI Labs",
        isOurs: false,
        bleu: 6.99,
        chrf: 40.32,
        href: "https://huggingface.co/CraneAILabs/ganda-gemma-1b",
      },
      {
        model: "Gemini 2.0 Flash",
        org: "Google",
        isOurs: false,
        bleu: 7.94,
        chrf: 43.38,
        href: "https://huggingface.co/CraneAILabs/ganda-gemma-1b",
      },
      ours("luganda-gemma-1b-it"),
    ],
  },
  {
    code: "sw",
    label: "English → Swahili",
    evalSet: "FLORES-200 devtest, 1,012 sentence pairs",
    entries: [
      {
        model: "Gemma 3 1B (base)",
        org: "Google",
        isOurs: false,
        bleu: 0.41,
        chrf: 14.28,
        href: "https://huggingface.co/google/gemma-3-1b-it",
      },
      {
        model: "Gemma 3 4B",
        org: "Google",
        isOurs: false,
        bleu: 10.9,
        chrf: 44.1,
        href: "https://huggingface.co/CraneAILabs/swahili-gemma-1b",
      },
      {
        model: "Swahili-gemma-1B (Crane)",
        org: "Crane AI Labs",
        isOurs: false,
        bleu: 27.6,
        chrf: 56.8,
        href: "https://huggingface.co/CraneAILabs/swahili-gemma-1b",
      },
      ours("swahili-gemma-1b-it"),
      {
        model: "Gemma 3 27B",
        org: "Google",
        isOurs: false,
        bleu: 29.4,
        chrf: 60.0,
        href: "https://huggingface.co/CraneAILabs/swahili-gemma-1b",
      },
      {
        model: "GPT-5 Mini",
        org: "OpenAI",
        isOurs: false,
        bleu: 31.8,
        chrf: 62.4,
        href: "https://huggingface.co/CraneAILabs/swahili-gemma-1b",
      },
      ours("swahili-nllb-600m"),
      {
        model: "Gemini 2.0 Flash",
        org: "Google",
        isOurs: false,
        bleu: 35.6,
        chrf: 64.6,
        href: "https://huggingface.co/CraneAILabs/swahili-gemma-1b",
      },
      ours("swahili-nllb-1-3b"),
    ],
  },
];
