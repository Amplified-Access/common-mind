// Mouthing: signers often shape the English word on their lips as they sign
// it, which helps a viewer who lip-reads. Words are read into visemes, the
// mouth shapes of speech (the Oculus set the avatars carry), by English
// spelling rules. It is approximate, as mouthing is.

export type Viseme = "PP" | "FF" | "TH" | "DD" | "kk" | "CH" | "SS" | "nn" | "RR" | "aa" | "E" | "I" | "O" | "U";

export const VISEMES: readonly Viseme[] = ["PP", "FF", "TH", "DD", "kk", "CH", "SS", "nn", "RR", "aa", "E", "I", "O", "U"];

export const isVowel = (v: Viseme) => v === "aa" || v === "E" || v === "I" || v === "O" || v === "U";

// Spellings of more than one letter, longest first. An empty list is silent.
const GROUPS: [string, Viseme[]][] = [
  ["tch", ["CH"]],
  ["igh", ["aa"]],
  ["th", ["TH"]],
  ["sh", ["CH"]],
  ["ch", ["CH"]],
  ["ph", ["FF"]],
  ["ck", ["kk"]],
  ["ng", ["nn"]],
  ["qu", ["kk", "U"]],
  ["wh", ["U"]],
  ["wr", ["RR"]],
  ["kn", ["nn"]],
  ["gh", []],
  ["oo", ["U"]],
  ["ou", ["U"]],
  ["ow", ["O"]],
  ["ee", ["I"]],
  ["ea", ["I"]],
  ["ai", ["E"]],
  ["ay", ["E"]],
  ["ei", ["E"]],
  ["ey", ["E"]],
  ["oa", ["O"]],
  ["oe", ["O"]],
  ["au", ["O"]],
  ["aw", ["O"]],
  ["er", ["RR"]],
  ["ir", ["RR"]],
  ["ur", ["RR"]],
];

const LETTERS: Record<string, Viseme[]> = {
  a: ["aa"], e: ["E"], i: ["I"], o: ["O"], u: ["U"],
  b: ["PP"], m: ["PP"], p: ["PP"],
  f: ["FF"], v: ["FF"],
  d: ["DD"], t: ["DD"], l: ["DD"],
  n: ["nn"],
  k: ["kk"], g: ["kk"], q: ["kk"], c: ["kk"], x: ["kk", "SS"],
  s: ["SS"], z: ["SS"],
  j: ["CH"],
  r: ["RR"],
  w: ["U"],
  y: ["I"],
  h: [],
};

// A vowel made long by a silent final e: name, time, home, tune, these.
const LONG: Record<string, Viseme> = { a: "E", e: "I", i: "aa", o: "O", u: "U" };

const DIGITS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];

const vowel = (ch: string | undefined) => !!ch && "aeiou".includes(ch);

/** The visemes for a word, in order, with repeats run together. */
export function visemesFor(input: string): Viseme[] {
  let word = input.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (/^\d+$/.test(word)) return [...word].flatMap((d) => visemesFor(DIGITS[Number(d)]));
  word = word.replace(/\d/g, "");

  // A final e after a consonant is silent in longer words (name, grace);
  // in short ones it is the vowel (me, he, she).
  let long: number | null = null;
  if (word.length > 3 && word.endsWith("e") && !vowel(word.at(-2))) {
    word = word.slice(0, -1);
    const v = word.length - 2;
    if (vowel(word[v]) && !vowel(word[v - 1])) long = v;
  } else if (word.length <= 3 && /^[^aeiou]+e$/.test(word)) {
    word = `${word.slice(0, -1)}ee`;
  }

  const out: Viseme[] = [];
  for (let i = 0; i < word.length; ) {
    const group = GROUPS.find(([spelling]) => word.startsWith(spelling, i));
    if (group) {
      out.push(...group[1]);
      i += group[0].length;
      continue;
    }
    const ch = word[i];
    if (i === long) out.push(LONG[ch]);
    // A soft c before e, i or y: grace, city.
    else if (ch === "c" && "eiy".includes(word[i + 1] ?? "")) out.push("SS");
    // A y before a vowel is a glide (you, yes); elsewhere a vowel (my, any).
    else if (ch === "y" && i > 0 && !vowel(word[i + 1])) out.push("I");
    else out.push(...(LETTERS[ch] ?? []));
    i += 1;
  }
  return out.filter((v, i) => v !== out[i - 1]);
}
