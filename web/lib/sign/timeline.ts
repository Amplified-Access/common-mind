import { Quaternion } from "three";

import { spellFrames } from "./alphabet";
import type { Plan } from "./plan";
import { REST_HAND, faceFor, resolveHand } from "./resolve";
import type { FacePose, HandPose, HandSpec, HeadPose, Keyframe, Pose } from "./types";

// A plan laid out in time: a list of poses the avatar eases between, and the
// span each sign takes for the captions to follow.

/** The least time to travel from one sign into the next, at 1x. */
const TRANSITION = 0.3;
const LEAD_IN = 0.25;
const LEAD_OUT = 0.45;
const SETTLE = 0.25;
const DEFAULT_DUR = 0.3;
const DEFAULT_HOLD = 0.08;
/** A yes/no question holds its last sign, brows up, a moment longer. */
const QUESTION_HOLD = 0.25;

export type TimelineItem = {
  gloss: string;
  word: string;
  start: number;
  end: number;
  negates: boolean;
};

type Frame = { t: number; pose: Pose; flow: boolean };

export type Timeline = { duration: number; frames: Frame[]; items: TimelineItem[] };

const NEUTRAL_HEAD: HeadPose = { nod: 0, turn: 0, tilt: 0 };

export const REST_POSE: Pose = {
  r: REST_HAND,
  l: REST_HAND,
  face: faceFor("rest", 0),
  head: NEUTRAL_HEAD,
};

export function buildTimeline(plan: Plan): Timeline {
  const frames: Frame[] = [{ t: 0, pose: REST_POSE, flow: false }];
  const items: TimelineItem[] = [];
  let t = LEAD_IN;
  frames.push({ t, pose: REST_POSE, flow: false });

  const brows = plan.mood === "wh-question" ? -0.85 : plan.mood === "yn-question" ? 0.9 : 0;
  const lean: HeadPose =
    plan.mood === "yn-question"
      ? { nod: 0.1, turn: 0, tilt: 0 }
      : plan.mood === "wh-question"
        ? { nod: 0.04, turn: 0, tilt: 0.07 }
        : NEUTRAL_HEAD;

  for (const item of plan.items) {
    const keyframes: Keyframe[] =
      item.kind === "sign"
        ? item.sign.frames
        : item.chars.flatMap((c, i) => spellFrames(c, i, item.chars[i - 1]));
    const start = t;
    let rSpec: HandSpec = {};
    let lSpec: HandSpec = {};
    let r: HandPose = frames.at(-1)!.pose.r;
    let l: HandPose = REST_HAND;

    keyframes.forEach((kf, j) => {
      if (kf.r === "rest") r = REST_HAND;
      else if (kf.r) r = resolveHand((rSpec = { ...rSpec, ...kf.r }));

      if (kf.l === "rest") l = REST_HAND;
      else if (kf.l) l = resolveHand((lSpec = { ...lSpec, ...kf.l }));

      const dur = kf.dur ?? DEFAULT_DUR;
      t += j === 0 ? Math.max(dur, TRANSITION) : dur;
      const pose: Pose = {
        r,
        l,
        face: faceFor(kf.mouth, kf.brows ?? brows),
        head: {
          nod: (kf.head?.nod ?? 0) + lean.nod,
          turn: (kf.head?.turn ?? 0) + lean.turn,
          tilt: (kf.head?.tilt ?? 0) + lean.tilt,
        },
      };
      frames.push({ t, pose, flow: !!kf.flow });

      const hold = kf.hold ?? DEFAULT_HOLD;
      if (hold > 0) {
        t += hold;
        frames.push({ t, pose, flow: false });
      }
    });

    items.push({
      gloss: item.gloss,
      word: item.word,
      start,
      end: t,
      negates: item.kind === "sign" && !!item.sign.negates,
    });
  }

  if (plan.mood === "yn-question" && items.length > 0) {
    t += QUESTION_HOLD;
    frames.push({ t, pose: frames.at(-1)!.pose, flow: false });
  }

  if (items.length > 0) {
    t += LEAD_OUT;
    frames.push({ t, pose: REST_POSE, flow: false });
    t += SETTLE;
    frames.push({ t, pose: REST_POSE, flow: false });
  }

  return { duration: t, frames, items };
}

/** The item being signed at a time, or -1 between and around them. */
export function activeItem(tl: Timeline, t: number): number {
  return tl.items.findIndex((item) => t >= item.start && t < item.end);
}

const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const lerpAll = <T extends readonly number[]>(a: T, b: T, u: number) =>
  a.map((v, i) => lerp(v, b[i], u)) as unknown as T;

const qa = new Quaternion();
const qb = new Quaternion();

function lerpHand(a: HandPose, b: HandPose, u: number): HandPose {
  qa.set(...a.quat);
  qb.set(...b.quat);
  qa.slerp(qb, u);
  return {
    wrist: lerpAll(a.wrist, b.wrist, u),
    quat: [qa.x, qa.y, qa.z, qa.w],
    joints: lerpAll(a.joints, b.joints, u),
    elbow: lerpAll(a.elbow, b.elbow, u),
  };
}

const lerpFace = (a: FacePose, b: FacePose, u: number): FacePose => ({
  brows: lerp(a.brows, b.brows, u),
  open: lerp(a.open, b.open, u),
  wide: lerp(a.wide, b.wide, u),
  round: lerp(a.round, b.round, u),
});

/** How far along a move is, eased: to a stop and from a standstill, unless a
 * frame is one the hand flows through. */
function ease(u: number, fromFlow: boolean, toFlow: boolean): number {
  if (fromFlow && toFlow) return u;
  if (fromFlow) return 1 - (1 - u) * (1 - u);
  if (toFlow) return u * u;
  return u * u * (3 - 2 * u);
}

export function samplePose(tl: Timeline, time: number): Pose {
  const { frames } = tl;
  const t = Math.min(Math.max(time, 0), tl.duration);

  // The last frame at or before t.
  let lo = 0;
  let hi = frames.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (frames[mid].t <= t) lo = mid;
    else hi = mid - 1;
  }
  const a = frames[lo];
  const b = frames[Math.min(lo + 1, frames.length - 1)];
  const span = b.t - a.t;
  const u = span > 0 ? ease((t - a.t) / span, a.flow, b.flow) : 0;

  const head = {
    nod: lerp(a.pose.head.nod, b.pose.head.nod, u),
    turn: lerp(a.pose.head.turn, b.pose.head.turn, u),
    tilt: lerp(a.pose.head.tilt, b.pose.head.tilt, u),
  };

  // A negating sign carries a head shake, swelling and fading over the sign.
  for (const item of tl.items) {
    if (!item.negates || t < item.start || t >= item.end) continue;
    const local = t - item.start;
    const envelope = Math.sin((Math.PI * local) / (item.end - item.start));
    head.turn += 0.26 * Math.sin(2 * Math.PI * 2.2 * local) * envelope;
  }

  return {
    r: lerpHand(a.pose.r, b.pose.r, u),
    l: lerpHand(a.pose.l, b.pose.l, u),
    face: lerpFace(a.pose.face, b.pose.face, u),
    head,
  };
}
