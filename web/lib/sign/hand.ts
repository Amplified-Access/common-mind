import { Euler, Matrix4, Quaternion, Vector3 } from "three";

import type { Contact, Vec3 } from "./types";

// The hand, in its own frame: the wrist at the origin, fingers along +y, the
// palm facing +z and the thumb on the -x side. Each hand uses this frame;
// the avatar mirrors the dominant arm, so one description serves both.

export const PALM = { width: 0.082, length: 0.088, depth: 0.03 } as const;

export type FingerName = "index" | "middle" | "ring" | "pinky";

export const FINGERS: readonly {
  name: FingerName;
  base: Vec3;
  lengths: Vec3;
  radius: number;
}[] = [
  { name: "index", base: [-0.028, 0.088, 0], lengths: [0.042, 0.025, 0.02], radius: 0.0088 },
  { name: "middle", base: [-0.0093, 0.091, 0], lengths: [0.046, 0.028, 0.021], radius: 0.009 },
  { name: "ring", base: [0.0093, 0.088, 0], lengths: [0.043, 0.026, 0.02], radius: 0.0085 },
  { name: "pinky", base: [0.027, 0.08, 0], lengths: [0.032, 0.02, 0.018], radius: 0.0075 },
];

export const THUMB = {
  base: [-0.03, 0.016, 0.008] as Vec3,
  lengths: [0.042, 0.03, 0.025] as Vec3,
  radius: 0.0105,
  /** The thumb's resting lean away from the index, before a shape's tilt. */
  lean: 0.45,
};

/** Number of joint angles in a hand pose. */
export const JOINT_COUNT = 21;

/** [spread, base, middle, tip] in radians. Positive bends toward the palm;
 * positive spread leans toward the thumb. */
type Finger = readonly [spread: number, base: number, middle: number, tip: number];
/** [tilt away from the index, opposition across the palm, base, middle, tip]. */
type Thumb = readonly [tilt: number, oppose: number, base: number, middle: number, tip: number];

// Finger postures.
const straight = (spread = 0): Finger => [spread, 0, 0, 0];
const fist = (spread = 0): Finger => [spread, 1.55, 1.7, 1.0];
const bent = (spread = 0): Finger => [spread, 1.45, 0.05, 0.05];
const hooked = (spread = 0): Finger => [spread, 0.2, 1.45, 1.1];
const round = (spread = 0): Finger => [spread, 0.55, 0.75, 0.5];
const pinch = (spread = 0): Finger => [spread, 0.85, 0.95, 0.55];
const loose = (spread = 0): Finger => [spread, 0.25, 0.3, 0.2];

// Thumb postures.
const THUMBS = {
  out: [1.0, 0.15, 0, 0.05, 0.05],
  side: [0.05, 0.3, 0, 0.15, 0.1],
  across: [0.25, 1.25, 0.25, 0.45, 0.35],
  over: [0.35, 1.45, 0.45, 0.5, 0.35],
  tuck: [0.15, 1.15, 0.35, 0.65, 0.45],
  pinch: [0.6, 0.95, 0.15, 0.3, 0.25],
  c: [0.75, 0.75, 0, 0.2, 0.15],
  loose: [0.45, 0.5, 0.1, 0.2, 0.15],
} as const satisfies Record<string, Thumb>;

type Handshape = { fingers: readonly [Finger, Finger, Finger, Finger]; thumb: Thumb };

const shape = (
  index: Finger,
  middle: Finger,
  ring: Finger,
  pinky: Finger,
  thumb: keyof typeof THUMBS | Thumb,
): Handshape => ({
  fingers: [index, middle, ring, pinky],
  thumb: typeof thumb === "string" ? THUMBS[thumb] : thumb,
});

// Handshapes by name: the fingerspelling letters, the number shapes, and the
// classifier shapes signs use. Approximations of ASL handshapes.
export const HANDSHAPES: Record<string, Handshape> = {
  relaxed: shape(loose(0.04), loose(), loose(-0.03), loose(-0.06), "loose"),
  A: shape(fist(), fist(), fist(), fist(), "side"),
  B: shape(straight(0.02), straight(), straight(-0.02), straight(-0.04), "across"),
  C: shape(round(0.02), round(), round(-0.03), round(-0.06), "c"),
  D: shape(straight(), pinch(), pinch(-0.04), pinch(-0.08), "pinch"),
  E: shape(hooked(), hooked(), hooked(), hooked(), "tuck"),
  F: shape(pinch(0.05), straight(-0.08), straight(-0.16), straight(-0.24), "pinch"),
  G: shape(straight(), fist(), fist(), fist(), [0.55, 0.3, 0, 0.05, 0.05]),
  H: shape(straight(-0.03), straight(0.03), fist(), fist(), "tuck"),
  I: shape(fist(), fist(), fist(), straight(-0.05), "over"),
  K: shape(straight(0.12), straight(-0.18), fist(), fist(), [0.45, 0.85, 0.1, 0.1, 0.1]),
  L: shape(straight(), fist(), fist(), fist(), "out"),
  M: shape([0, 1.35, 1.5, 0.9], [0, 1.35, 1.5, 0.9], [0, 1.35, 1.5, 0.9], fist(), "tuck"),
  N: shape([0, 1.35, 1.5, 0.9], [0, 1.35, 1.5, 0.9], fist(), fist(), "tuck"),
  O: shape(pinch(0.02), pinch(), pinch(-0.03), pinch(-0.06), "pinch"),
  R: shape(straight(-0.12), straight(0.14), fist(), fist(), "tuck"),
  S: shape(fist(), fist(), fist(), fist(), "over"),
  T: shape([0, 1.25, 1.4, 0.9], fist(), fist(), fist(), "tuck"),
  U: shape(straight(-0.03), straight(0.03), fist(), fist(), "tuck"),
  V: shape(straight(0.18), straight(-0.18), fist(), fist(), "tuck"),
  W: shape(straight(0.2), straight(), straight(-0.2), fist(), "tuck"),
  X: shape(hooked(), fist(), fist(), fist(), "tuck"),
  Y: shape(fist(), fist(), fist(), straight(-0.3), "out"),
  "1": shape(straight(), fist(), fist(), fist(), "tuck"),
  "3": shape(straight(0.16), straight(-0.16), fist(), fist(), "out"),
  "4": shape(straight(0.12), straight(0.04), straight(-0.04), straight(-0.12), "across"),
  "5": shape(straight(0.3), straight(0.08), straight(-0.12), straight(-0.3), "out"),
  "6": shape(straight(0.16), straight(), straight(-0.16), pinch(-0.1), "tuck"),
  "7": shape(straight(0.16), straight(-0.1), pinch(-0.1), straight(-0.3), "tuck"),
  "8": shape(straight(0.16), pinch(-0.06), straight(-0.16), straight(-0.3), "pinch"),
  "9": shape(pinch(0.05), straight(-0.08), straight(-0.16), straight(-0.24), "pinch"),
  /** Bent B: fingers straight but bent at the knuckles. */
  "bent-B": shape(bent(0.02), bent(), bent(-0.02), bent(-0.04), "across"),
  /** Flat O: fingertips gathered on the thumb. */
  "flat-O": shape([0.02, 1.0, 0.35, 0.2], [0, 1.0, 0.35, 0.2], [-0.03, 1.0, 0.35, 0.2], [-0.06, 1.0, 0.35, 0.2], [0.5, 1.0, 0.1, 0.1, 0.1]),
  /** Claw: spread and curled. */
  claw: shape(hooked(0.3), hooked(0.08), hooked(-0.12), hooked(-0.3), "c"),
  /** Open 8: middle finger bent forward, the rest spread. */
  "open-8": shape(straight(0.3), [0, 0.9, 0.3, 0.2], straight(-0.12), straight(-0.3), "out"),
  /** "I love you": thumb, index and pinky out. */
  ILY: shape(straight(0.05), fist(), fist(), straight(-0.3), "out"),
  /** Index and middle out, thumb out: the open "no". */
  "no-open": shape(straight(0.03), straight(-0.03), fist(), fist(), "out"),
  /** Index, middle and thumb tips snapped together. */
  "no-closed": shape(pinch(0.03), pinch(-0.03), fist(), fist(), "pinch"),
  /** Thumb up from a fist. */
  "A-thumb": shape(fist(), fist(), fist(), fist(), [0.2, 0.05, -0.1, 0, 0]),
};

export const handshapeNames = () => Object.keys(HANDSHAPES);

/** The joint angles for a handshape, flattened in the HandPose order. */
export function jointsFor(name: string): number[] {
  const hs = HANDSHAPES[name];
  if (!hs) throw new Error(`Unknown handshape "${name}"`);
  return [...hs.fingers.flat(), ...hs.thumb];
}

// Rotations used by both the solver and the avatar, so they agree.
const tmpEuler = new Euler();

/** A finger's base joint: spread about z, then bend about x. */
export const fingerBaseEuler = (spread: number, bend: number) =>
  tmpEuler.set(bend, 0, spread, "ZXY");

/** The thumb's base: bend about x, lean about z, then swing across the palm
 * about y. */
export const thumbBaseEuler = (tilt: number, oppose: number, bend: number) =>
  tmpEuler.set(bend, oppose, THUMB.lean + tilt, "YZX");

const X = new Vector3(1, 0, 0);

/** The joints along a finger, base to tip: the base turned by its Euler,
 * each later joint bending about x. */
function chainPoints(base: Vec3, baseEuler: Euler, lengths: Vec3, bends: readonly [number, number]): Vector3[] {
  const turn = new Quaternion().setFromEuler(baseEuler);
  const points = [new Vector3(...base)];
  [0, ...bends].forEach((bend, i) => {
    if (i > 0) turn.multiply(new Quaternion().setFromAxisAngle(X, bend));
    points.push(points[i].clone().add(new Vector3(0, lengths[i], 0).applyQuaternion(turn)));
  });
  return points;
}

/** The four joints of a digit (0–3 the fingers, index to pinky; 4 the
 * thumb), base to tip, in the hand's frame. An avatar's finger bones are
 * aimed along these. */
export function digitPoints(digit: number, joints: readonly number[]): Vector3[] {
  if (digit === 4) {
    const [tilt, oppose, a, b, c] = joints.slice(16, 21);
    return chainPoints(THUMB.base, thumbBaseEuler(tilt, oppose, a), THUMB.lengths, [b, c]);
  }
  const f = FINGERS[digit];
  const [spread, a, b, c] = joints.slice(digit * 4, digit * 4 + 4);
  return chainPoints(f.base, fingerBaseEuler(spread, a), f.lengths, [b, c]);
}

/** Where a part of the hand is, in the hand's frame, for a set of joints. */
export function contactPoint(contact: Contact, joints: readonly number[]): Vector3 {
  const finger = (i: number) => digitPoints(i, joints)[3];
  const surface = PALM.depth / 2;
  switch (contact) {
    case "palm":
      return new Vector3(0, PALM.length * 0.55, surface);
    case "back":
      return new Vector3(0, PALM.length * 0.55, -surface);
    case "wrist":
      return new Vector3(0, 0, 0);
    case "edge":
      return new Vector3(PALM.width / 2, PALM.length * 0.6, 0);
    case "knuckles":
      // The front of a closed hand: the middle finger's second joint.
      return digitPoints(1, joints)[1];
    case "index":
      return finger(0);
    case "tips":
      return finger(1);
    case "pinky":
      return finger(3);
    case "thumb":
      return digitPoints(4, joints)[3];
  }
}

/** A hand orientation from where its fingers point and its palm faces.
 * The palm direction is straightened to sit at right angles to the fingers. */
export function orientHand(fingers: Vector3, palm: Vector3): Quaternion {
  const y = fingers.clone().normalize();
  const z = palm.clone().sub(y.clone().multiplyScalar(palm.dot(y)));
  if (z.lengthSq() < 1e-6) {
    throw new Error("The palm can't face the way the fingers point");
  }
  z.normalize();
  const x = new Vector3().crossVectors(y, z);
  return new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(x, y, z));
}

const DIRECTIONS: Record<string, Vec3> = {
  up: [0, 1, 0],
  down: [0, -1, 0],
  fwd: [0, 0, 1],
  back: [0, 0, -1],
  out: [1, 0, 0],
  in: [-1, 0, 0],
};

/** "fwd-up" → a unit vector halfway between forward and up. */
export function direction(name: string): Vector3 {
  const v = new Vector3();
  for (const part of name.split("-")) {
    const d = DIRECTIONS[part];
    if (!d) throw new Error(`Unknown direction "${part}" in "${name}"`);
    v.add(new Vector3(...d));
  }
  if (v.lengthSq() < 1e-9) throw new Error(`Direction "${name}" cancels out`);
  return v.normalize();
}
