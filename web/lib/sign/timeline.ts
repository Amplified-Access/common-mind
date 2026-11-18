import { Quaternion } from "three";

import { spellFrames } from "./alphabet";
import type { Plan } from "./plan";
import { type Body, DEFAULT_BODY } from "./body";
import { type Viseme, isVowel, visemesFor } from "./mouthing";
import { faceFor, resolveHand, restHand } from "./resolve";
import type { FacePose, HandPose, HandSpec, HeadPose, Keyframe, Pose } from "./types";

// A plan laid out in time: a list of poses the avatar eases between, and the
// span each sign takes for the captions to follow.

/** The least time to travel from one sign into the next, at 1x. */
const TRANSITION = 0.4;
/** The least time the end of a sign is held, so it can be read before the
 * hands move on. */
const SIGN_HOLD = 0.22;
const LEAD_IN = 0.25;
const LEAD_OUT = 0.45;
const SETTLE = 0.25;
const DEFAULT_DUR = 0.3;
const DEFAULT_HOLD = 0.08;
/** Seconds the hands hold still at a comma, and at the end of a sentence. */
const PAUSE = { phrase: 0.3, sentence: 0.6 } as const;
/** A yes/no question holds its last sign, brows up, a moment longer. */
const QUESTION_HOLD = 0.25;
/** Seconds a consonant is mouthed at 1x; a vowel a little longer. */
const SOUND = 0.075;
const VOWEL = 1.6;
/** How far a hand bows forward moving between signs, for each metre it
 * travels, and at most. */
const ARC = 0.25;
const ARC_MAX = 0.06;
/** How far through the move between signs the next handshape is formed. */
const PRESHAPE = 0.7;

export type TimelineItem = {
  gloss: string;
  word: string;
  start: number;
  end: number;
  negates: boolean;
};

/** A pose at a time. `enter` marks the first pose of a sign, or the rest
 * after the last: the hands travel there between signs. */
type Frame = { t: number; pose: Pose; flow: boolean; enter?: boolean };

/** A mouth shape starting at a time; null closes the mouth. */
type Sound = { t: number; viseme: Viseme | null };

export type Timeline = { duration: number; frames: Frame[]; items: TimelineItem[]; mouth: Sound[] };

const NEUTRAL_HEAD: HeadPose = { nod: 0, turn: 0, tilt: 0 };

/** Standing at rest, hands down, face neutral. */
export function restPose(body: Body = DEFAULT_BODY): Pose {
  const hand = restHand(body);
  return { r: hand, l: hand, face: faceFor("rest", 0), head: NEUTRAL_HEAD };
}

export const REST_POSE: Pose = restPose();

/** Lays a plan out in time, with every hand placed on the given body. */
export function buildTimeline(plan: Plan, body: Body = DEFAULT_BODY): Timeline {
  const REST = restPose(body);
  const frames: Frame[] = [{ t: 0, pose: REST, flow: false }];
  const items: TimelineItem[] = [];
  const mouth: Sound[] = [];
  let t = LEAD_IN;
  frames.push({ t, pose: REST, flow: false });

  const brows = plan.mood === "wh-question" ? -0.85 : plan.mood === "yn-question" ? 0.9 : 0;
  const lean: HeadPose =
    plan.mood === "yn-question"
      ? { nod: 0.1, turn: 0, tilt: 0 }
      : plan.mood === "wh-question"
        ? { nod: 0.04, turn: 0, tilt: 0.07 }
        : NEUTRAL_HEAD;

  plan.items.forEach((item, n) => {
    // The hands rest where the last sign left them through a pause.
    const before = plan.items[n - 1]?.pause;
    if (before) {
      t += PAUSE[before];
      frames.push({ t, pose: frames.at(-1)!.pose, flow: false });
    }

    const keyframes: Keyframe[] =
      item.kind === "sign"
        ? item.sign.frames
        : item.chars.flatMap((c, i) => spellFrames(c, i, item.chars[i - 1], plan.language.alphabet));
    const start = t;
    let rSpec: HandSpec = {};
    let lSpec: HandSpec = {};
    let r: HandPose = frames.at(-1)!.pose.r;
    let l: HandPose = REST.l;

    keyframes.forEach((kf, j) => {
      if (kf.r === "rest") r = REST.r;
      else if (kf.r) r = resolveHand((rSpec = { ...rSpec, ...kf.r }), body);

      if (kf.l === "rest") l = REST.l;
      else if (kf.l) l = resolveHand((lSpec = { ...lSpec, ...kf.l }), body);

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
      frames.push({ t, pose, flow: !!kf.flow, enter: j === 0 });

      const last = j === keyframes.length - 1;
      const hold = Math.max(kf.hold ?? DEFAULT_HOLD, last ? SIGN_HOLD : 0);
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
    mouth.push(...mouthWord(item.word, start + Math.max(keyframes[0]?.dur ?? DEFAULT_DUR, TRANSITION) * 0.6, t));
  });

  if (plan.mood === "yn-question" && items.length > 0) {
    t += QUESTION_HOLD;
    frames.push({ t, pose: frames.at(-1)!.pose, flow: false });
  }

  if (items.length > 0) {
    t += LEAD_OUT;
    frames.push({ t, pose: REST, flow: false, enter: true });
    t += SETTLE;
    frames.push({ t, pose: REST, flow: false });
  }

  return { duration: t, frames, items, mouth };
}

/** The sounds of a word, spread from when the hand is nearly there to the
 * end of the sign, quicker if the sign is short. */
function mouthWord(word: string, from: number, to: number): Sound[] {
  const visemes = word.split(/\s+/).flatMap(visemesFor);
  if (visemes.length === 0) return [];
  const weights = visemes.map((v) => (isVowel(v) ? VOWEL : 1));
  const total = weights.reduce((a, b) => a + b, 0) * SOUND;
  const scale = Math.min(1, (to - from) / total);
  const sounds: Sound[] = [];
  let t = from;
  visemes.forEach((viseme, i) => {
    sounds.push({ t, viseme });
    t += weights[i] * SOUND * scale;
  });
  sounds.push({ t, viseme: null });
  return sounds;
}

/** The mouth shapes at a time: the current one rising as the one before
 * falls, so sounds run into each other as in speech. */
function sampleMouth(mouth: Sound[], t: number): Partial<Record<Viseme, number>> | undefined {
  let i = -1;
  while (i + 1 < mouth.length && mouth[i + 1].t <= t) i++;
  if (i < 0) return undefined;
  const cur = mouth[i];
  const prev = mouth[i - 1];
  const next = mouth[i + 1]?.t ?? cur.t + 0.15;
  const u = Math.min(1, (t - cur.t) / Math.max(Math.min(0.07, (next - cur.t) * 0.6), 1e-3));
  const out: Partial<Record<Viseme, number>> = {};
  if (cur.viseme) out[cur.viseme] = u;
  if (prev?.viseme && u < 1 && cur.t - prev.t < 0.5) out[prev.viseme] = (out[prev.viseme] ?? 0) + (1 - u);
  return Object.keys(out).length > 0 ? out : undefined;
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
 * frame is one the hand flows through. A move from rest to rest follows the
 * minimum-jerk profile of a human reach. */
function ease(u: number, fromFlow: boolean, toFlow: boolean): number {
  if (fromFlow && toFlow) return u;
  if (fromFlow) return 1 - (1 - u) * (1 - u);
  if (toFlow) return u * u;
  return u * u * u * (10 - 15 * u + 6 * u * u);
}

/** A hand travelling between signs: bowing forward, clear of the body, on
 * the way, and shaping and turning for the next sign before it arrives. */
function travel(a: HandPose, b: HandPose, raw: number, u: number): HandPose {
  const ahead = ease(Math.min(raw / PRESHAPE, 1), false, false);
  const wrist = lerpAll(a.wrist, b.wrist, u);
  const distance = Math.hypot(...b.wrist.map((v, i) => v - a.wrist[i]));
  const bow = Math.min(distance * ARC, ARC_MAX) * Math.sin(Math.PI * u);
  qa.set(...a.quat);
  qb.set(...b.quat);
  qa.slerp(qb, ahead);
  return {
    wrist: [wrist[0], wrist[1], wrist[2] + bow],
    quat: [qa.x, qa.y, qa.z, qa.w],
    joints: lerpAll(a.joints, b.joints, ahead),
    elbow: lerpAll(a.elbow, b.elbow, u),
  };
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
  const raw = span > 0 ? (t - a.t) / span : 0;
  const u = ease(raw, a.flow, b.flow);

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
    r: b.enter ? travel(a.pose.r, b.pose.r, raw, u) : lerpHand(a.pose.r, b.pose.r, u),
    l: b.enter ? travel(a.pose.l, b.pose.l, raw, u) : lerpHand(a.pose.l, b.pose.l, u),
    face: { ...lerpFace(a.pose.face, b.pose.face, u), visemes: sampleMouth(tl.mouth, t) },
    head,
  };
}
