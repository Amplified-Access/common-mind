export type PublicationSection = {
  heading: string;
  paragraphs: string[];
};

export type ResultRow = {
  label: string;
  before?: string;
  after: string;
};

export type Publication = {
  slug: string;
  title: string;
  dek: string;
  date: string;
  tags: string[];
  sections: PublicationSection[];
  results?: {
    caption: string;
    rows: ResultRow[];
  };
  sources: { label: string; href: string }[];
};

export function readTimeForPublication(publication: Publication) {
  const words = [
    publication.title,
    publication.dek,
    ...publication.sections.flatMap((section) => [
      section.heading,
      ...section.paragraphs,
    ]),
  ].join(" ").split(/\s+/).filter(Boolean).length;

  return Math.max(1, Math.round(words / 200));
}

export const publications: Publication[] = [
  {
    slug: "luganda-gemma-qlora",
    title: "Fine-tuning Gemma 3 1B for Luganda: from 0.06 to 13.85 BLEU",
    dek: "QLoRA on a single T4 GPU turns a model with essentially no working Luganda into a functional bidirectional translator, using data derived almost entirely from one source.",
    date: "2026-05-23",
    tags: ["Luganda", "QLoRA", "Low-resource NLP"],
    sections: [
      {
        heading: "The problem",
        paragraphs: [
          "Gemma 3 1B Instruct, like most general-purpose small LLMs, has almost no working knowledge of Luganda out of the box: 0.06 BLEU and 8.84 chrF++ on our English→Luganda eval, indistinguishable from random output. Luganda has roughly 5+ million speakers in Uganda, but the training data mainstream LLMs see for it is vanishingly small compared to English, French, or Swahili.",
          "The question was whether a single consumer-GPU fine-tuning run could close meaningful ground here, given that the largest clean parallel corpus we could find was a fraction of the size typically used for high-resource language pairs.",
        ],
      },
      {
        heading: "Data",
        paragraphs: [
          "We built 94,542 training examples from roughly 24,000 clean English–Luganda parallel sentence pairs, drawn primarily from the Sunbird SALT dataset, a professionally translated, multi-way parallel corpus covering agriculture, health, society, and other locally relevant topics. Each pair was expanded into three task types: English→Luganda translation, Luganda→English translation, and open Luganda conversation, then split 90/5/5 into train/validation/test.",
        ],
      },
      {
        heading: "Method",
        paragraphs: [
          "QLoRA: a 4-bit NF4-quantized base model with LoRA adapters (rank 16, alpha 32, dropout 0.05) on the attention and MLP projections, trained for a single epoch with an effective batch size of 16, cosine learning rate schedule at 2e-4, and bf16 precision on a single Kaggle T4. The whole run (5,500+ steps) took about 8 hours and produced a 13.05M-parameter adapter, roughly 52 MB on disk.",
          "Training and validation loss tracked each other closely throughout (2.07/2.01 at step 500 down to 1.24/1.26 by step 5000), with no sign of overfitting by the time training stopped.",
        ],
      },
      {
        heading: "What we'd try next",
        paragraphs: [
          "The model was trained for a single epoch on data covering agriculture, health, and society topics; both loss curves were still trending down when training stopped. Further epochs and additional sources (JW300, the Kimera corpus) would likely push scores higher, and Luganda→English quality specifically has room to close the gap with the reverse direction, since the base model's English fluency doesn't carry over as directly.",
        ],
      },
    ],
    results: {
      caption: "English↔Luganda, held-out test split (100 examples)",
      rows: [
        { label: "BLEU", before: "0.06", after: "13.85" },
        { label: "chrF++", before: "8.84", after: "46.59" },
      ],
    },
    sources: [
      { label: "Luganda-gemma-1B-it model card", href: "/models/luganda-gemma-1b-it" },
      {
        label: "Sunbird SALT dataset",
        href: "https://huggingface.co/datasets/Sunbird/salt",
      },
      {
        label: "Training data (Kaggle)",
        href: "https://www.kaggle.com/datasets/gracenoble/luganda-llm-data",
      },
    ],
  },
  {
    slug: "swahili-gemma-cpt-sft",
    title: "Continued pretraining before translation: the Swahili-Gemma-1B recipe",
    dek: "Swahili isn't as underrepresented as Luganda, but a two-stage pipeline (teach the model to read Swahili first, then teach it to translate) still meaningfully outperformed going straight to instruction tuning.",
    date: "2026-08-11",
    tags: ["Swahili", "Continued pretraining", "Instruction tuning"],
    sections: [
      {
        heading: "Two stages",
        paragraphs: [
          "We split the work in two. Stage 1 continues pretraining the base model on unlabeled Swahili text (JamiiForums-2B, a large monolingual Swahili forum corpus, and Inkuba-Mono, a Swahili monolingual dataset) with no instruction format at all, just raw next-token prediction. That produces an intermediate checkpoint that reads Swahili more fluently before it ever sees a translation pair.",
          "Stage 2 is where translation ability is actually taught: QLoRA fine-tuning (rank 32, alpha 64, dropout 0.05) on top of the CPT checkpoint, for 3 epochs at a 2e-4 cosine schedule, effective batch size 32, packed to 512-token blocks. The adapter was then merged into full fp16 weights, the form the released model ships in.",
        ],
      },
      {
        heading: "Data",
        paragraphs: [
          "159,311 examples after quality filtering: 32,414 from MAFAND-MT (human-translated news, via Masakhane), 58,052 from Rogendo's English-Swahili sentence pairs, 23,947 from Sunbird SALT, 29,991 from Inkuba-Swahili-MMT, plus smaller instruction-following sets (359 from Cohere's Aya dataset and 14,844 from Alpaca-cleaned-Swahili) so the model picks up general Swahili instruction-following alongside translation. That's 25,452 packed training blocks, roughly 13 million training tokens, over 2,388 steps and about 9 hours 45 minutes on a single T4.",
          "One thing that didn't work: we planned to add back-translated monolingual Swahili (via NLLB) to the mix, but the monolingual source returned zero usable lines in this run; that augmentation simply didn't contribute to the released model, and we're noting it here.",
        ],
      },
    ],
    results: {
      caption: "English→Swahili, FLORES-200 devtest",
      rows: [
        { label: "BLEU", before: "0.41", after: "28.86" },
        { label: "chrF++", before: "14.28", after: "54.77" },
      ],
    },
    sources: [
      { label: "Swahili-gemma-1B-it model card", href: "/models/swahili-gemma-1b-it" },
      { label: "Full benchmark comparison", href: "/benchmarks" },
      {
        label: "JamiiForums-2B",
        href: "https://huggingface.co/datasets/AlexLeoTz/jamiiforums-2b",
      },
    ],
  },
  {
    slug: "nllb-lora-vs-chat-llms",
    title: "Purpose-built beats general-purpose: NLLB LoRA vs. instruction-tuned LLMs for Swahili",
    dek: "A small LoRA adapter on Meta's translation-specific NLLB-200 outscored every instruction-tuned chat model we compared it against on the same benchmark, including some many times its size.",
    date: "2026-09-03",
    tags: ["Swahili", "NLLB", "Model architecture"],
    sections: [
      {
        heading: "Why try a non-chat architecture",
        paragraphs: [
          "Every other CommonMind model so far has been a fine-tuned instruction-tuned LLM (Gemma 3). NLLB-200 is a different kind of model entirely: an encoder-decoder architecture with a SentencePiece tokenizer, built by Meta specifically for translation across 200 languages, with no chat template and no general-purpose reasoning ability to spare. The question: does specializing the architecture, on top of the training data, buy anything on top of what instruction-tuned LLMs already achieve?",
        ],
      },
      {
        heading: "Method",
        paragraphs: [
          "LoRA (rank 16, alpha 32) on facebook/nllb-200-distilled-1.3B and facebook/nllb-200-distilled-600M, trained one direction only, English→Swahili (eng_Latn→swh_Latn), on 145,707 parallel pairs: all of MAFAND-MT (32,414) and Sunbird SALT (23,947), plus Rogendo capped at 60,000 and Inkuba-Swahili-MMT capped at 30,000. 3 epochs, 3e-5 learning rate, effective batch size 32, max sequence length 128, on a single Kaggle T4, about 13,662 steps per model.",
          "One honest wrinkle: raw training loss for both runs plateaued far higher (roughly 10–12) than the causal-LM losses we typically see finishing around 1.2–1.5 on our Gemma fine-tunes. That reflects a different loss landscape: NLLB's ~256K-token vocabulary changes what the raw cross-entropy number means, which is why we evaluate held-out translation quality directly.",
        ],
      },
      {
        heading: "How it stacks up",
        paragraphs: [
          "Scored on the same FLORES-200 devtest split (1,012 sentence pairs) used across our Swahili benchmarks, the 1.3B NLLB adapter reached 38.74 BLEU / 63.37 chrF++, and the 600M variant reached 35.97 / 61.26. Both beat Crane AI Labs' Swahili-Gemma-1B (27.6 / 56.8), Gemma 3 27B (29.4 / 60.0), and GPT-5 Mini (31.8 / 62.4) on the same benchmark, and the 1.3B model edges past Gemini 2.0 Flash (35.6 BLEU) too. The full comparison, with every source linked, is on the benchmarks page.",
          "Neither model was trained or evaluated on the reverse direction (Swahili→English); that's untested and not claimed.",
        ],
      },
    ],
    results: {
      caption: "English→Swahili, FLORES-200 devtest (1,012 pairs)",
      rows: [
        { label: "Swahili-nllb-1.3B", after: "38.74 BLEU / 63.37 chrF++" },
        { label: "Swahili-nllb-600M", after: "35.97 BLEU / 61.26 chrF++" },
        { label: "CraneAILabs Swahili-Gemma-1B (reference)", after: "27.6 BLEU / 56.8 chrF++" },
      ],
    },
    sources: [
      { label: "Swahili-nllb-1.3B model card", href: "/models/swahili-nllb-1-3b" },
      { label: "Swahili-nllb-600M model card", href: "/models/swahili-nllb-600m" },
      { label: "Full benchmark comparison", href: "/benchmarks" },
      {
        label: "NLLB-200 (Meta AI)",
        href: "https://ai.meta.com/research/no-language-left-behind/",
      },
    ],
  },
];

export type Release = {
  date: string;
  title: string;
  description: string;
  href: string;
};

export const releases: Release[] = [
  {
    date: "2026-09-03",
    title: "Swahili-nllb-1.3B and Swahili-nllb-600M",
    description:
      "Two LoRA-tuned NLLB-200 models for English→Swahili translation, both beating our previous Swahili-Gemma benchmark reference.",
    href: "/models/swahili-nllb-1-3b",
  },
  {
    date: "2026-08-11",
    title: "Swahili-gemma-1B-it",
    description:
      "Continued-pretrained and instruction-tuned Gemma 3 1B for English→Swahili translation and general Swahili instruction-following.",
    href: "/models/swahili-gemma-1b-it",
  },
  {
    date: "2026-05-23",
    title: "Luganda-gemma-1B-it",
    description:
      "Our first release: a QLoRA adapter for bidirectional English↔Luganda translation and Luganda conversation.",
    href: "/models/luganda-gemma-1b-it",
  },
];
