import { Vector3 } from "three";

import { type Body, DEFAULT_BODY, DEFAULT_ELBOW } from "./body";
import { contactPoint, direction, jointsFor, orientHand } from "./hand";
import type { FacePose, HandPose, HandSpec, Mouth, Vec3 } from "./types";

const DEFAULTS = {
  shape: "B",
  at: "space",
  off: [0, 0, 0] as Vec3,
  palm: "fwd",
  fingers: "up",
  contact: "palm",
  elbow: DEFAULT_ELBOW,
} as const;

const toVec3 = (v: Vector3): Vec3 => [v.x, v.y, v.z];

/** Turns a written hand into a pose: the wrist placed so the named part of
 * the hand sits at the named location on this body. */
export function resolveHand(spec: HandSpec, body: Body = DEFAULT_BODY): HandPose {
  const s = { ...DEFAULTS, ...spec };
  const anchor = typeof s.at === "string" ? body.anchors[s.at] : s.at;
  if (!anchor) throw new Error(`Unknown location "${String(s.at)}"`);

  const quat = orientHand(direction(s.fingers), direction(s.palm));
  const joints = jointsFor(s.shape);
  const contact = contactPoint(s.contact, joints).multiplyScalar(body.handScale).applyQuaternion(quat);
  const wrist = new Vector3(...anchor).add(new Vector3(...s.off)).sub(contact);

  return {
    wrist: toVec3(wrist),
    quat: [quat.x, quat.y, quat.z, quat.w],
    joints,
    elbow: s.elbow,
  };
}

/** Hands down by the sides, fingers relaxed. */
export function restHand(body: Body = DEFAULT_BODY): HandPose {
  const [x, y, z] = body.shoulder;
  const reach = (body.upperArm + body.forearm) * 0.96;
  return resolveHand(
    { shape: "relaxed", at: [x + 0.025, y - reach, z + 0.06], contact: "wrist", palm: "in", fingers: "down", elbow: [0.2, -1, -0.2] },
    body,
  );
}

export const REST_HAND: HandPose = restHand();

const MOUTHS: Record<Mouth, Omit<FacePose, "brows">> = {
  rest: { open: 0, wide: 0, round: 0 },
  open: { open: 0.7, wide: 0.1, round: 0 },
  oo: { open: 0.25, wide: 0, round: 1 },
  ee: { open: 0.2, wide: 0.8, round: 0 },
  smile: { open: 0.05, wide: 0.7, round: 0 },
  pursed: { open: 0, wide: 0, round: 0.6 },
};

export const faceFor = (mouth: Mouth = "rest", brows = 0): FacePose => ({
  brows,
  ...MOUTHS[mouth],
});
