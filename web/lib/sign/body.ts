import type { Vec3 } from "./types";

// The signer's measurements, shared by the pose solver and the 3D avatar so
// a hand placed "at the chin" meets the chin that is drawn.

export const SHOULDER: Vec3 = [0.18, 0.5, -0.01];
export const UPPER_ARM = 0.28;
export const FOREARM = 0.25;

export const HEAD_CENTER: Vec3 = [0, 0.735, 0.01];
export const HEAD_RADII: Vec3 = [0.078, 0.1, 0.092];
export const NECK_BASE: Vec3 = [0, 0.55, 0];

/** The elbow hangs down, a little out and back, unless a sign says otherwise. */
export const DEFAULT_ELBOW: Vec3 = [0.45, -1, -0.35];

// Named places a hand goes, in a hand's mirrored frame (+x toward its own
// side). Points sit just off the surface so contact reads as a touch.
export const ANCHORS: Record<string, Vec3> = {
  forehead: [0, 0.795, 0.098],
  temple: [0.072, 0.77, 0.05],
  eye: [0.032, 0.75, 0.112],
  nose: [0, 0.718, 0.128],
  mouth: [0, 0.685, 0.108],
  chin: [0, 0.652, 0.095],
  cheek: [0.058, 0.7, 0.085],
  jaw: [0.06, 0.665, 0.065],
  ear: [0.088, 0.735, 0.005],
  throat: [0, 0.59, 0.065],
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
  spell: [0.13, 0.5, 0.27],
};
