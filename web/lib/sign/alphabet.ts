import type { HandSpec, Keyframe } from "./types";

// The ASL manual alphabet and number handshapes, for words with no sign.
// Letters are made beside the chin, palm forward, with the hand drifting a
// little outward through a word.

// About two letters a second at 1x: slower than a fluent signer, so each
// letter can be read on an avatar.
const LETTER_DUR = 0.24;
const LETTER_HOLD = 0.2;
const DRIFT = 0.007;

type Letter = { shape: string; palm?: string; fingers?: string; path?: HandSpec[] };

const LETTERS: Record<string, Letter> = {
  A: { shape: "A" },
  B: { shape: "B" },
  C: { shape: "C", palm: "in-fwd" },
  D: { shape: "D", palm: "in-fwd" },
  E: { shape: "E" },
  F: { shape: "F", palm: "fwd-in" },
  G: { shape: "G", palm: "back", fingers: "in" },
  H: { shape: "H", palm: "back", fingers: "in" },
  I: { shape: "I" },
  // J: an I that hooks down and turns.
  J: {
    shape: "I",
    path: [
      { off: [0, -0.035, 0.01], palm: "fwd-in" },
      { off: [-0.025, -0.045, 0], palm: "back-in" },
    ],
  },
  K: { shape: "K", palm: "fwd-in" },
  L: { shape: "L" },
  M: { shape: "M" },
  N: { shape: "N" },
  O: { shape: "O", palm: "in-fwd" },
  P: { shape: "K", palm: "back-down", fingers: "fwd-down" },
  Q: { shape: "G", palm: "back", fingers: "down" },
  R: { shape: "R" },
  S: { shape: "S" },
  T: { shape: "T" },
  U: { shape: "U" },
  V: { shape: "V" },
  W: { shape: "W" },
  X: { shape: "X", palm: "fwd-in" },
  Y: { shape: "Y" },
  // Z: the index draws a Z.
  Z: {
    shape: "1",
    palm: "down-fwd",
    fingers: "fwd-up",
    path: [
      { off: [-0.035, 0.03, 0] },
      { off: [0.01, 0, 0] },
      { off: [-0.035, 0, 0] },
    ],
  },
  "0": { shape: "O", palm: "in-fwd" },
  "1": { shape: "1", palm: "back" },
  "2": { shape: "V", palm: "back" },
  "3": { shape: "3", palm: "back" },
  "4": { shape: "4", palm: "back" },
  "5": { shape: "5", palm: "back" },
  "6": { shape: "6" },
  "7": { shape: "7" },
  "8": { shape: "8" },
  "9": { shape: "9", palm: "fwd-in" },
};

export const canSpell = (ch: string) => ch.toUpperCase() in LETTERS;

/** Keyframes for one character of a fingerspelled word. */
export function spellFrames(ch: string, index: number, previous?: string): Keyframe[] {
  const letter = LETTERS[ch.toUpperCase()];
  if (!letter) return [];
  // A repeated letter slides outward so the two read as two.
  const slide = previous?.toUpperCase() === ch.toUpperCase() ? 0.03 : 0;
  const x = index * DRIFT + slide;
  const start: HandSpec = {
    shape: letter.shape,
    at: "spell",
    off: [x, 0, 0],
    contact: "wrist",
    palm: letter.palm ?? "fwd",
    fingers: letter.fingers ?? "up",
    elbow: [0.7, -1, -0.2],
  };
  const { path } = letter;
  if (!path) return [{ r: start, dur: LETTER_DUR, hold: LETTER_HOLD }];

  const last = path.length - 1;
  return [
    { r: start, dur: LETTER_DUR, hold: 0.04 },
    ...path.map((step, i): Keyframe => ({
      r: { ...step, off: [x + (step.off?.[0] ?? 0), step.off?.[1] ?? 0, step.off?.[2] ?? 0] },
      dur: 0.13,
      hold: i === last ? LETTER_HOLD : 0,
      flow: i < last,
    })),
  ];
}
