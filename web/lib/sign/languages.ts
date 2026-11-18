import { ASL_ALPHABET, type ManualAlphabet } from "./alphabet";
import { LEXICON, WH_GLOSSES } from "./lexicon";
import type { SignDef } from "./types";

// The sign languages the avatar signs in. Each brings its own word signs, its
// manual alphabet for words with no sign, and the grammar rules the planner
// applies. A language can borrow signs from another for the words it has
// none for; the plan marks each borrowed sign.

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
  /** Where signs come from for words this language has no sign of its own for. */
  borrowsFrom?: SignLanguage;
};

export const ASL: SignLanguage = {
  id: "ase",
  abbr: "ASL",
  name: "American Sign Language",
  lexicon: LEXICON,
  alphabet: ASL_ALPHABET,
  finalWh: WH_GLOSSES,
};

// Kenyan and Uganda Sign Language, as research concepts. What each one
// approximates, for the research notes:
//
// - Signs: neither has signs of its own here yet. Every word signed is an
//   ASL sign, borrowed. KSL took in many ASL signs through Deaf education,
//   and its own signs differ in handshape and grammar besides. USL's
//   vocabulary is its own, recorded in UNAD's Uganda Sign Language
//   dictionary (2006).
// - Alphabet: both spell with the one-handed alphabet. KSL's is one-handed
//   and reported close to ASL's, with no letter-by-letter check yet. USL
//   uses a one-handed alphabet and, less often, a two-handed one from BSL,
//   which the signer does not make.
// - Grammar: wh-signs move to the end of a question as in ASL, untested
//   for either language.
//
// Sources for their own signs: AI4KSL (Maseno University, arXiv 2410.18295)
// transcribed 4,000 KSL words in HamNoSys, close to how signs are written
// here; its MediaPipe pose dataset is CC BY 4.0 behind an access request
// (Zenodo 14974973). For USL, UNAD and Deaf USL signers.

export const KSL: SignLanguage = {
  id: "xki",
  abbr: "KSL",
  name: "Kenyan Sign Language",
  lexicon: [],
  alphabet: ASL_ALPHABET,
  finalWh: WH_GLOSSES,
  borrowsFrom: ASL,
};

export const USL: SignLanguage = {
  id: "ugn",
  abbr: "USL",
  name: "Uganda Sign Language",
  lexicon: [],
  alphabet: ASL_ALPHABET,
  finalWh: WH_GLOSSES,
  borrowsFrom: ASL,
};

export const SIGN_LANGUAGES: readonly SignLanguage[] = [ASL, KSL, USL];
