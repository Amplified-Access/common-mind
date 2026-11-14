import { canSpell } from "./alphabet";
import { LEXICON, WH_GLOSSES } from "./lexicon";
import type { SignDef } from "./types";

// English text to a sequence of ASL signs: a gloss. This is a word-by-word
// rendering with a few of ASL's rules (no articles or "to be", wh-words
// last, question faces). Full translation into ASL grammar is a model's job.

/** A pause after an item: at a comma, or longer at the end of a sentence. */
export type Pause = "phrase" | "sentence";

export type PlanItem = (
  | { kind: "sign"; gloss: string; word: string; sign: SignDef }
  | { kind: "spell"; gloss: string; word: string; chars: string[] }
) & { pause?: Pause };

export type Mood = "statement" | "wh-question" | "yn-question";

export type Plan = { items: PlanItem[]; mood: Mood };

// Words ASL grammar has no sign for.
const DROPPED = new Set([
  "a", "an", "the", "is", "am", "are", "was", "were", "be", "been", "being",
  "to", "of", "do", "does", "did", "will", "would", "and",
]);

const WH_WORDS = new Set(["what", "where", "who", "why", "how", "when", "which"]);

const NUMBER_WORDS: Record<string, string> = {
  zero: "0", one: "1", two: "2", three: "3", four: "4", five: "5",
  six: "6", seven: "7", eight: "8", nine: "9", ten: "10",
};

const CONTRACTIONS: Record<string, string[]> = {
  "can't": ["can", "not"],
  "won't": ["not"],
  "don't": ["not"],
  "doesn't": ["not"],
  "didn't": ["not"],
  "isn't": ["not"],
  "aren't": ["not"],
  "let's": ["we"],
};

function expand(token: string): string[] {
  if (CONTRACTIONS[token]) return CONTRACTIONS[token];
  if (token.endsWith("n't")) return [token.slice(0, -3), "not"];
  // I'm, you're, it's, we'll, I've, she'd, Mary's: keep the first word.
  const m = token.match(/^(.+)'(m|re|s|ll|ve|d)$/);
  return [m ? m[1] : token.replace(/'/g, "")];
}

// Punctuation that ends a phrase or a sentence. A point or comma between
// digits belongs to the number.
const BREAK = /[;:!?]|[.,](?![0-9])|(?<![0-9])[.,]/;
const SENTENCE_END = new Set([".", "!", "?"]);

type Sentence = { words: string[][]; question: boolean };

/** The sentences of a text, each a list of phrases, each a list of words. */
function tokenize(text: string): Sentence[] {
  const tokens =
    text
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/[‘’]/g, "'")
      .match(new RegExp(`[a-z0-9]+(?:'[a-z]+)?|${BREAK.source}`, "g")) ?? [];

  const sentences: Sentence[] = [];
  let phrases: string[][] = [[]];
  const endSentence = (question: boolean) => {
    const words = phrases.filter((p) => p.length > 0);
    if (words.length > 0) sentences.push({ words, question });
    phrases = [[]];
  };
  for (const token of tokens) {
    if (SENTENCE_END.has(token)) endSentence(token === "?");
    else if (BREAK.test(token)) phrases.push([]);
    else phrases.at(-1)!.push(...expand(token));
  }
  endSentence(false);
  return sentences;
}

/** Endings to try removing when a word has no sign of its own. */
function stems(word: string): string[] {
  const out: string[] = [];
  const undouble = (s: string) => (/(.)\1$/.test(s) ? [s, s.slice(0, -1)] : [s]);
  if (word.endsWith("ies")) out.push(`${word.slice(0, -3)}y`);
  if (word.endsWith("es")) out.push(word.slice(0, -2));
  if (word.endsWith("s")) out.push(word.slice(0, -1));
  if (word.endsWith("ing")) {
    const base = word.slice(0, -3);
    out.push(...undouble(base), `${base}e`);
  }
  if (word.endsWith("ed")) {
    const base = word.slice(0, -2);
    out.push(...undouble(base), word.slice(0, -1));
  }
  return out.filter((s) => s.length > 1);
}

type Index = { words: Map<string, SignDef>; longest: number };

function indexLexicon(lexicon: SignDef[]): Index {
  const words = new Map<string, SignDef>();
  let longest = 1;
  for (const sign of lexicon) {
    for (const w of sign.words) {
      words.set(w, sign);
      longest = Math.max(longest, w.split(" ").length);
    }
  }
  return { words, longest };
}

const defaultIndex = indexLexicon(LEXICON);

function spell(word: string): PlanItem | null {
  const chars = word.toUpperCase().split("").filter(canSpell);
  if (chars.length === 0) return null;
  const gloss = /^\d+$/.test(word) ? `#${word}` : `fs-${chars.join("")}`;
  return { kind: "spell", gloss, word, chars };
}

/** One phrase's signs, matching the longest phrase that has a sign first. */
function planPhrase(tokens: string[], index: Index): PlanItem[] {
  const items: PlanItem[] = [];
  for (let i = 0; i < tokens.length; ) {
    let matched = false;
    for (let n = Math.min(index.longest, tokens.length - i); n >= 2; n--) {
      const phrase = tokens.slice(i, i + n).join(" ");
      const sign = index.words.get(phrase);
      if (sign) {
        items.push({ kind: "sign", gloss: sign.gloss, word: phrase, sign });
        i += n;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    const word = tokens[i++];
    if (DROPPED.has(word)) continue;
    const sign = index.words.get(word) ?? stems(word).map((s) => index.words.get(s)).find(Boolean);
    if (sign) {
      items.push({ kind: "sign", gloss: sign.gloss, word, sign });
      continue;
    }
    const spelled = spell(NUMBER_WORDS[word] ?? word);
    if (spelled) items.push({ ...spelled, word });
  }
  return items;
}

export function planSigns(text: string, lexicon?: SignDef[]): Plan {
  const index = lexicon ? indexLexicon(lexicon) : defaultIndex;
  const sentences = tokenize(text);
  const items: PlanItem[] = [];

  for (const { words, question } of sentences) {
    const signed: PlanItem[] = [];
    for (const phrase of words) {
      const planned = planPhrase(phrase, index);
      if (planned.length > 0) planned[planned.length - 1].pause = "phrase";
      signed.push(...planned);
    }
    if (signed.length === 0) continue;
    // ASL puts the question sign at the end: YOUR NAME WHAT?
    if (question && signed.length > 1 && WH_GLOSSES.has(signed[0].gloss)) {
      const wh = signed.shift()!;
      delete wh.pause;
      signed.push(wh);
    }
    signed[signed.length - 1].pause = "sentence";
    items.push(...signed);
  }

  const last = sentences.at(-1);
  const wh = !!last?.question && last.words.flat().some((t) => WH_WORDS.has(t));
  const mood: Mood = wh ? "wh-question" : last?.question ? "yn-question" : "statement";

  return { items, mood };
}
