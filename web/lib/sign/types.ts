// The vocabulary signs are written in.
//
// Coordinates are in metres, in the signer's upper body, with the origin at
// the waist on the midline. Each hand is written in its own mirrored frame:
// +x is outward toward that hand's side, +y up, +z forward toward the viewer.
// Writing both hands the same way gives a symmetric two-handed sign.

export type Vec3 = readonly [x: number, y: number, z: number];
export type Quat = readonly [x: number, y: number, z: number, w: number];

/** Directions combine with dashes: "fwd-up", "in-down". */
export type Direction = string;

export type Contact =
  | "palm" // centre of the palm's surface
  | "back" // centre of the back of the hand
  | "wrist"
  | "tips" // middle fingertip
  | "index" // index fingertip
  | "thumb" // thumb tip
  | "pinky" // pinky fingertip
  | "edge" // little-finger edge of the palm
  | "knuckles"; // front of the middle knuckle row

export type HandSpec = {
  shape?: string;
  /** A named body location, or a point. */
  at?: string | Vec3;
  /** Added to the location. */
  off?: Vec3;
  /** Which way the palm faces. */
  palm?: Direction;
  /** Which way the fingers point, as if the hand were flat. */
  fingers?: Direction;
  /** The part of the hand that sits at the location. */
  contact?: Contact;
  /** Which way the elbow leans, from the shoulder. */
  elbow?: Vec3;
};

export type Mouth = "rest" | "open" | "oo" | "ee" | "smile" | "pursed";

export type Keyframe = {
  /** Dominant hand. Missing fields carry over from the frame before. */
  r?: HandSpec | "rest";
  /** Non-dominant hand. "rest" drops it by the side. */
  l?: HandSpec | "rest";
  /** Seconds to move into this frame at 1x. */
  dur?: number;
  /** Seconds to stay. */
  hold?: number;
  /** Move straight through this frame without easing to a stop. */
  flow?: boolean;
  mouth?: Mouth;
  /** Brows, from -1 (furrowed) to 1 (raised). */
  brows?: number;
  /** Head turn in radians: nod (pitch), turn (yaw), tilt (roll). */
  head?: { nod?: number; turn?: number; tilt?: number };
};

export type SignDef = {
  gloss: string;
  /** The English words and phrases this sign is used for. */
  words: string[];
  frames: Keyframe[];
  /** Signed with a head shake. */
  negates?: boolean;
};

export type HandPose = {
  /** Wrist position in the hand's mirrored frame. */
  wrist: Vec3;
  /** Hand orientation in the hand's mirrored frame. */
  quat: Quat;
  /** Joint angles: four fingers of [spread, base, middle, tip], then the
   * thumb's [tilt, opposition, base, middle, tip]. */
  joints: number[];
  /** Direction the elbow leans, from the shoulder. */
  elbow: Vec3;
};

export type FacePose = {
  brows: number;
  /** How open the mouth is, 0–1. */
  open: number;
  /** How wide (a smile or "ee"), 0–1. */
  wide: number;
  /** How rounded ("oo"), 0–1. */
  round: number;
};

export type HeadPose = { nod: number; turn: number; tilt: number };

export type Pose = {
  r: HandPose;
  l: HandPose;
  face: FacePose;
  head: HeadPose;
};
