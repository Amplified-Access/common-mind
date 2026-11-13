// The signers a viewer can choose between. Each is drawn from the same body,
// with its own skin, hair, face and clothes. Clothes are plain and contrast
// with the skin, as an interpreter's would, so the hands read clearly.

export type HairStyle = "crop" | "bun" | "twists" | "puff";

export type Character = {
  id: string;
  name: string;
  /** One line under the name in the picker. */
  look: string;
  skin: string;
  lips: string;
  hair: { style: HairStyle; color: string };
  /** Jaw width, 1 broadest. */
  jaw: number;
  beard?: boolean;
  lashes?: boolean;
  fullLips?: boolean;
  earrings?: string;
  iris: string;
  shirt: string;
  trim: string;
};

export const CHARACTERS: Character[] = [
  {
    id: "amani",
    name: "Amani",
    look: "Short crop, beard",
    skin: "#5b3926",
    lips: "#43251a",
    hair: { style: "crop", color: "#141010" },
    jaw: 1,
    beard: true,
    iris: "#3a2214",
    shirt: "#1f3a3a",
    trim: "#ffd300",
  },
  {
    id: "nakato",
    name: "Nakato",
    look: "Braided bun",
    skin: "#7a4a2d",
    lips: "#5a2f22",
    hair: { style: "bun", color: "#1a1311" },
    jaw: 0.75,
    lashes: true,
    fullLips: true,
    earrings: "#e8c35a",
    iris: "#3b2416",
    shirt: "#26222f",
    trim: "#ffd300",
  },
  {
    id: "okello",
    name: "Okello",
    look: "Short twists",
    skin: "#3d2518",
    lips: "#2e1a12",
    hair: { style: "twists", color: "#0e0b0a" },
    jaw: 0.95,
    iris: "#2a180e",
    shirt: "#6f8291",
    trim: "#1b1a17",
  },
  {
    id: "achieng",
    name: "Achieng",
    look: "Afro puff",
    skin: "#9a633f",
    lips: "#6b3a2a",
    hair: { style: "puff", color: "#1c1410" },
    jaw: 0.7,
    lashes: true,
    fullLips: true,
    earrings: "#e8c35a",
    iris: "#4a2c18",
    shirt: "#1c1c21",
    trim: "#ffd300",
  },
];
