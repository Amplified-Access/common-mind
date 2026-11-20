// Registry metadata for each released model. Every field here is checked
// against the public Hugging Face model card / repo for that model.

export type TaskId =
  | "transcription"
  | "translation"
  | "civic-terminology"
  | "issue-classification"
  | "research";

export type Evaluation = {
  /** Full description of the evaluation set. */
  set: string;
  /** Short label for tables. */
  short: string;
  /** One sentence for the benchmarks tab. */
  summary: string;
  bleu: number;
  chrf: number;
  baseBleu?: number;
  baseChrf?: number;
  /** True when scored on FLORES-200 devtest, i.e. comparable with published baselines. */
  flores: boolean;
};

export type RegistryMeta = {
  name: string;
  /** ISO 639 codes of the languages it serves, besides English. */
  languages: string[];
  /** Where the weights are published, by platform name. */
  platforms: string[];
  hfId: string;
  task: TaskId;
  languageNames: string[];
  directions: string[];
  base: { id: string; href: string; params: string; paramsNumeric: number };
  architecture: string;
  trainable: string;
  approach: string;
  license: string;
  release: string;
  artifact: string;
  maxLength: string;
  availability: { label: string; href?: string }[];
  evaluation: Evaluation;
  researchSlug: string;
};

const hf = (id: string) => `https://huggingface.co/${id}`;
const kaggle = (slug: string) => `https://www.kaggle.com/models/amplifiedaccess/${slug}`;

export const registry: Record<string, RegistryMeta> = {
  "luganda-gemma-1b-it": {
    name: "Luganda-gemma-1B-it",
    languages: ["lg"],
    platforms: ["HuggingFace", "Kaggle", "Ollama"],
    hfId: "AmplifiedAccess/Luganda-gemma-1b-it",
    task: "translation",
    languageNames: ["Luganda", "English"],
    directions: ["en → lg", "lg → en"],
    base: {
      id: "google/gemma-3-1b-it",
      href: hf("google/gemma-3-1b-it"),
      params: "1B",
      paramsNumeric: 1.0,
    },
    architecture: "Decoder-only · Gemma 3",
    trainable: "13.05M",
    approach: "QLoRA · 4-bit NF4 · r16",
    license: "Gemma terms",
    release: "2026-05-23",
    artifact: "52 MB adapter",
    maxLength: "256 tokens",
    availability: [
      { label: "Hugging Face", href: hf("AmplifiedAccess/Luganda-gemma-1b-it") },
      { label: "Ollama", href: "https://ollama.com/amplifiedaccessorg/Luganda-gemma-1b-it" },
      { label: "Kaggle", href: kaggle("luganda-gemma-1b-it") },
    ],
    evaluation: {
      set: "Test split of the SALT and Kimera training data (100 examples, English↔Luganda), overlapping the training sentences",
      short: "Training-data test split",
      summary:
        "Evaluated on 100 English–Luganda examples from a test split of the training data (the Sunbird SALT corpus and the Kimera English–Luganda corpus). The split was made after each sentence pair was turned into several prompts, so 95 of the 100 test sentences also appear in training in another form, such as the opposite translation direction. The score is not a held-out result and is not comparable to the FLORES-200 scores of the Swahili models.",
      bleu: 13.85,
      chrf: 46.59,
      baseBleu: 0.06,
      baseChrf: 8.84,
      flores: false,
    },
    researchSlug: "luganda-gemma-qlora",
  },
  "swahili-gemma-1b-it": {
    name: "Swahili-gemma-1B-it",
    languages: ["sw"],
    platforms: ["HuggingFace", "Kaggle", "Ollama"],
    hfId: "AmplifiedAccess/Swahili-gemma-1b-it",
    task: "translation",
    languageNames: ["Swahili", "English"],
    directions: ["en → sw"],
    base: {
      id: "google/gemma-3-1b-it",
      href: hf("google/gemma-3-1b-it"),
      params: "1B",
      paramsNumeric: 1.0,
    },
    architecture: "Decoder-only · Gemma 3",
    trainable: "26.09M",
    approach: "Continued pretraining → QLoRA SFT · merged fp16",
    license: "Gemma terms + non-commercial",
    release: "2026-08-11",
    artifact: "fp16 weights · ~814 MB q4_K_M GGUF",
    maxLength: "512 tokens",
    availability: [
      { label: "Hugging Face", href: hf("AmplifiedAccess/Swahili-gemma-1b-it") },
      { label: "Ollama", href: "https://ollama.com/amplifiedaccessorg/Swahili-gemma-1b-it" },
      { label: "Kaggle", href: kaggle("swahili-gemma-1b-it") },
    ],
    evaluation: {
      set: "FLORES-200 devtest (1,012 sentence pairs, English→Swahili)",
      short: "FLORES-200",
      summary:
        "Evaluated on 1,012 English–Swahili sentence pairs from the FLORES-200 devtest benchmark, providing a reproducible measure of translation quality.",
      bleu: 28.86,
      chrf: 54.77,
      baseBleu: 0.41,
      baseChrf: 14.28,
      flores: true,
    },
    researchSlug: "swahili-gemma-cpt-sft",
  },
  "swahili-nllb-1-3b": {
    name: "Swahili-nllb-1.3B",
    languages: ["sw"],
    platforms: ["HuggingFace", "Kaggle"],
    hfId: "AmplifiedAccess/Swahili-nllb-1.3b",
    task: "translation",
    languageNames: ["Swahili", "English"],
    directions: ["en → sw"],
    base: {
      id: "facebook/nllb-200-distilled-1.3B",
      href: hf("facebook/nllb-200-distilled-1.3B"),
      params: "1.37B",
      paramsNumeric: 1.37,
    },
    architecture: "Encoder-decoder · NLLB-200",
    trainable: "23.6M",
    approach: "LoRA · r16 · ~1.7% of base",
    license: "CC-BY-NC-4.0",
    release: "2026-09-03",
    artifact: "LoRA adapter",
    maxLength: "128 tokens",
    availability: [
      { label: "Hugging Face", href: hf("AmplifiedAccess/Swahili-nllb-1.3b") },
      { label: "Kaggle", href: kaggle("swahili-nllb-1-3b") },
    ],
    evaluation: {
      set: "FLORES-200 devtest (1,012 sentence pairs, English→Swahili)",
      short: "FLORES-200",
      summary:
        "Evaluated on 1,012 English–Swahili sentence pairs from the FLORES-200 devtest benchmark, providing a reproducible measure of translation quality.",
      bleu: 38.74,
      chrf: 63.37,
      flores: true,
    },
    researchSlug: "nllb-lora-vs-chat-llms",
  },
  "swahili-nllb-600m": {
    name: "Swahili-nllb-600M",
    languages: ["sw"],
    platforms: ["HuggingFace", "Kaggle"],
    hfId: "AmplifiedAccess/Swahili-nllb-600m",
    task: "translation",
    languageNames: ["Swahili", "English"],
    directions: ["en → sw"],
    base: {
      id: "facebook/nllb-200-distilled-600M",
      href: hf("facebook/nllb-200-distilled-600M"),
      params: "615M",
      paramsNumeric: 0.615,
    },
    architecture: "Encoder-decoder · NLLB-200",
    trainable: "8.65M",
    approach: "LoRA · r16 · ~1.4% of base",
    license: "CC-BY-NC-4.0",
    release: "2026-09-03",
    artifact: "LoRA adapter",
    maxLength: "128 tokens",
    availability: [
      { label: "Hugging Face", href: hf("AmplifiedAccess/Swahili-nllb-600m") },
      { label: "Kaggle", href: kaggle("swahili-nllb-600m") },
    ],
    evaluation: {
      set: "FLORES-200 devtest (1,012 sentence pairs, English→Swahili)",
      short: "FLORES-200",
      summary:
        "Evaluated on 1,012 English–Swahili sentence pairs from the FLORES-200 devtest benchmark, providing a reproducible measure of translation quality.",
      bleu: 35.97,
      chrf: 61.26,
      flores: true,
    },
    researchSlug: "nllb-lora-vs-chat-llms",
  },
};

// Each model's written copy (tagline, overview, usage example) is edited in
// the Studio and read with copyFor (lib/content).
export type RegistryModel = RegistryMeta & { slug: string };

export const registryModels: RegistryModel[] = Object.entries(registry).map(
  ([slug, meta]) => ({ ...meta, slug }),
);

export function getModel(slug: string) {
  return registryModels.find((model) => model.slug === slug);
}

export function modelsForLanguage(code: string) {
  return registryModels.filter((model) => model.languages.includes(code));
}

export function formatDate(iso: string, month: "long" | "short" = "short") {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month,
    day: "numeric",
    timeZone: "UTC",
  });
}

/* ------------------------------------------------------------------ */
/* Task taxonomy                                                       */
/* ------------------------------------------------------------------ */

export type Task = {
  id: TaskId;
  label: string;
  definition: string;
  input: string;
  output: string;
  example: { input: string; output: [string, string][] };
};

export const tasks: Task[] = [
  {
    id: "transcription",
    label: "Transcription",
    definition:
      "Community voice arrives as audio, often code-switched.",
    input: "audio/wav · 16 kHz",
    output: "text + segments + speaker turns",
    example: {
      input: "Voice note, Luganda: a collapsed footbridge",
      output: [
        ["language", "lg"],
        ["segments", "3"],
        ["code_switch", "lg/en"],
      ],
    },
  },
  {
    id: "translation",
    label: "Translation",
    definition:
      "Between English and languages beyond the mainstream.",
    input: "text · source language",
    output: "text · target language",
    example: {
      input: "Gavumenti erwawo okusasula abasawo mu malwaliro gaayo",
      output: [
        ["target", "en"],
        ["text", "The government takes long to pay doctors in public hospitals"],
      ],
    },
  },
  {
    id: "civic-terminology",
    label: "Civic terminology",
    definition:
      "How a community says it, mapped to what it means.",
    input: "expression · language",
    output: "concept + context",
    example: {
      input: "Embalirira teyali nnambulukufu",
      output: [
        ["term", "embalirira → budget"],
        ["concept", "public_finance.transparency"],
      ],
    },
  },
  {
    id: "issue-classification",
    label: "Issue classification",
    definition:
      "Route each report to the right place.",
    input: "report text",
    output: "category + entities + location",
    example: {
      input: "Report: polling station opened late",
      output: [
        ["category", "elections.logistics"],
        ["route_to", "electoral_body"],
      ],
    },
  },
  {
    id: "research",
    label: "Research",
    definition:
      "Checkpoints released with every report, reproducible.",
    input: "varies",
    output: "checkpoints + eval logs",
    example: {
      input: "Ablation: NLLB LoRA vs instruction-tuned LLM",
      output: [
        ["report", "nllb-lora-vs-chat-llms"],
        ["eval", "FLORES-200"],
      ],
    },
  },
];
