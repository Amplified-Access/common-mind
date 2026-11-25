import { Euler, Matrix4, Quaternion, Vector3 } from "three";

import type { LandmarkFrame, LandmarksFile } from "@/lib/sign-capture/landmarks";

import { type Body, DEFAULT_BODY, DEFAULT_ELBOW } from "./body";
import { FINGERS, THUMB } from "./hand";
import { faceFor, restHand } from "./resolve";
import type { Timeline } from "./timeline";
import type { FacePose, HandPose, HeadPose, Pose, Quat, Vec3 } from "./types";

// A recorded sign replayed on the avatar: the landmarks tracked while a
// signer recorded in the Data Lab (lib/sign-capture/landmarks.ts), turned
// into the engine's poses, one per video frame.
//
// - Arms: each wrist is placed from its own shoulder as the signer's was,
//   scaled from the signer's arm length to the avatar's, so a fully reached
//   arm stays fully reached; the elbow leans the way the signer's did.
// - Hands: orientation and every finger joint from the 21 tracked hand
//   points, measured in the engine's own hand model (hand.ts).
// - Face: the tracked expression weights, named as ARKit names them, drive
//   the avatar's face shapes directly.
// - Head: turn, nod and tilt from the ears and nose, measured from the way
//   the signer usually faced through the take.
//
// Tracking jitters, so every track is smoothed over a few frames. Only a
// hand in view signs: a side whose hand isn't tracked rests, even where the
// body tracker still places its arm. A hand lost for a moment, as tracking
// flickers, keeps its last pose.

type Triple = readonly [number, number, number];
export type Side = "left" | "right";
export type HandShape = Pick<HandPose, "quat" | "joints">;

/** Frames either side averaged to smooth the hands and arms, and the head
 * and face. At 30 frames a second, a few hundredths of a second. */
const SMOOTH_HANDS = 2;
const SMOOTH_FACE = 1;
/** How long a hand lost from tracking keeps signing, in seconds: long
 * enough to ride over a flicker, short enough that a hand leaving the view
 * goes to rest. */
export const HOLD = 0.3;
/** Below this, a pose point is a guess, left out of the arm's length. */
const VISIBLE = 0.5;
export const HEAD_LIMIT = 0.6;

// MediaPipe's pose points.
const POSE = {
  nose: 0,
  ear: { left: 7, right: 8 },
  shoulder: { left: 11, right: 12 },
  elbow: { left: 13, right: 14 },
  wrist: { left: 15, right: 16 },
} as const;

// MediaPipe's hand points: the wrist, the thumb from its base, then each
// finger from its knuckle.
const WRIST = 0;
const THUMB_POINTS = [1, 2, 3, 4];
const FINGER_POINTS = [
  [5, 6, 7, 8],
  [9, 10, 11, 12],
  [13, 14, 15, 16],
  [17, 18, 19, 20],
];

const clamp = (x: number, lo: number, hi: number) => Math.min(Math.max(x, lo), hi);

/** MediaPipe's axes (x to the image's right, which is the signer's left; y
 * down; z away from the camera) to the engine's (x to the signer's left, y
 * up, z toward the viewer), mirrored for the right hand's frame. */
const toEngine = ([x, y, z]: Triple, side: Side = "left") =>
  new Vector3(side === "right" ? -x : x, -y, -z);

const basis = (a: Vector3, b: Vector3) => {
  const x = a.clone().normalize();
  const z = new Vector3().crossVectors(x, b);
  if (z.lengthSq() < 1e-10) return null;
  z.normalize();
  const y = new Vector3().crossVectors(z, x);
  return new Matrix4().makeBasis(x, y, z);
};

// The engine's hand at rest, in its own frame: wrist to middle knuckle, and
// across the knuckles from little finger to index. A tracked hand's
// orientation is the turn from these to the same two lines on the signer.
const REST_FRAME = basis(
  new Vector3(...FINGERS[1].base),
  new Vector3(...FINGERS[0].base).sub(new Vector3(...FINGERS[3].base)),
)!;

const signedAngle = (a: Vector3, b: Vector3, axis: Vector3) =>
  Math.atan2(new Vector3().crossVectors(a, b).dot(axis), a.dot(b));

/** The engine's hand orientation and joint angles for 21 tracked hand
 * points (MediaPipe's order, MediaPipe's axes) of the signer's hand on
 * `side`, or null when the points are too flattened to orient. */
export function retargetHand(points: readonly Triple[], side: Side): Pick<HandPose, "quat" | "joints"> | null {
  if (points.length < 21) return null;
  const p = points.map((q) => toEngine(q, side));
  const measured = basis(p[9].clone().sub(p[WRIST]), p[5].clone().sub(p[17]));
  if (!measured) return null;
  const turn = measured.multiply(REST_FRAME.clone().transpose());
  const quat = new Quaternion().setFromRotationMatrix(turn);
  const back = quat.clone().invert();
  // Each point in the hand's own frame.
  const local = p.map((q) => q.clone().sub(p[WRIST]).applyQuaternion(back));
  const seg = (a: number, b: number) => local[b].clone().sub(local[a]).normalize();

  const joints: number[] = [];
  for (const [knuckle, middle, end, tip] of FINGER_POINTS) {
    const d1 = seg(knuckle, middle);
    const d2 = seg(middle, end);
    const d3 = seg(end, tip);
    // The first bone is the rest direction (+y) bent toward the palm (+z),
    // then spread toward the thumb (-x).
    const base = Math.asin(clamp(d1.z, -1, 1));
    const spread = Math.atan2(-d1.x, d1.y);
    // Later joints bend about the finger's own sideways axis.
    const axis = new Vector3(Math.cos(spread), Math.sin(spread), 0);
    joints.push(
      clamp(spread, -0.6, 0.6),
      clamp(base, -0.4, 1.9),
      clamp(signedAngle(d1, d2, axis), -0.3, 2),
      clamp(signedAngle(d2, d3, axis), -0.3, 1.6),
    );
  }
  joints.push(...thumbJoints(seg(THUMB_POINTS[0], THUMB_POINTS[1]), seg(THUMB_POINTS[1], THUMB_POINTS[2]), seg(THUMB_POINTS[2], THUMB_POINTS[3])));
  return { quat: [quat.x, quat.y, quat.z, quat.w], joints };
}

/** The thumb's [tilt, opposition, base, middle, tip]. The engine turns its
 * first bone by a YZX Euler (hand.ts: thumbBaseEuler); the bone's direction
 * and the axis its later joints bend about give that whole turn. A straight
 * thumb has no bend axis to read, so it is taken as unbent at the base. */
function thumbJoints(d1: Vector3, d2: Vector3, d3: Vector3): number[] {
  const bend12 = new Vector3().crossVectors(d1, d2);
  const bend23 = new Vector3().crossVectors(d2, d3);
  let axis = bend12.length() > 0.05 ? bend12 : bend23.length() > 0.05 ? bend23 : null;
  // The axis must be across the first bone; measured from the tip joint it
  // is only nearly so.
  if (axis) {
    axis = axis.clone().addScaledVector(d1, -axis.dot(d1));
    if (axis.lengthSq() < 1e-6) axis = null;
  }

  let euler: Euler;
  if (axis) {
    const x = axis.normalize();
    const z = new Vector3().crossVectors(x, d1);
    euler = new Euler().setFromRotationMatrix(new Matrix4().makeBasis(x, d1, z), "YZX");
  } else {
    // Unbent at the base: the first bone is (0, 1, 0) leaned about z, then
    // swung about y.
    const lean = Math.acos(clamp(d1.y, -1, 1));
    euler = new Euler(0, Math.atan2(d1.z, -d1.x), lean, "YZX");
    if (lean < 1e-4) euler.y = 0;
  }
  const along = axis ?? new Vector3(1, 0, 0).applyEuler(euler);
  return [
    clamp(euler.z - THUMB.lean, -1, 1.5),
    clamp(euler.y, -0.6, 1.8),
    clamp(euler.x, -0.6, 1.2),
    clamp(signedAngle(d1, d2, along), -0.4, 1.4),
    clamp(signedAngle(d2, d3, along), -0.4, 1.4),
  ];
}

export const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

const visible = (frame: LandmarkFrame, i: number) => (frame.pose?.[i]?.[3] ?? 0) >= VISIBLE;

/** The signer's arm lengths in a frame, shoulder to elbow to wrist, for
 * each arm fully in view. */
export function armLengths(f: LandmarkFrame): number[] {
  const world = f.poseWorld;
  if (!world) return [];
  return (["left", "right"] as const).flatMap((side) => {
    const [s, e, w] = [POSE.shoulder[side], POSE.elbow[side], POSE.wrist[side]];
    if (![s, e, w].every((i) => visible(f, i))) return [];
    const [ps, pe, pw] = [s, e, w].map((i) => toEngine(world[i]));
    return [ps.distanceTo(pe) + pe.distanceTo(pw)];
  });
}

/** How much to scale the signer's reach to the avatar's arm, from their
 * arm lengths: 1 when none were seen. */
export function armScale(lengths: number[], body: Body): number {
  const signer = median(lengths);
  return signer ? (body.upperArm + body.forearm) / signer : 1;
}

/** The hand points of a side in a frame, in metres where tracked so. */
export function handPoints(frame: LandmarkFrame, side: Side, video: LandmarksFile["video"]): Triple[] | null {
  const world = side === "left" ? frame.leftWorld : frame.rightWorld;
  if (world?.length) return world;
  const image = side === "left" ? frame.left : frame.right;
  // Image points are fractions of the frame: back to pixels, so directions
  // keep their true angles. Only directions are read from a hand.
  return image?.length ? image.map(([x, y, z]) => [x * video.width, y * video.height, z * video.width] as Triple) : null;
}

/** A side's hand shape tracked in a frame, or null. */
export function handShape(f: LandmarkFrame, side: Side, video: LandmarksFile["video"]): HandShape | null {
  const points = handPoints(f, side, video);
  return points ? retargetHand(points, side) : null;
}

/**
 * A side's hand in a frame. While the hand is in view (`seen`: tracked now,
 * or a moment ago) and the frame has a pose, the arm reaches from its own
 * shoulder as the signer's did, scaled to the avatar, with `shape` (or a
 * resting one). Otherwise the hand rests.
 */
export function handPose(
  f: LandmarkFrame,
  side: Side,
  body: Body,
  scale: number,
  shape: HandShape | null,
  seen: boolean,
): HandPose {
  const rest = restHand(body);
  const world = f.poseWorld;
  if (!world || !seen) return rest;
  const shoulder = toEngine(world[POSE.shoulder[side]], side);
  const wrist = toEngine(world[POSE.wrist[side]], side).sub(shoulder).multiplyScalar(scale).add(new Vector3(...body.shoulder));
  const lean = toEngine(world[POSE.elbow[side]], side).sub(shoulder);
  const elbow: Vec3 = lean.lengthSq() > 1e-6 ? (lean.normalize().toArray() as Vec3) : DEFAULT_ELBOW;
  const { quat, joints } = shape ?? rest;
  return { wrist: wrist.toArray() as Vec3, elbow, quat, joints };
}

/** One side's hand through the take: signing while its hand is in view,
 * held through brief losses, at rest otherwise. */
function trackSide(file: LandmarksFile, side: Side, body: Body, scale: number): HandPose[] {
  const { frames } = file;
  const shapes = frames.map((f) => handShape(f, side, file.video));

  // Fill brief losses from the nearest tracked shape, before or after.
  const filled = shapes.map((shape, i) => {
    if (shape) return shape;
    const t = frames[i].t;
    let best: { shape: HandShape; gap: number } | null = null;
    for (const step of [-1, 1]) {
      for (let j = i + step; j >= 0 && j < frames.length; j += step) {
        const gap = Math.abs(frames[j].t - t);
        if (gap > HOLD) break;
        const found = shapes[j];
        if (found) {
          if (!best || gap < best.gap) best = { shape: found, gap };
          break;
        }
      }
    }
    return best?.shape ?? null;
  });

  return frames.map((f, i) => handPose(f, side, body, scale, filled[i], !!filled[i]));
}

/** Averages each value over the frames either side. */
function smooth(series: number[][], radius: number): number[][] {
  return series.map((_, i) => {
    const lo = Math.max(0, i - radius);
    const hi = Math.min(series.length - 1, i + radius);
    const out = series[i].map(() => 0);
    for (let j = lo; j <= hi; j++) series[j].forEach((v, k) => (out[k] += v));
    return out.map((v) => v / (hi - lo + 1));
  });
}

function smoothHands(hands: HandPose[]): HandPose[] {
  // Quaternions are averaged on the same side of the sphere as the frame's own.
  const quats = hands.map((h) => new Quaternion(...h.quat));
  const series = hands.map((h, i) => {
    const q = quats[i];
    const prev = i > 0 ? quats[i - 1] : q;
    if (q.dot(prev) < 0) q.set(-q.x, -q.y, -q.z, -q.w);
    return [...h.wrist, ...h.elbow, q.x, q.y, q.z, q.w, ...h.joints];
  });
  return smooth(series, SMOOTH_HANDS).map((v) => {
    const q = new Quaternion(v[6], v[7], v[8], v[9]).normalize();
    const elbow = new Vector3(v[3], v[4], v[5]);
    return {
      wrist: [v[0], v[1], v[2]],
      elbow: (elbow.lengthSq() > 1e-6 ? elbow.normalize().toArray() : DEFAULT_ELBOW) as Vec3,
      quat: [q.x, q.y, q.z, q.w] as Quat,
      joints: v.slice(10),
    };
  });
}

/** Turn, nod and tilt in each frame, before calibration; null without a pose. */
export function headAngles(f: LandmarkFrame): [turn: number, nod: number, tilt: number] | null {
  if (!f.poseWorld) return null;
  const left = toEngine(f.poseWorld[POSE.ear.left]);
  const right = toEngine(f.poseWorld[POSE.ear.right]);
  const nose = toEngine(f.poseWorld[POSE.nose]);
  const across = left.clone().sub(right);
  const toNose = nose.sub(left.add(right).multiplyScalar(0.5));
  return [
    Math.atan2(-across.z, across.x),
    Math.atan2(-toNose.y, Math.hypot(toNose.x, toNose.z)),
    Math.atan2(across.y, Math.hypot(across.x, across.z)),
  ];
}

function trackHead(frames: LandmarkFrame[]): HeadPose[] {
  const raw = frames.map(headAngles);
  const present = raw.filter((a): a is [number, number, number] => !!a);
  const neutral = [0, 1, 2].map((k) => median(present.map((a) => a[k])) ?? 0);
  const series = raw.map((a) => (a ? a.map((v, k) => clamp(v - neutral[k], -HEAD_LIMIT, HEAD_LIMIT)) : [0, 0, 0]));
  return smooth(series, SMOOTH_FACE).map(([turn, nod, tilt]) => ({ turn, nod, tilt }));
}

function trackFace(file: LandmarksFile): FacePose[] {
  const names = file.blendshapes;
  let last = names.map(() => 0);
  const series = file.frames.map((f) => {
    if (f.face && f.face.length === names.length) last = f.face;
    return last;
  });
  return smooth(series, SMOOTH_FACE).map((weights) => facePose(names, weights));
}

/** A face from tracked weights, by name: the shapes themselves, and the
 * engine's own brows and mouth read from them. */
export function facePose(names: string[], weights: readonly number[]): FacePose {
  const shapes = Object.fromEntries(names.map((n, i) => [n, weights[i] ?? 0]));
  const w = (n: string) => shapes[n] ?? 0;
  const brows = clamp(w("browInnerUp") - (w("browDownLeft") + w("browDownRight")) / 2, -1, 1);
  return {
    ...faceFor("rest", brows),
    open: w("jawOpen"),
    wide: (w("mouthSmileLeft") + w("mouthSmileRight")) / 2,
    round: w("mouthPucker"),
    shapes,
  };
}

/** A recorded take as a timeline the avatar plays, fitted to its body. */
export function replayTimeline(file: LandmarksFile, body: Body = DEFAULT_BODY): Timeline {
  const { frames } = file;
  if (!frames.length) {
    const hand = restHand(body);
    const pose: Pose = { r: hand, l: hand, face: faceFor("rest", 0), head: { nod: 0, turn: 0, tilt: 0 } };
    return { duration: 0, frames: [{ t: 0, pose, flow: true }], items: [], mouth: [] };
  }

  const scale = armScale(frames.flatMap(armLengths), body);
  // The engine's r is the dominant hand, which it signs on the avatar's
  // right: the signer's own right hand.
  const r = smoothHands(trackSide(file, "right", body, scale));
  const l = smoothHands(trackSide(file, "left", body, scale));
  const head = trackHead(frames);
  const face = trackFace(file);

  return {
    duration: frames[frames.length - 1].t,
    frames: frames.map((f, i) => ({
      t: f.t,
      pose: { r: r[i], l: l[i], face: face[i], head: head[i] },
      // Frames are close together: the avatar moves straight between them.
      flow: true,
    })),
    items: [],
    mouth: [],
  };
}
