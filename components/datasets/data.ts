export type DatasetKind =
  | "Parallel"
  | "Instruction"
  | "Question answering"
  | "Monolingual"
  | "Evaluation";

export type Dataset = {
  slug: string;
  name: string;
  kind: DatasetKind;
  /** Languages the dataset contributes, besides English. */
  languages: string[];
  source: string;
  href: string;
  description: string;
  /** How much of it the models used, as reported in the technical reports. */
  used?: string;
  usedBy: string[];
};

export const datasets: Dataset[] = [
  {
    slug: "sunbird-salt",
    name: "Sunbird SALT",
    kind: "Parallel",
    languages: ["Luganda", "Swahili"],
    source: "HuggingFace",
    href: "https://huggingface.co/datasets/Sunbird/salt",
    description:
      "Professionally translated, multi-way parallel corpus from Sunbird AI covering agriculture, health, society, and other locally relevant topics across Ugandan languages and Swahili.",
    used: "23,947 English–Swahili pairs; ~24,000 English–Luganda pairs",
    usedBy: [
      "Luganda-gemma-1B-it",
      "Swahili-gemma-1B-it",
      "Swahili-nllb-1.3B",
      "Swahili-nllb-600M",
    ],
  },
  {
    slug: "mafand-mt",
    name: "MAFAND-MT (en-swa)",
    kind: "Parallel",
    languages: ["Swahili"],
    source: "GitHub",
    href: "https://github.com/masakhane-io/lafand-mt",
    description:
      "Human-translated news domain parallel data from Masakhane's MAFAND-MT project, covering English to Swahili and other African language pairs.",
    used: "32,414 pairs",
    usedBy: ["Swahili-gemma-1B-it", "Swahili-nllb-1.3B", "Swahili-nllb-600M"],
  },
  {
    slug: "rogendo-en-sw",
    name: "English-Swahili Sentence Pairs",
    kind: "Parallel",
    languages: ["Swahili"],
    source: "HuggingFace",
    href: "https://huggingface.co/datasets/Rogendo/English-Swahili-Sentence-Pairs",
    description:
      "General-domain English to Swahili parallel sentence pairs used across all of our Swahili translation models.",
    used: "58,052 pairs (Gemma); capped at 60,000 (NLLB)",
    usedBy: ["Swahili-gemma-1B-it", "Swahili-nllb-1.3B", "Swahili-nllb-600M"],
  },
  {
    slug: "inkuba-swahili-mmt",
    name: "Inkuba-Swahili-MMT",
    kind: "Parallel",
    languages: ["Swahili"],
    source: "HuggingFace",
    href: "https://huggingface.co/datasets/Svngoku/Inkuba-Swahili-MMT",
    description:
      "Multilingual machine translation pairs drawn from the Inkuba corpus, normalized to English to Swahili direction for translation fine-tuning.",
    used: "29,991 pairs (Gemma); capped at 30,000 (NLLB)",
    usedBy: ["Swahili-gemma-1B-it", "Swahili-nllb-1.3B", "Swahili-nllb-600M"],
  },
  {
    slug: "aya-dataset",
    name: "Aya Dataset (Swahili)",
    kind: "Instruction",
    languages: ["Swahili"],
    source: "HuggingFace",
    href: "https://huggingface.co/datasets/CohereForAI/aya_dataset",
    description:
      "Cohere For AI's human-annotated multilingual instruction dataset, filtered to Swahili, used for general instruction-following ability.",
    used: "359 examples",
    usedBy: ["Swahili-gemma-1B-it"],
  },
  {
    slug: "alpaca-cleaned-swahili",
    name: "Alpaca-Cleaned (Swahili)",
    kind: "Instruction",
    languages: ["Swahili"],
    source: "HuggingFace",
    href: "https://huggingface.co/datasets/iamshnoo/alpaca-cleaned-swahili",
    description:
      "Swahili translation of the cleaned Alpaca instruction-tuning dataset, used to teach general Swahili instruction-following.",
    used: "14,844 examples",
    usedBy: ["Swahili-gemma-1B-it"],
  },
  {
    slug: "kenswquad",
    name: "KenSwQuAD",
    kind: "Question answering",
    languages: ["Swahili"],
    source: "HuggingFace",
    href: "https://huggingface.co/datasets/lighteval/KenSwQuAD",
    description:
      "Swahili question-answering dataset from Kenyan news text, used as additional instruction-tuning signal.",
    usedBy: ["Swahili-gemma-1B-it"],
  },
  {
    slug: "jamiiforums-2b",
    name: "JamiiForums-2B",
    kind: "Monolingual",
    languages: ["Swahili"],
    source: "HuggingFace",
    href: "https://huggingface.co/datasets/AlexLeoTz/jamiiforums-2b",
    description:
      "Large monolingual Swahili forum text corpus, used for continued pretraining and as a back-translation source of natural Swahili.",
    usedBy: ["Swahili-gemma-1B-it"],
  },
  {
    slug: "inkuba-mono-swahili",
    name: "Inkuba-Mono (Swahili)",
    kind: "Monolingual",
    languages: ["Swahili"],
    source: "HuggingFace",
    href: "https://huggingface.co/datasets/lelapa/Inkuba-Mono",
    description:
      "Monolingual Swahili text corpus from Lelapa AI, used for continued pretraining before instruction and translation fine-tuning.",
    usedBy: ["Swahili-gemma-1B-it"],
  },
  {
    slug: "flores-plus",
    name: "FLORES+",
    kind: "Evaluation",
    languages: ["Swahili"],
    source: "HuggingFace",
    href: "https://huggingface.co/datasets/openlanguagedata/flores_plus",
    description:
      "Open Language Data's FLORES+ multilingual evaluation benchmark, used to score English to Swahili translation quality (BLEU / chrF++) for every Swahili model.",
    used: "FLORES-200 devtest, 1,012 sentence pairs",
    usedBy: ["Swahili-gemma-1B-it", "Swahili-nllb-1.3B", "Swahili-nllb-600M"],
  },
  {
    slug: "luganda-llm-data",
    name: "Luganda LLM Data",
    kind: "Parallel",
    languages: ["Luganda"],
    source: "Kaggle",
    href: "https://www.kaggle.com/datasets/gracenoble/luganda-llm-data",
    description:
      "Our cleaned, split (train / validation / test) English-Luganda parallel corpus derived from Sunbird SALT, as used directly in Luganda model training.",
    used: "94,542 examples, split 90/5/5",
    usedBy: ["Luganda-gemma-1B-it"],
  },
];
