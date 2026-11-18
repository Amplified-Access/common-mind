import { ASL_ALPHABET, type ManualAlphabet } from "./alphabet";
import { LEXICON, WH_GLOSSES } from "./lexicon";
import type { SignDef } from "./types";

// The sign languages the avatar signs in. Each brings its own word signs, its
// manual alphabet for words with no sign, and the grammar rules the planner
// applies.

export type SignLanguage = {
  /** ISO 639-3 code. */
  id: string;
  /** Short name, as Deaf signers write it: ASL, KSL, USL. */
  abbr: string;
  name: string;
  lexicon: readonly SignDef[];
  alphabet: ManualAlphabet;
  /** Question signs this language moves to the end of a wh-question. */
  finalWh: ReadonlySet<string>;
};

export const ASL: SignLanguage = {
  id: "ase",
  abbr: "ASL",
  name: "American Sign Language",
  lexicon: LEXICON,
  alphabet: ASL_ALPHABET,
  finalWh: WH_GLOSSES,
};

export const SIGN_LANGUAGES: readonly SignLanguage[] = [ASL];
