// The languages CommonMind covers: what the site needs to place and match
// each one. Its details (endonym, family, branch, script, countries,
// tagline) are written in the Studio, one Language document each, and read
// with languageCopyFor (lib/content).
export type Language = {
  code: string;
  name: string;
  /** Where on the map it's marked: [latitude, longitude]. */
  location: [number, number];
  /** Codes used to match datasets and research. */
  tags: string[];
};

export const languages: Language[] = [
  {
    code: "lg",
    name: "Luganda",
    location: [0.35, 32.58],
    tags: ["Luganda"],
  },
  {
    code: "sw",
    name: "Swahili",
    location: [-6.8, 39.28],
    tags: ["Swahili"],
  },
  {
    code: "luo",
    name: "Luo",
    location: [-0.09, 34.77],
    tags: ["Luo"],
  },
  {
    code: "om",
    name: "Oromo",
    location: [8.54, 39.27],
    tags: ["Oromo"],
  },
  {
    code: "din",
    name: "Dinka",
    location: [6.21, 31.56],
    tags: ["Dinka"],
  },
  {
    code: "rw",
    name: "Kinyarwanda",
    location: [-1.95, 30.06],
    tags: ["Kinyarwanda"],
  },
  {
    code: "am",
    name: "Amharic",
    location: [11.59, 37.39],
    tags: ["Amharic"],
  },
  {
    code: "ki",
    name: "Kikuyu",
    location: [-0.42, 36.95],
    tags: ["Kikuyu"],
  },
  {
    code: "suk",
    name: "Sukuma",
    location: [-2.52, 32.9],
    tags: ["Sukuma"],
  },
  {
    code: "kdj",
    name: "Karimojong",
    location: [2.53, 34.66],
    tags: ["Karimojong"],
  },
];

export function getLanguage(code: string) {
  return languages.find((language) => language.code === code);
}
