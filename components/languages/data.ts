export type Language = {
  code: string;
  name: string;
  /** Endonym, where commonly written. */
  endonym?: string;
  family: string;
  branch: string;
  script: string;
  regions: string[];
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
    tagline:
      "A Western Nilotic language of South Sudan with several major dialect clusters, carried largely through speech.",
    tags: ["Dinka"],
  },
];

export function getLanguage(code: string) {
  return languages.find((language) => language.code === code);
}
