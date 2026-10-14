export type DatasetKind =
  | "Parallel"
  | "Instruction"
  | "Question Answering"
  | "Monolingual"
  | "Evaluation";

export type Dataset = {
  slug: string;
  name: string;
  kind: DatasetKind;
  /** Languages the dataset contributes, besides English. */
  languages: string[];
  /** Subject areas, where the source describes them. */
  domains?: string[];
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
    domains: ["Agriculture", "Health", "Society"],
    source: "Hugging Face",
    href: "https://huggingface.co/datasets/Sunbird/salt",
    description:
      "A multilingual parallel corpus covering locally relevant topics across Ugandan languages and Swahili, supporting translation model development.",
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
    domains: ["News"],
    source: "GitHub",
    href: "https://github.com/masakhane-io/lafand-mt",
    description:
      "Human-translated news-domain parallel data supporting English–Swahili machine translation.",
    used: "32,414 pairs",
    usedBy: ["Swahili-gemma-1B-it", "Swahili-nllb-1.3B", "Swahili-nllb-600M"],
  },
  {
    slug: "rogendo-en-sw",
    name: "English–Swahili Sentence Pairs",
    kind: "Parallel",
    languages: ["Swahili"],
    domains: ["General"],
    source: "Hugging Face",
    href: "https://huggingface.co/datasets/Rogendo/English-Swahili-Sentence-Pairs",
    description:
      "General-domain parallel sentences supporting English-to-Swahili translation training.",
    used: "58,052 pairs (Gemma); capped at 60,000 (NLLB)",
    usedBy: ["Swahili-gemma-1B-it", "Swahili-nllb-1.3B", "Swahili-nllb-600M"],
  },
  {
    slug: "inkuba-swahili-mmt",
    name: "Inkuba-Swahili-MMT",
    kind: "Parallel",
    languages: ["Swahili"],
    source: "Hugging Face",
    href: "https://huggingface.co/datasets/Svngoku/Inkuba-Swahili-MMT",
    description:
      "Multilingual parallel data prepared for English-to-Swahili translation fine-tuning.",
    used: "29,991 pairs (Gemma); capped at 30,000 (NLLB)",
    usedBy: ["Swahili-gemma-1B-it", "Swahili-nllb-1.3B", "Swahili-nllb-600M"],
  },
  {
    slug: "aya-dataset",
    name: "Aya Dataset (Swahili)",
    kind: "Instruction",
    languages: ["Swahili"],
    source: "Hugging Face",
    href: "https://huggingface.co/datasets/CohereForAI/aya_dataset",
    description:
      "Human-annotated Swahili instruction data supporting multilingual instruction-following.",
    used: "359 examples",
    usedBy: ["Swahili-gemma-1B-it"],
  },
  {
    slug: "alpaca-cleaned-swahili",
    name: "Alpaca-Cleaned (Swahili)",
    kind: "Instruction",
    languages: ["Swahili"],
    source: "Hugging Face",
    href: "https://huggingface.co/datasets/iamshnoo/alpaca-cleaned-swahili",
    description:
      "Swahili instruction-tuning data adapted from the cleaned Alpaca dataset.",
    used: "14,844 examples",
    usedBy: ["Swahili-gemma-1B-it"],
  },
  {
    slug: "kenswquad",
    name: "KenSwQuAD",
    kind: "Question Answering",
    languages: ["Swahili"],
    domains: ["News"],
    source: "Hugging Face",
    href: "https://huggingface.co/datasets/lighteval/KenSwQuAD",
    description:
      "Swahili question-answering data drawn from Kenyan news content.",
    usedBy: ["Swahili-gemma-1B-it"],
  },
  {
    slug: "jamiiforums-2b",
    name: "JamiiForums-2B",
    kind: "Monolingual",
    languages: ["Swahili"],
    domains: ["Online forums"],
    source: "Hugging Face",
    href: "https://huggingface.co/datasets/AlexLeoTz/jamiiforums-2b",
    description:
      "A large Swahili text corpus supporting continued pretraining and language adaptation.",
    usedBy: ["Swahili-gemma-1B-it"],
  },
  {
    slug: "inkuba-mono-swahili",
    name: "Inkuba-Mono (Swahili)",
    kind: "Monolingual",
    languages: ["Swahili"],
    source: "Hugging Face",
    href: "https://huggingface.co/datasets/lelapa/Inkuba-Mono",
    description:
      "Monolingual Swahili text supporting continued pretraining and language modelling.",
    usedBy: ["Swahili-gemma-1B-it"],
  },
  {
    slug: "flores-plus",
    name: "FLORES+",
    kind: "Evaluation",
    languages: ["Swahili"],
    source: "Hugging Face",
    href: "https://huggingface.co/datasets/openlanguagedata/flores_plus",
    description:
      "A multilingual evaluation benchmark for measuring translation quality using standardised metrics.",
    used: "FLORES-200 devtest, 1,012 sentence pairs",
    usedBy: ["Swahili-gemma-1B-it", "Swahili-nllb-1.3B", "Swahili-nllb-600M"],
  },
  {
    slug: "luganda-llm-data",
    name: "Luganda LLM Data",
    kind: "Parallel",
    languages: ["Luganda"],
    domains: ["Agriculture", "Health", "Society"],
    source: "Kaggle",
    href: "https://www.kaggle.com/datasets/gracenoble/luganda-llm-data",
    description:
      "A prepared English–Luganda parallel corpus with training, validation, and test splits for translation model development.",
    used: "94,542 examples, split 90/5/5",
    usedBy: ["Luganda-gemma-1B-it"],
  },
];
