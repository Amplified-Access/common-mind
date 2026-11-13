import type { Vec3 } from "./types";

// The signer's measurements, shared by the pose solver and the 3D avatar so
// a hand placed "at the chin" meets the chin that is drawn.

export const SHOULDER: Vec3 = [0.18, 0.5, -0.01];
export const UPPER_ARM = 0.28;
export const FOREARM = 0.25;

/** The head is drawn at a natural size, then scaled up a little, as
 * signing avatars are, so the face reads at a distance. */
export const HEAD_SCALE = 1.18;
export const HEAD_CENTER: Vec3 = [0, 0.738, 0.012];
/** The cranium's radii before scaling. */
export const HEAD_RADII: Vec3 = [0.078, 0.1, 0.092];

/** The elbow hangs down and a little out, unless a sign says otherwise, so a
 * hand raised to the face keeps its elbow low. */
export const DEFAULT_ELBOW: Vec3 = [0.3, -1, 0.05];

// Places on the face, from the head's centre before scaling. They sit just
// off the skin so contact reads as a touch.
const FACE: Record<string, Vec3> = {
  forehead: [0, 0.058, 0.09],
  temple: [0.072, 0.035, 0.042],
  eye: [0.031, 0.014, 0.1],
  nose: [0, -0.018, 0.116],
  mouth: [0, -0.05, 0.102],
  chin: [0, -0.085, 0.076],
  cheek: [0.058, -0.035, 0.076],
  jaw: [0.055, -0.066, 0.052],
  ear: [0.088, 0, -0.005],
};

const onFace = ([x, y, z]: Vec3): Vec3 => [
  HEAD_CENTER[0] + x * HEAD_SCALE,
  HEAD_CENTER[1] + y * HEAD_SCALE,
  HEAD_CENTER[2] + z * HEAD_SCALE,
];

// Named places a hand goes, in a hand's mirrored frame (+x toward its own
// side).
export const ANCHORS: Record<string, Vec3> = {
  ...Object.fromEntries(Object.entries(FACE).map(([k, v]) => [k, onFace(v)])),
  throat: [0, 0.59, 0.07],
  shoulder: [0.16, 0.49, 0.075],
  "shoulder-across": [-0.14, 0.48, 0.085],
  chest: [0, 0.4, 0.122],
  "chest-side": [0.075, 0.41, 0.118],
  stomach: [0, 0.2, 0.122],
  // Signing space in front of the body.
  space: [0.05, 0.32, 0.3],
  "space-high": [0.07, 0.5, 0.3],
  "space-low": [0.05, 0.18, 0.27],
  "space-side": [0.22, 0.32, 0.24],
  "space-far": [0.04, 0.36, 0.44],
  // Where fingerspelling happens: beside the chin, out from the shoulder.
  spell: [0.13, 0.52, 0.27],
};
