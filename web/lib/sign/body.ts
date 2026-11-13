import type { Vec3 } from "./types";

// The signer's measurements: where the shoulder is, how long the arm is, and
// where each named place a hand goes sits on this particular body. A loaded
// avatar is measured into one of these (components/sign/rigged-avatar.ts),
// so a hand placed "at the chin" meets that avatar's chin.
//
// Coordinates are in metres, in a hand's mirrored frame: +x toward that
// hand's own side, +y up, +z forward toward the viewer.

export type Body = {
  /** The shoulder joint. */
  shoulder: Vec3;
  upperArm: number;
  forearm: number;
  /** The avatar's hand length over the hand model in hand.ts. */
  handScale: number;
  anchors: Record<string, Vec3>;
};

type Measured =
  | "forehead" | "temple" | "eye" | "nose" | "mouth" | "chin" | "cheek" | "jaw" | "ear"
  | "throat" | "chest" | "chest-side" | "stomach";

/** Places measured on the body itself: face and torso. */
export type Landmarks = Omit<Body, "anchors"> & { points: Record<Measured, Vec3> };

/** The elbow hangs down and a little out, unless a sign says otherwise, so a
 * hand raised to the face keeps its elbow low. */
export const DEFAULT_ELBOW: Vec3 = [0.3, -1, 0.05];

// Signing space: heights from the shoulder, depths from the front of the
// chest.
const SPACE: Record<string, Vec3> = {
  space: [0.05, -0.18, 0.18],
  "space-high": [0.07, 0, 0.18],
  "space-low": [0.05, -0.32, 0.15],
  "space-side": [0.22, -0.18, 0.12],
  "space-far": [0.04, -0.14, 0.32],
  // Where fingerspelling happens: beside the chin, out from the shoulder.
  spell: [0.13, 0.02, 0.15],
};

/** A full body from its measured landmarks: the signing space and the
 * shoulders are placed from the shoulder joint and the front of the chest. */
export function bodyFrom(m: Landmarks): Body {
  const [sx, sy] = m.shoulder;
  const front = m.points.chest[2];
  const space = Object.fromEntries(
    Object.entries(SPACE).map(([k, [x, y, z]]) => [k, [x, sy + y, front + z] as Vec3]),
  );
  return {
    shoulder: m.shoulder,
    upperArm: m.upperArm,
    forearm: m.forearm,
    handScale: m.handScale,
    anchors: {
      ...m.points,
      shoulder: [sx - 0.02, sy - 0.01, front - 0.045],
      "shoulder-across": [-(sx - 0.04), sy - 0.02, front - 0.035],
      ...space,
    },
  };
}

// The default body, an adult of average build: used until an avatar has
// loaded, and in tests.
const HEAD: Vec3 = [0, 0.738, 0.012];
const onHead = ([x, y, z]: Vec3): Vec3 => [HEAD[0] + x * 1.18, HEAD[1] + y * 1.18, HEAD[2] + z * 1.18];

export const DEFAULT_LANDMARKS: Landmarks = {
  shoulder: [0.18, 0.5, -0.01],
  upperArm: 0.28,
  forearm: 0.25,
  handScale: 1,
  points: {
    forehead: onHead([0, 0.058, 0.09]),
    temple: onHead([0.072, 0.035, 0.042]),
    eye: onHead([0.031, 0.014, 0.1]),
    nose: onHead([0, -0.018, 0.116]),
    mouth: onHead([0, -0.05, 0.102]),
    chin: onHead([0, -0.085, 0.076]),
    cheek: onHead([0.058, -0.035, 0.076]),
    jaw: onHead([0.055, -0.066, 0.052]),
    ear: onHead([0.088, 0, -0.005]),
    throat: [0, 0.59, 0.07],
    chest: [0, 0.4, 0.122],
    "chest-side": [0.075, 0.41, 0.118],
    stomach: [0, 0.2, 0.122],
  },
};

export const DEFAULT_BODY: Body = bodyFrom(DEFAULT_LANDMARKS);
