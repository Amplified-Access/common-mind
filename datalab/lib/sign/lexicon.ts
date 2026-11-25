import type { HandSpec, Keyframe, SignDef, Vec3 } from "./types";

// Word signs in American Sign Language, written by hand from their citation
// forms. Each is an approximation for the avatar to show, to be checked and
// corrected by Deaf signers. Words with no sign here are fingerspelled.
//
// Hands are written in their own mirrored frame (see types.ts): for the
// dominant hand to reach a point on the non-dominant hand, flip the sign of x.

const sign = (
  gloss: string,
  words: string[],
  frames: Keyframe[],
  extra: Partial<SignDef> = {},
): SignDef => ({ gloss, words, frames, ...extra });

/** Offsets around a circle, in the plane given ("front" faces the viewer). */
function circle(radius: number, plane: "front" | "side" | "flat", steps = 6, turns = 1): Vec3[] {
  const points: Vec3[] = [];
  for (let i = 1; i <= steps * turns; i++) {
    const a = (i / steps) * Math.PI * 2;
    const u = Math.sin(a) * radius;
    const v = (Math.cos(a) - 1) * radius;
    if (plane === "front") points.push([u, v, 0]);
    else if (plane === "side") points.push([0, v, u]);
    else points.push([u, 0, v]);
  }
  return points;
}

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

/** Circles a hand around its starting offset, passing smoothly through. */
const circling = (start: Vec3, path: Vec3[], dur = 0.11): Keyframe[] =>
  path.map((p) => ({ r: { off: add(start, p) }, dur, hold: 0, flow: true }));

/** Repeats a pair of frames: a tap, a nod, a bend. */
const repeat = (frames: Keyframe[], times: number): Keyframe[] =>
  Array.from({ length: times }, () => frames).flat();

// The non-dominant hand as a flat base, palm up, in front of the waist.
const BASE_PALM_UP: HandSpec = {
  shape: "B",
  at: [0.03, 0.26, 0.28],
  contact: "palm",
  palm: "up",
  fingers: "fwd-in",
};
// The same point, seen from the dominant hand, just above the palm.
const ON_BASE: Vec3 = [-0.03, 0.27, 0.28];

// The non-dominant forearm held across the body, palm down.
const ARM_ACROSS: HandSpec = {
  shape: "B",
  at: [-0.02, 0.27, 0.3],
  contact: "tips",
  palm: "down",
  fingers: "in",
};

// The non-dominant fist, palm down, as a surface to tap.
const BASE_FIST: HandSpec = {
  shape: "S",
  at: [0.03, 0.27, 0.29],
  contact: "back",
  palm: "down",
  fingers: "fwd-in",
};

export const LEXICON: SignDef[] = [
  // Greetings and courtesy
  sign("HELLO", ["hello", "hi", "hey"], [
    { r: { shape: "B", at: "forehead", off: [0.045, 0.005, 0.012], contact: "index", palm: "fwd-out", fingers: "up-in" }, dur: 0.38, hold: 0.1, mouth: "smile" },
    { r: { off: [0.2, 0, 0.16], palm: "fwd", fingers: "up-out" }, dur: 0.4, hold: 0.12, mouth: "smile" },
  ]),
  sign("GOODBYE", ["goodbye", "bye"], [
    { r: { shape: "B", at: "space-high", off: [0.06, 0.02, 0], contact: "wrist", palm: "fwd", fingers: "up" }, dur: 0.35, hold: 0.04, mouth: "smile" },
    ...repeat([
      { r: { shape: "bent-B" }, dur: 0.15, hold: 0 },
      { r: { shape: "B" }, dur: 0.15, hold: 0 },
    ], 2),
  ]),
  sign("THANK-YOU", ["thank you", "thanks", "thank", "thx", "thank u"], [
    { r: { shape: "B", at: "chin", off: [0, 0.005, 0.008], contact: "tips", palm: "back", fingers: "up" }, dur: 0.34, hold: 0.1, mouth: "smile" },
    { r: { off: [0.03, -0.13, 0.2], palm: "up-back", fingers: "fwd-up" }, dur: 0.42, hold: 0.15, mouth: "smile" },
  ]),
  sign("PLEASE", ["please", "pls", "plz"], [
    { r: { shape: "B", at: "chest", off: [0.02, 0, 0], contact: "palm", palm: "back", fingers: "up-in" }, dur: 0.34, hold: 0 },
    ...circling([0.02, 0, 0], circle(0.035, "front")),
  ]),
  sign("SORRY", ["sorry", "apologize"], [
    { r: { shape: "A", at: "chest", off: [0.02, 0, 0], contact: "palm", palm: "back", fingers: "up-in" }, dur: 0.34, hold: 0, brows: 0.3 },
    ...circling([0.02, 0, 0], circle(0.035, "front")),
  ]),
  sign("WELCOME", ["welcome", "you welcome"], [
    { r: { shape: "B", at: "space-side", contact: "palm", palm: "up", fingers: "fwd-out" }, dur: 0.36, hold: 0.06, mouth: "smile" },
    { r: { at: "stomach", off: [0.03, 0.05, 0.12], fingers: "fwd-in" }, dur: 0.4, hold: 0.12, mouth: "smile" },
  ]),
  sign("I-LOVE-YOU", ["i love you"], [
    { r: { shape: "ILY", at: "space-high", off: [0.04, 0, 0], contact: "wrist", palm: "fwd", fingers: "up" }, dur: 0.4, hold: 0.5, mouth: "smile" },
  ]),

  // Answers
  sign("YES", ["yes", "yeah", "yep", "yup"], [
    ...repeat([
      { r: { shape: "S", at: "space", off: [0.03, 0.12, 0], contact: "wrist", palm: "fwd", fingers: "up" }, dur: 0.2, hold: 0.02, head: { nod: 0 } },
      { r: { palm: "down-fwd", fingers: "fwd-up" }, dur: 0.16, hold: 0.02, head: { nod: 0.16 } },
    ], 2),
  ]),
  sign("NO", ["no", "nope"], [
    ...repeat([
      { r: { shape: "no-open", at: "space", off: [0.04, 0.14, 0], contact: "wrist", palm: "down-fwd", fingers: "fwd-up" }, dur: 0.18, hold: 0.02 },
      { r: { shape: "no-closed" }, dur: 0.14, hold: 0.04 },
    ], 2),
  ], { negates: true }),
  sign("NOT", ["not", "don't", "doesn't", "didn't", "isn't", "aren't"], [
    { r: { shape: "A-thumb", at: "chin", off: [0, -0.012, 0.004], contact: "thumb", palm: "in", fingers: "fwd" }, dur: 0.34, hold: 0.06 },
    { r: { off: [0.02, -0.04, 0.15] }, dur: 0.24, hold: 0.12 },
  ], { negates: true }),
  sign("FINE", ["fine", "ok", "okay", "alright", "all right"], [
    ...repeat([
      { r: { shape: "5", at: "chest", off: [0, 0, 0.04], contact: "thumb", palm: "in", fingers: "up" }, dur: 0.22, hold: 0 },
      { r: { off: [0, 0, 0] }, dur: 0.12, hold: 0.04 },
    ], 2),
  ]),
  sign("GOOD", ["good", "well"], [
    { r: { shape: "B", at: "chin", contact: "tips", palm: "back", fingers: "up" }, l: BASE_PALM_UP, dur: 0.36, hold: 0.08 },
    { r: { at: add(ON_BASE, [0, -0.008, 0]), contact: "back", palm: "up", fingers: "fwd" }, dur: 0.38, hold: 0.14 },
  ]),
  sign("BAD", ["bad"], [
    { r: { shape: "B", at: "chin", contact: "tips", palm: "back", fingers: "up" }, dur: 0.34, hold: 0.06, brows: -0.4 },
    { r: { off: [0.03, -0.15, 0.17], palm: "down", fingers: "fwd" }, dur: 0.3, hold: 0.12, brows: -0.4, mouth: "pursed" },
  ]),

  // People
  sign("ME", ["i", "me", "myself"], [
    { r: { shape: "1", at: "chest", off: [0.01, 0, 0.06], contact: "index", palm: "in", fingers: "back" }, dur: 0.3, hold: 0 },
    { r: { off: [0.01, 0, 0] }, dur: 0.14, hold: 0.12 },
  ]),
  sign("MY", ["my", "mine"], [
    { r: { shape: "B", at: "chest", off: [0.02, 0, 0.06], contact: "palm", palm: "back", fingers: "up-in" }, dur: 0.3, hold: 0 },
    { r: { off: [0.02, 0, 0] }, dur: 0.14, hold: 0.12 },
  ]),
  sign("YOU", ["you", "u", "yourself"], [
    { r: { shape: "1", at: "space", off: [0.02, 0.05, 0], contact: "index", palm: "down", fingers: "fwd" }, dur: 0.3, hold: 0 },
    { r: { off: [0.02, 0.05, 0.1] }, dur: 0.16, hold: 0.12 },
  ]),
  sign("YOUR", ["your", "yours"], [
    { r: { shape: "B", at: "space", off: [0.02, 0.05, 0], contact: "palm", palm: "fwd", fingers: "up" }, dur: 0.3, hold: 0 },
    { r: { off: [0.02, 0.05, 0.1] }, dur: 0.16, hold: 0.12 },
  ]),
  sign("WE", ["we", "us", "our", "ours", "ourselves"], [
    { r: { shape: "1", at: "chest-side", contact: "index", palm: "in", fingers: "back" }, dur: 0.3, hold: 0.04 },
    { r: { at: [-0.075, 0.41, 0.118] }, dur: 0.32, hold: 0.1 },
  ]),
  sign("IX", ["he", "she", "him", "her", "they", "them", "it", "there", "that", "this", "these", "those"], [
    { r: { shape: "1", at: "space-side", off: [0, 0.04, 0.02], contact: "index", palm: "down", fingers: "fwd-out" }, dur: 0.3, hold: 0.14 },
  ]),
  sign("FRIEND", ["friend", "buddy", "pal"], [
    { r: { shape: "X", at: [-0.005, 0.36, 0.3], contact: "index", palm: "down", fingers: "in" }, l: { shape: "X", at: [0.005, 0.34, 0.3], contact: "index", palm: "up", fingers: "in" }, dur: 0.38, hold: 0.08 },
    { r: { at: [0.005, 0.34, 0.3], palm: "up" }, l: { at: [-0.005, 0.36, 0.3], palm: "down" }, dur: 0.34, hold: 0.1 },
  ]),
  sign("FAMILY", ["family"], [
    { r: { shape: "F", at: [0.015, 0.33, 0.32], contact: "index", palm: "fwd", fingers: "up" }, l: { shape: "F", at: [0.015, 0.33, 0.32], contact: "index", palm: "fwd", fingers: "up" }, dur: 0.38, hold: 0.04 },
    { r: { at: [0.14, 0.33, 0.25], palm: "fwd-in" }, l: { at: [0.14, 0.33, 0.25], palm: "fwd-in" }, dur: 0.24, hold: 0, flow: true },
    { r: { at: [0.02, 0.33, 0.18], contact: "pinky", palm: "back" }, l: { at: [0.02, 0.33, 0.18], contact: "pinky", palm: "back" }, dur: 0.24, hold: 0.1 },
  ]),
  sign("MOTHER", ["mother", "mom", "mum", "mommy", "mummy", "mama"], [
    ...repeat([
      { r: { shape: "5", at: "chin", off: [0, 0, 0.04], contact: "thumb", palm: "in", fingers: "up" }, dur: 0.24, hold: 0 },
      { r: { off: [0, 0, 0] }, dur: 0.12, hold: 0.04 },
    ], 2),
  ]),
  sign("FATHER", ["father", "dad", "daddy", "papa"], [
    ...repeat([
      { r: { shape: "5", at: "forehead", off: [0, 0, 0.04], contact: "thumb", palm: "in", fingers: "up" }, dur: 0.24, hold: 0 },
      { r: { off: [0, 0, 0] }, dur: 0.12, hold: 0.04 },
    ], 2),
  ]),
  sign("GIRL", ["girl"], [
    { r: { shape: "A-thumb", at: "jaw", off: [0, 0.015, 0], contact: "thumb", palm: "in", fingers: "fwd" }, dur: 0.32, hold: 0 },
    { r: { off: [-0.01, -0.02, 0.02] }, dur: 0.2, hold: 0.1 },
  ]),
  sign("BOY", ["boy"], [
    { r: { shape: "C", at: "forehead", off: [0.04, 0, 0.02], contact: "thumb", palm: "down", fingers: "fwd" }, dur: 0.32, hold: 0 },
    ...repeat([
      { r: { shape: "flat-O" }, dur: 0.14, hold: 0 },
      { r: { shape: "C" }, dur: 0.14, hold: 0 },
    ], 2),
  ]),
  sign("DEAF", ["deaf"], [
    { r: { shape: "1", at: "cheek", off: [0.025, 0.015, 0], contact: "index", palm: "fwd", fingers: "up-in" }, dur: 0.34, hold: 0.06 },
    { r: { at: "mouth", off: [0.035, -0.01, 0] }, dur: 0.24, hold: 0.1 },
  ]),
  sign("HEARING", ["hearing"], [
    { r: { shape: "1", at: "mouth", off: [0, 0, 0.03], contact: "index", palm: "down", fingers: "in" }, dur: 0.32, hold: 0 },
    ...circling([0, 0, 0.03], circle(0.02, "side", 5, 2), 0.09),
  ]),

  // Questions
  sign("WHAT", ["what"], [
    { r: { shape: "5", at: "space", off: [0.1, -0.02, 0], contact: "palm", palm: "up", fingers: "fwd-out" }, l: { shape: "5", at: "space", off: [0.1, -0.02, 0], contact: "palm", palm: "up", fingers: "fwd-out" }, dur: 0.38, hold: 0, brows: -0.8 },
    ...repeat([
      { r: { off: [0.13, -0.02, 0] }, l: { off: [0.13, -0.02, 0] }, dur: 0.12, hold: 0, flow: true, brows: -0.8 },
      { r: { off: [0.09, -0.02, 0] }, l: { off: [0.09, -0.02, 0] }, dur: 0.12, hold: 0, flow: true, brows: -0.8 },
    ], 2),
  ]),
  sign("WHERE", ["where"], [
    { r: { shape: "1", at: "space-high", off: [0.04, 0, 0], contact: "wrist", palm: "fwd", fingers: "up" }, dur: 0.34, hold: 0, brows: -0.8 },
    ...repeat([
      { r: { fingers: "up-up-out" }, dur: 0.12, hold: 0, flow: true, brows: -0.8 },
      { r: { fingers: "up-up-in" }, dur: 0.12, hold: 0, flow: true, brows: -0.8 },
    ], 2),
  ]),
  sign("WHO", ["who"], [
    { r: { shape: "L", at: "chin", off: [0, -0.005, 0.01], contact: "thumb", palm: "in", fingers: "up" }, dur: 0.34, hold: 0, brows: -0.8, mouth: "oo" },
    ...repeat([
      { r: { shape: "X" }, dur: 0.12, hold: 0, brows: -0.8, mouth: "oo" },
      { r: { shape: "L" }, dur: 0.12, hold: 0, brows: -0.8, mouth: "oo" },
    ], 2),
  ]),
  sign("WHY", ["why"], [
    { r: { shape: "B", at: "temple", off: [-0.01, 0.005, 0.02], contact: "tips", palm: "back", fingers: "up-in" }, dur: 0.34, hold: 0.06, brows: -0.8 },
    { r: { shape: "Y", at: [0.13, 0.69, 0.2], contact: "wrist", palm: "back", fingers: "up" }, dur: 0.3, hold: 0.12, brows: -0.8 },
  ]),
  sign("HOW", ["how"], [
    { r: { shape: "bent-B", at: [0.015, 0.33, 0.3], contact: "back", palm: "out", fingers: "down" }, l: { shape: "bent-B", at: [0.015, 0.33, 0.3], contact: "back", palm: "out", fingers: "down" }, dur: 0.38, hold: 0.04, brows: -0.8 },
    { r: { at: [0.05, 0.32, 0.32], palm: "up", fingers: "fwd" }, l: { at: [0.05, 0.32, 0.32], palm: "up", fingers: "fwd" }, dur: 0.3, hold: 0.12, brows: -0.8 },
  ]),
  sign("WHEN", ["when"], [
    { r: { shape: "1", at: [-0.03, 0.39, 0.3], contact: "index", palm: "back", fingers: "down" }, l: { shape: "1", at: [0.03, 0.33, 0.3], contact: "index", palm: "in", fingers: "up" }, dur: 0.38, hold: 0, brows: -0.8 },
    ...circling([0, 0, 0], circle(0.03, "flat", 5), 0.1).map((f) => ({ ...f, brows: -0.8 })),
    { r: { at: [-0.03, 0.338, 0.3] }, dur: 0.16, hold: 0.1, brows: -0.8 },
  ]),
  sign("NAME", ["name", "called"], [
    { r: { shape: "H", at: [-0.01, 0.38, 0.32], contact: "tips", palm: "back-in", fingers: "fwd-in" }, l: { shape: "H", at: [0.04, 0.33, 0.3], contact: "index", palm: "back-in", fingers: "fwd-in" }, dur: 0.38, hold: 0 },
    ...repeat([
      { r: { at: [-0.01, 0.352, 0.32] }, dur: 0.14, hold: 0.02 },
      { r: { at: [-0.01, 0.38, 0.32] }, dur: 0.12, hold: 0 },
    ], 2),
  ]),

  // Doing
  sign("HELP", ["help", "assist"], [
    { r: { shape: "A-thumb", at: add(ON_BASE, [0, 0.005, 0]), contact: "edge", palm: "in", fingers: "fwd" }, l: { ...BASE_PALM_UP, at: [0.03, 0.22, 0.28] }, dur: 0.4, hold: 0.06 },
    { r: { at: add(ON_BASE, [0, 0.105, 0]) }, l: { at: [0.03, 0.32, 0.28] }, dur: 0.32, hold: 0.12 },
  ]),
  sign("LEARN", ["learn", "study"], [
    { r: { shape: "5", at: add(ON_BASE, [0, 0.01, 0]), contact: "tips", palm: "down", fingers: "fwd-in" }, l: BASE_PALM_UP, dur: 0.38, hold: 0.04 },
    { r: { shape: "flat-O" }, dur: 0.16, hold: 0.04 },
    { r: { at: "forehead", off: [0.02, 0, 0.015], palm: "down", fingers: "back" }, dur: 0.34, hold: 0.12 },
  ]),
  sign("TEACH", ["teach", "teacher"], [
    { r: { shape: "flat-O", at: "temple", off: [0.04, 0, 0.06], contact: "tips", palm: "down", fingers: "fwd" }, l: { shape: "flat-O", at: "temple", off: [0.04, 0, 0.06], contact: "tips", palm: "down", fingers: "fwd" }, dur: 0.38, hold: 0 },
    ...repeat([
      { r: { off: [0.04, -0.02, 0.14] }, l: { off: [0.04, -0.02, 0.14] }, dur: 0.16, hold: 0.02 },
      { r: { off: [0.04, 0, 0.06] }, l: { off: [0.04, 0, 0.06] }, dur: 0.14, hold: 0 },
    ], 2),
  ]),
  sign("UNDERSTAND", ["understand", "understood"], [
    { r: { shape: "S", at: "temple", off: [0.02, 0, 0.05], contact: "knuckles", palm: "back", fingers: "up" }, dur: 0.36, hold: 0.06 },
    { r: { shape: "1" }, dur: 0.14, hold: 0.16 },
  ]),
  sign("KNOW", ["know", "knew"], [
    ...repeat([
      { r: { shape: "bent-B", at: "temple", off: [0.035, 0.01, 0], contact: "tips", palm: "in", fingers: "up" }, dur: 0.24, hold: 0 },
      { r: { off: [0.006, 0.01, 0] }, dur: 0.12, hold: 0.04 },
    ], 2),
  ]),
  sign("THINK", ["think", "thought"], [
    { r: { shape: "1", at: "forehead", off: [0.03, 0, 0.06], contact: "index", palm: "down", fingers: "back-in" }, dur: 0.32, hold: 0 },
    { r: { off: [0.03, 0, 0.012] }, dur: 0.14, hold: 0.14 },
  ]),
  sign("SEE", ["see", "saw", "look", "watch"], [
    { r: { shape: "V", at: "eye", off: [-0.032, -0.005, 0.03], contact: "tips", palm: "down", fingers: "back" }, dur: 0.34, hold: 0.04 },
    { r: { off: [-0.02, -0.02, 0.2], palm: "down", fingers: "fwd" }, dur: 0.3, hold: 0.12 },
  ]),
  sign("WANT", ["want", "would like"], [
    { r: { shape: "claw", at: "space", off: [0.08, 0, 0.06], contact: "palm", palm: "up", fingers: "fwd" }, l: { shape: "claw", at: "space", off: [0.08, 0, 0.06], contact: "palm", palm: "up", fingers: "fwd" }, dur: 0.38, hold: 0.04 },
    { r: { off: [0.08, 0.01, -0.06] }, l: { off: [0.08, 0.01, -0.06] }, dur: 0.3, hold: 0.12 },
  ]),
  sign("LIKE", ["like"], [
    { r: { shape: "open-8", at: "chest", off: [0.01, 0, 0.005], contact: "tips", palm: "back", fingers: "up" }, dur: 0.36, hold: 0.06 },
    { r: { shape: "8", off: [0.02, 0, 0.13] }, dur: 0.28, hold: 0.12 },
  ]),
  sign("LOVE", ["love"], [
    { r: { shape: "S", at: [-0.03, 0.4, 0.2], contact: "palm", palm: "back", fingers: "up-in" }, l: { shape: "S", at: [-0.03, 0.42, 0.21], contact: "palm", palm: "back", fingers: "up-in" }, dur: 0.3, hold: 0 },
    { r: { at: [-0.03, 0.4, 0.15] }, l: { at: [-0.03, 0.42, 0.16] }, dur: 0.24, hold: 0.24, mouth: "smile" },
  ]),
  sign("NEED", ["need", "must", "should", "have to", "has to", "had to", "got to", "gotta"], [
    ...repeat([
      { r: { shape: "X", at: "space", off: [0.04, 0.04, 0], contact: "wrist", palm: "down", fingers: "fwd" }, dur: 0.2, hold: 0 },
      { r: { palm: "down-back", fingers: "fwd-down" }, dur: 0.14, hold: 0.04 },
    ], 2),
  ]),
  sign("EAT", ["eat", "food", "ate", "eaten"], [
    ...repeat([
      { r: { shape: "flat-O", at: "mouth", off: [0, -0.005, 0.05], contact: "tips", palm: "back-down", fingers: "up-back" }, dur: 0.22, hold: 0 },
      { r: { off: [0, 0, 0.01] }, dur: 0.12, hold: 0.04, mouth: "open" },
    ], 2),
  ]),
  sign("DRINK", ["drink", "drank"], [
    { r: { shape: "C", at: "chin", off: [0, -0.01, 0.04], contact: "thumb", palm: "in", fingers: "up" }, dur: 0.34, hold: 0.04 },
    { r: { off: [0, 0.015, 0.05], fingers: "up-back" }, dur: 0.3, hold: 0.12 },
  ]),
  sign("WATER", ["water"], [
    ...repeat([
      { r: { shape: "W", at: "chin", off: [0, 0, 0.04], contact: "index", palm: "in", fingers: "up-in" }, dur: 0.24, hold: 0 },
      { r: { off: [0, 0, 0.005] }, dur: 0.12, hold: 0.04 },
    ], 2),
  ]),
  sign("WORK", ["work", "job"], [
    ...repeat([
      { r: { shape: "S", at: add([-0.03, 0.27, 0.27], [0, 0.07, 0]), contact: "palm", palm: "down", fingers: "fwd-in" }, l: BASE_FIST, dur: 0.24, hold: 0 },
      { r: { at: [-0.03, 0.285, 0.27] }, dur: 0.12, hold: 0.04 },
    ], 2),
  ]),
  sign("STOP", ["stop"], [
    { r: { shape: "B", at: add(ON_BASE, [0, 0.1, 0]), contact: "edge", palm: "in", fingers: "fwd" }, l: BASE_PALM_UP, dur: 0.36, hold: 0.04 },
    { r: { at: add(ON_BASE, [0, 0.008, 0]) }, dur: 0.14, hold: 0.16 },
  ]),
  sign("WAIT", ["wait"], [
    { r: { shape: "5", at: "space", off: [0.1, 0.02, 0.02], contact: "palm", palm: "up", fingers: "fwd-in" }, l: { shape: "5", at: "space", off: [0.12, 0.02, 0.12], contact: "palm", palm: "up", fingers: "fwd-in" }, dur: 0.38, hold: 0 },
    ...repeat([
      { r: { shape: "claw" }, l: { shape: "claw" }, dur: 0.1, hold: 0 },
      { r: { shape: "5" }, l: { shape: "5" }, dur: 0.1, hold: 0 },
    ], 2),
  ]),
  sign("GO", ["go", "going", "went", "gone"], [
    { r: { shape: "1", at: "space", off: [0.06, 0.08, -0.06], contact: "index", palm: "back", fingers: "up" }, l: { shape: "1", at: "space", off: [0.06, 0.08, -0.06], contact: "index", palm: "back", fingers: "up" }, dur: 0.36, hold: 0.04 },
    { r: { off: [0.09, 0, 0.14], palm: "down", fingers: "fwd" }, l: { off: [0.09, 0, 0.14], palm: "down", fingers: "fwd" }, dur: 0.3, hold: 0.12 },
  ]),
  sign("COME", ["come", "came"], [
    { r: { shape: "1", at: "space", off: [0.09, 0, 0.14], contact: "index", palm: "up", fingers: "fwd" }, l: { shape: "1", at: "space", off: [0.09, 0, 0.14], contact: "index", palm: "up", fingers: "fwd" }, dur: 0.36, hold: 0.04 },
    { r: { off: [0.06, 0.08, -0.04], palm: "back", fingers: "up" }, l: { off: [0.06, 0.08, -0.04], palm: "back", fingers: "up" }, dur: 0.3, hold: 0.12 },
  ]),
  sign("MEET", ["meet", "met"], [
    { r: { shape: "1", at: [0.13, 0.33, 0.3], contact: "palm", palm: "in", fingers: "up" }, l: { shape: "1", at: [0.13, 0.33, 0.3], contact: "palm", palm: "in", fingers: "up" }, dur: 0.38, hold: 0.04 },
    { r: { at: [0.022, 0.33, 0.3] }, l: { at: [0.022, 0.33, 0.3] }, dur: 0.28, hold: 0.12 },
  ]),
  sign("SIGN", ["sign", "signing", "signs"], [
    { r: { shape: "1", at: "space", off: [0.05, 0.08, 0], contact: "index", palm: "fwd-down", fingers: "up-in" }, l: { shape: "1", at: "space", off: [0.05, 0.02, 0], contact: "index", palm: "fwd-down", fingers: "up-in" }, dur: 0.36, hold: 0 },
    ...repeat([
      { r: { off: [0.05, 0.02, -0.04] }, l: { off: [0.05, 0.08, 0.04] }, dur: 0.14, hold: 0, flow: true },
      { r: { off: [0.05, 0.08, 0] }, l: { off: [0.05, 0.02, 0] }, dur: 0.14, hold: 0, flow: true },
    ], 2),
  ]),
  sign("LANGUAGE", ["language"], [
    { r: { shape: "L", at: [0.015, 0.33, 0.3], contact: "thumb", palm: "down", fingers: "fwd" }, l: { shape: "L", at: [0.015, 0.33, 0.3], contact: "thumb", palm: "down", fingers: "fwd" }, dur: 0.38, hold: 0.04 },
    { r: { at: [0.1, 0.33, 0.3], palm: "down-out" }, l: { at: [0.1, 0.33, 0.3], palm: "down-out" }, dur: 0.16, hold: 0, flow: true },
    { r: { at: [0.19, 0.33, 0.3], palm: "down" }, l: { at: [0.19, 0.33, 0.3], palm: "down" }, dur: 0.16, hold: 0.1 },
  ]),
  sign("FINISH", ["finish", "finished", "done", "already"], [
    { r: { shape: "5", at: "space", off: [0.07, 0.05, -0.03], contact: "wrist", palm: "back", fingers: "up" }, l: { shape: "5", at: "space", off: [0.07, 0.05, -0.03], contact: "wrist", palm: "back", fingers: "up" }, dur: 0.36, hold: 0.04 },
    { r: { off: [0.13, 0.03, 0.04], palm: "down", fingers: "fwd-out" }, l: { off: [0.13, 0.03, 0.04], palm: "down", fingers: "fwd-out" }, dur: 0.24, hold: 0.12 },
  ]),
  sign("CAN", ["can", "could", "able"], [
    { r: { shape: "S", at: "space", off: [0.07, 0.07, 0], contact: "wrist", palm: "down", fingers: "fwd" }, l: { shape: "S", at: "space", off: [0.07, 0.07, 0], contact: "wrist", palm: "down", fingers: "fwd" }, dur: 0.36, hold: 0.02 },
    { r: { off: [0.07, 0.01, 0.02] }, l: { off: [0.07, 0.01, 0.02] }, dur: 0.18, hold: 0.12 },
  ]),
  sign("AGAIN", ["again", "repeat"], [
    { r: { shape: "bent-B", at: [0.06, 0.31, 0.28], contact: "tips", palm: "up", fingers: "fwd-in" }, l: BASE_PALM_UP, dur: 0.38, hold: 0.02 },
    { r: { at: add(ON_BASE, [0, 0.005, 0]), palm: "down" }, dur: 0.3, hold: 0.12 },
  ]),
  sign("MORE", ["more"], [
    ...repeat([
      { r: { shape: "flat-O", at: [0.06, 0.33, 0.3], contact: "tips", palm: "down", fingers: "in" }, l: { shape: "flat-O", at: [0.06, 0.33, 0.3], contact: "tips", palm: "down", fingers: "in" }, dur: 0.24, hold: 0 },
      { r: { at: [0.012, 0.33, 0.3] }, l: { at: [0.012, 0.33, 0.3] }, dur: 0.12, hold: 0.04 },
    ], 2),
  ]),
  sign("NICE", ["nice", "clean"], [
    { r: { shape: "B", at: add(ON_BASE, [0, -0.002, -0.06]), contact: "palm", palm: "down", fingers: "fwd-in" }, l: BASE_PALM_UP, dur: 0.38, hold: 0.02 },
    { r: { at: add(ON_BASE, [0, 0, 0.08]) }, dur: 0.28, hold: 0.1, mouth: "smile" },
  ]),
  sign("SCHOOL", ["school"], [
    ...repeat([
      { r: { shape: "B", at: add(ON_BASE, [0, 0.08, 0]), contact: "palm", palm: "down", fingers: "fwd-in" }, l: BASE_PALM_UP, dur: 0.24, hold: 0 },
      { r: { at: add(ON_BASE, [0, 0.002, 0]) }, dur: 0.12, hold: 0.04 },
    ], 2),
  ]),
  sign("HOME", ["home"], [
    { r: { shape: "flat-O", at: "mouth", off: [0.03, 0, 0.005], contact: "tips", palm: "back-down", fingers: "up-back" }, dur: 0.34, hold: 0.06 },
    { r: { at: "cheek", off: [0.012, 0.01, 0.005] }, dur: 0.22, hold: 0.1 },
  ]),
  sign("TIME", ["time", "clock"], [
    ...repeat([
      { r: { shape: "1", at: [-0.03, 0.33, 0.25], contact: "index", palm: "back", fingers: "down" }, l: BASE_FIST, dur: 0.24, hold: 0 },
      { r: { at: [-0.03, 0.29, 0.25] }, dur: 0.12, hold: 0.04 },
    ], 2),
  ]),
  sign("NOW", ["now", "today"], [
    { r: { shape: "Y", at: "space", off: [0.08, 0.06, 0], contact: "palm", palm: "up", fingers: "fwd" }, l: { shape: "Y", at: "space", off: [0.08, 0.06, 0], contact: "palm", palm: "up", fingers: "fwd" }, dur: 0.36, hold: 0.02 },
    { r: { off: [0.08, 0.01, 0.02] }, l: { off: [0.08, 0.01, 0.02] }, dur: 0.18, hold: 0.12 },
  ]),
  sign("TOMORROW", ["tomorrow"], [
    { r: { shape: "A-thumb", at: "cheek", off: [0.01, 0, 0.005], contact: "thumb", palm: "in", fingers: "fwd" }, dur: 0.34, hold: 0.04 },
    { r: { off: [0.03, 0.01, 0.12] }, dur: 0.26, hold: 0.12 },
  ]),
  sign("YESTERDAY", ["yesterday"], [
    { r: { shape: "A-thumb", at: "jaw", off: [-0.01, 0, 0.03], contact: "thumb", palm: "in", fingers: "fwd" }, dur: 0.34, hold: 0.04 },
    { r: { at: "cheek", off: [0.025, 0.02, -0.01] }, dur: 0.26, hold: 0.12 },
  ]),
  sign("MORNING", ["morning"], [
    { r: { shape: "B", at: [0.06, 0.26, 0.33], contact: "wrist", palm: "up", fingers: "fwd" }, l: ARM_ACROSS, dur: 0.38, hold: 0.02 },
    { r: { at: [0.06, 0.34, 0.33], palm: "back", fingers: "up" }, dur: 0.34, hold: 0.12 },
  ]),
  sign("NIGHT", ["night", "tonight", "evening"], [
    { r: { shape: "bent-B", at: [-0.0, 0.33, 0.3], contact: "wrist", palm: "down", fingers: "fwd-in" }, l: ARM_ACROSS, dur: 0.38, hold: 0.04 },
    ...repeat([
      { r: { palm: "down-back", fingers: "fwd-down" }, dur: 0.14, hold: 0 },
      { r: { palm: "down", fingers: "fwd-in" }, dur: 0.14, hold: 0 },
    ], 1),
  ]),

  // Feelings
  sign("HAPPY", ["happy", "glad", "excited", "joyful", "cheerful"], [
    { r: { shape: "B", at: "chest", off: [0.02, -0.04, 0], contact: "palm", palm: "back", fingers: "up-in" }, dur: 0.34, hold: 0, mouth: "smile" },
    ...repeat([
      { r: { off: [0.02, 0.05, 0.03] }, dur: 0.16, hold: 0, flow: true, mouth: "smile" },
      { r: { off: [0.02, -0.04, 0] }, dur: 0.16, hold: 0, flow: true, mouth: "smile" },
    ], 2),
  ]),
  sign("SAD", ["sad", "unhappy"], [
    { r: { shape: "5", at: "eye", off: [-0.01, 0.01, 0.08], contact: "palm", palm: "back", fingers: "up" }, l: { shape: "5", at: "eye", off: [-0.01, 0.01, 0.08], contact: "palm", palm: "back", fingers: "up" }, dur: 0.4, hold: 0.04, brows: 0.4, mouth: "pursed", head: { nod: 0.08 } },
    { r: { off: [-0.01, -0.12, 0.09] }, l: { off: [-0.01, -0.12, 0.09] }, dur: 0.4, hold: 0.12, brows: 0.4, mouth: "pursed", head: { nod: 0.14 } },
  ]),
];

/** The question signs ASL moves to the end of a wh-question. */
export const WH_GLOSSES = new Set(["WHAT", "WHERE", "WHO", "WHY", "HOW", "WHEN"]);
