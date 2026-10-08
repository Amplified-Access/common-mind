export type Language = {
  code: string;
  name: string;
  /** Endonym, where commonly written. */
  endonym?: string;
  family: string;
  branch: string;
  script: string;
  regions: string[];
  /** Where on the map it's marked: [latitude, longitude]. */
  location: [number, number];
  tagline: string;
  /** Codes used to match datasets and research. */
  tags: string[];
};

export const languages: Language[] = [
  {
    code: "lg",
    name: "Luganda",
    endonym: "Oluganda",
    family: "Niger-Congo",
    branch: "Bantu",
    script: "Latin",
    regions: ["Uganda"],
    location: [0.35, 32.58],
    tagline:
      "Spoken by over 5 million people in Uganda, central to Buganda's culture and one of Uganda's most widely used local languages.",
    tags: ["Luganda"],
  },
  {
    code: "sw",
    name: "Swahili",
    endonym: "Kiswahili",
    family: "Niger-Congo",
    branch: "Bantu",
    script: "Latin",
    regions: ["Kenya", "Tanzania", "Uganda", "DR Congo"],
    location: [-6.8, 39.28],
    tagline:
      "A lingua franca for over 200 million people across East Africa, spanning Kenya, Tanzania, Uganda, and beyond.",
    tags: ["Swahili"],
  },
  {
    code: "luo",
    name: "Luo",
    endonym: "Dholuo",
    family: "Nilo-Saharan",
    branch: "Western Nilotic",
    script: "Latin",
    regions: ["Kenya", "Tanzania"],
    location: [-0.09, 34.77],
    tagline:
      "A Western Nilotic language of the Lake Victoria basin, used daily in local government, markets, and radio across western Kenya.",
    tags: ["Luo"],
  },
  {
    code: "om",
    name: "Oromo",
    endonym: "Afaan Oromoo",
    family: "Afroasiatic",
    branch: "Cushitic",
    script: "Latin (Qubee)",
    regions: ["Ethiopia", "Kenya"],
    location: [8.54, 39.27],
    tagline:
      "One of the most widely spoken Cushitic languages, written in the Latin-based Qubee script and used across public administration in Oromia.",
    tags: ["Oromo"],
  },
  {
    code: "din",
    name: "Dinka",
    endonym: "Thuɔŋjäŋ",
    family: "Nilo-Saharan",
    branch: "Western Nilotic",
    script: "Latin",
    regions: ["South Sudan"],
    location: [6.21, 31.56],
    tagline:
      "A Western Nilotic language of South Sudan with several major dialect clusters, carried largely through speech.",
    tags: ["Dinka"],
  },
  {
    code: "rw",
    name: "Kinyarwanda",
    endonym: "Ikinyarwanda",
    family: "Niger-Congo",
    branch: "Bantu",
    script: "Latin",
    regions: ["Rwanda"],
    location: [-1.95, 30.06],
    tagline:
      "The national language of Rwanda, used across government, media, and education, and closely related to Kirundi across the Great Lakes.",
    tags: ["Kinyarwanda"],
  },
];

export function getLanguage(code: string) {
  return languages.find((language) => language.code === code);
}
