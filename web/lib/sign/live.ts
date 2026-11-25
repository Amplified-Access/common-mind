import { Quaternion } from "three";

import type { LandmarkFrame, LandmarksFile } from "@/lib/sign-capture/landmarks";

import type { Body } from "./body";
import { faceFor } from "./resolve";
import {
  HEAD_LIMIT,
  HOLD,
  type HandShape,
  type Side,
  armLengths,
  armScale,
  facePose,
  handPose,
  handShape,
  headAngles,
  median,
} from "./replay";
import type { FacePose, HandPose, HeadPose, Pose, Quat, Vec3 } from "./types";

// The avatar mirroring a signer live, from each frame the camera tracks:
// the same steps as a recorded take's replay (replay.ts), a frame at a
// time. A replay can smooth over frames either side; live, only the frames
// before are known, so each pose eases toward the newest one.

/** Seconds for the avatar to cover most of the way to a new pose: enough
 * to steady the tracking's jitter without lagging the signer visibly. */
const EASE = 0.05;
/** Recent frames the arm length and the head's usual facing are read from. */
const WINDOW = 90;

/** The newest tracked frame, as the camera loop shares it. */
export type LiveFrame = {
  frame: LandmarkFrame;
  /** The names of the frame's face weights. */
  blendshapes: string[];
  video: LandmarksFile["video"];
};

const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const lerpAll = (a: readonly number[], b: readonly number[], u: number) => a.map((v, i) => lerp(v, b[i] ?? v, u));

function easeHand(a: HandPose, b: HandPose, u: number): HandPose {
  const q = new Quaternion(...a.quat).slerp(new Quaternion(...b.quat), u);
  return {
    wrist: lerpAll(a.wrist, b.wrist, u) as unknown as Vec3,
    elbow: lerpAll(a.elbow, b.elbow, u) as unknown as Vec3,
    quat: [q.x, q.y, q.z, q.w] as Quat,
    joints: lerpAll(a.joints, b.joints, u),
  };
}

function easeFace(a: FacePose, b: FacePose, u: number): FacePose {
  const shapes = b.shapes && Object.fromEntries(Object.entries(b.shapes).map(([k, v]) => [k, lerp(a.shapes?.[k] ?? 0, v, u)]));
  return {
    brows: lerp(a.brows, b.brows, u),
    open: lerp(a.open, b.open, u),
    wide: lerp(a.wide, b.wide, u),
    round: lerp(a.round, b.round, u),
    ...(shapes && { shapes }),
  };
}

const easeHead = (a: HeadPose, b: HeadPose, u: number): HeadPose => ({
  nod: lerp(a.nod, b.nod, u),
  turn: lerp(a.turn, b.turn, u),
  tilt: lerp(a.tilt, b.tilt, u),
});

const clamp = (x: number, lo: number, hi: number) => Math.min(Math.max(x, lo), hi);

/** A live retargeter: feed it each tracked frame, in order, for the pose
 * the avatar should take now. */
export function createLiveRetarget() {
  const lengths: number[] = [];
  const heads: [number, number, number][] = [];
  const held: Record<Side, { shape: HandShape; t: number } | null> = { left: null, right: null };
  let current: Pose | null = null;
  let lastT = 0;

  const side = (frame: LandmarkFrame, s: Side, video: LiveFrame["video"], body: Body, scale: number) => {
    const shape = handShape(frame, s, video);
    if (shape) held[s] = { shape, t: frame.t };
    const kept = held[s] && frame.t - held[s].t <= HOLD ? held[s].shape : null;
    // Only a hand in view signs; a flicker in tracking keeps the last pose.
    const inView = shape ?? kept;
    return handPose(frame, s, body, scale, inView, !!inView);
  };

  return {
    update(frame: LandmarkFrame, blendshapes: string[], video: LiveFrame["video"], body: Body): Pose {
      lengths.push(...armLengths(frame));
      if (lengths.length > WINDOW) lengths.splice(0, lengths.length - WINDOW);
      const scale = armScale(lengths, body);

      const angles = headAngles(frame);
      if (angles) {
        heads.push(angles);
        if (heads.length > WINDOW) heads.shift();
      }
      const neutral = [0, 1, 2].map((k) => median(heads.map((h) => h[k])) ?? 0);
      const [turn, nod, tilt] = angles
        ? angles.map((v, k) => clamp(v - neutral[k], -HEAD_LIMIT, HEAD_LIMIT))
        : [0, 0, 0];

      const target: Pose = {
        r: side(frame, "right", video, body, scale),
        l: side(frame, "left", video, body, scale),
        face:
          frame.face && frame.face.length === blendshapes.length
            ? facePose(blendshapes, frame.face)
            : (current?.face ?? faceFor("rest", 0)),
        head: { turn, nod, tilt },
      };

      if (!current) {
        current = target;
      } else {
        const dt = Math.max(frame.t - lastT, 0);
        const u = 1 - Math.exp(-dt / EASE);
        current = {
          r: easeHand(current.r, target.r, u),
          l: easeHand(current.l, target.l, u),
          face: easeFace(current.face, target.face, u),
          head: easeHead(current.head, target.head, u),
        };
      }
      lastT = frame.t;
      return current;
    },
  };
}

export type LiveRetarget = ReturnType<typeof createLiveRetarget>;
