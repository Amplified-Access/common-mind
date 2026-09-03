export type Direction = {
  code: string;
  label: string;
  from: string;
  to: string;
};

export type Example = {
  source: string;
  translation: string;
};

export type PlaygroundModel = {
  slug: string;
  name: string;
  directions: Direction[];
  // Real, published example translations for this model — never a
  // translation generated for arbitrary user input, since there's no live
  // model connected yet. Keyed by direction code.
  examples: Record<string, Example[]>;
};

export const playgroundModels: PlaygroundModel[] = [
  {
    slug: "luganda-gemma-1b-it",
    name: "Luganda-gemma-1B-it",
    directions: [
      { code: "en-lg", label: "English → Luganda", from: "English", to: "Luganda" },
      { code: "lg-en", label: "Luganda → English", from: "Luganda", to: "English" },
    ],
    examples: {
      "en-lg": [
        {
          source: "Five prisoners were released yesterday.",
          translation: "Abasibe bataano baateereddwa ku kkomera jjo.",
        },
        {
          source: "The professor is the presidential advisor.",
          translation: "Omusomesa ye munnamateeka wa pulezidenti.",
        },
        {
          source: "My father inspired me to become a surgeon.",
          translation: "Taata wange yamukubiriza okufuuka omusawo.",
        },
      ],
      "lg-en": [],
    },
  },
  {
    slug: "swahili-gemma-1b-it",
    name: "Swahili-gemma-1B-it",
    directions: [
      { code: "en-sw", label: "English → Swahili", from: "English", to: "Swahili" },
    ],
    examples: {
      "en-sw": [
        {
          source: "The children are playing outside.",
          translation: "Watoto wanacheza nje.",
        },
        {
          source: "I would like a cup of coffee, please.",
          translation: "Ningependa kikombe cha kahawa tafadhali.",
        },
        {
          source:
            "The government announced new policies to support small businesses across the country.",
          translation: "Serikali ilitangaza sera mpya kusaidia biashara ndogo nchi nzima.",
        },
      ],
    },
  },
  {
    slug: "swahili-nllb-1-3b",
    name: "Swahili-nllb-1.3B",
    directions: [
      { code: "en-sw", label: "English → Swahili", from: "English", to: "Swahili" },
    ],
    examples: { "en-sw": [] },
  },
  {
    slug: "swahili-nllb-600m",
    name: "Swahili-nllb-600M",
    directions: [
      { code: "en-sw", label: "English → Swahili", from: "English", to: "Swahili" },
    ],
    examples: { "en-sw": [] },
  },
];
