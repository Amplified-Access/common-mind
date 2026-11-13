import { Vector3 } from "three";
import { describe, expect, it } from "vitest";

import { spellFrames } from "./alphabet";
import { type Body, DEFAULT_BODY, DEFAULT_LANDMARKS, bodyFrom } from "./body";
import { LEXICON } from "./lexicon";
import { planSigns } from "./plan";
import { REST_HAND, resolveHand } from "./resolve";
import { activeItem, buildTimeline, samplePose } from "./timeline";
import type { HandSpec, Keyframe } from "./types";

const near = (a: readonly number[], b: readonly number[]) =>
  a.forEach((v, i) => expect(v).toBeCloseTo(b[i], 5));

describe("buildTimeline", () => {
  it("starts and ends with the hands at rest", () => {
    const tl = buildTimeline(planSigns("hello friend"));
    near(samplePose(tl, 0).r.wrist, REST_HAND.wrist);
    near(samplePose(tl, tl.duration).r.wrist, REST_HAND.wrist);
    near(samplePose(tl, tl.duration).l.wrist, REST_HAND.wrist);
  });

  it("gives each item its own span, in order", () => {
    const tl = buildTimeline(planSigns("hello my name grace"));
    expect(tl.items.map((i) => i.gloss)).toEqual(["HELLO", "MY", "NAME", "fs-GRACE"]);
    tl.items.forEach((item, i) => {
      expect(item.end).toBeGreaterThan(item.start);
      if (i > 0) expect(item.start).toBeGreaterThanOrEqual(tl.items[i - 1].end);
      expect(activeItem(tl, (item.start + item.end) / 2)).toBe(i);
    });
    expect(activeItem(tl, 0)).toBe(-1);
    expect(activeItem(tl, tl.duration)).toBe(-1);
  });

  it("holds each sign's written pose", () => {
    const tl = buildTimeline(planSigns("hello"));
    const hello = LEXICON.find((s) => s.gloss === "HELLO")!;
    const first = resolveHand(hello.frames[0].r as HandSpec);
    // The first frame is reached at the item's start plus its duration.
    const t = tl.items[0].start + (hello.frames[0].dur ?? 0) + 0.01;
    near(samplePose(tl, t).r.wrist, first.wrist);
  });

  it("raises the brows through a yes/no question and furrows them for wh", () => {
    const yn = buildTimeline(planSigns("Are you deaf?"));
    const wh = buildTimeline(planSigns("Where is home?"));
    const mid = (tl: typeof yn) => (tl.items[0].start + tl.items.at(-1)!.end) / 2;
    expect(samplePose(yn, mid(yn)).face.brows).toBeGreaterThan(0.5);
    expect(samplePose(wh, mid(wh)).face.brows).toBeLessThan(-0.5);
    expect(samplePose(buildTimeline(planSigns("I am deaf")), 1).face.brows).toBe(0);
  });

  it("shakes the head through a negating sign", () => {
    const tl = buildTimeline(planSigns("not"));
    const { start, end } = tl.items[0];
    const turns = Array.from({ length: 20 }, (_, i) => samplePose(tl, start + ((end - start) * i) / 20).head.turn);
    expect(Math.max(...turns)).toBeGreaterThan(0.1);
    expect(Math.min(...turns)).toBeLessThan(-0.1);
  });

  it("places the hands on the body it is given", () => {
    // A taller signer with a lower chin: CHIN-located signs follow it.
    const tall: Body = bodyFrom({
      ...DEFAULT_LANDMARKS,
      points: { ...DEFAULT_LANDMARKS.points, chin: [0, 0.7, 0.09] },
    });
    const at = (body: Body) => {
      const tl = buildTimeline(planSigns("thank you"), body);
      return samplePose(tl, tl.items[0].start + 0.4).r.wrist;
    };
    const shift = at(tall)[1] - at(DEFAULT_BODY)[1];
    expect(shift).toBeCloseTo(0.7 - DEFAULT_BODY.anchors.chin[1], 5);
  });

  it("is empty for an empty plan", () => {
    const tl = buildTimeline(planSigns(""));
    expect(tl.items).toEqual([]);
    near(samplePose(tl, 0).r.wrist, REST_HAND.wrist);
  });
});

// Every written sign must resolve, and stay within the arm's reach, so a
// typo in the lexicon fails here instead of on screen.
describe("the written signs", () => {
  const { shoulder, upperArm, forearm } = DEFAULT_BODY;
  const reach = upperArm + forearm + 0.02;
  const check = (label: string, frames: Keyframe[]) => {
    let r: HandSpec = {};
    let l: HandSpec = {};
    for (const f of frames) {
      if (f.r && f.r !== "rest") r = { ...r, ...f.r };
      if (f.l && f.l !== "rest") l = { ...l, ...f.l };
      for (const spec of [f.r && r, f.l && l]) {
        if (!spec) continue;
        const pose = resolveHand(spec);
        const d = new Vector3(...pose.wrist).distanceTo(new Vector3(...shoulder));
        expect(d, `${label} reaches ${d.toFixed(3)}m`).toBeLessThan(reach);
      }
    }
  };

  it.each(LEXICON.map((s) => [s.gloss, s.frames] as const))("%s resolves", check);

  it.each("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split(""))("letter %s resolves", (ch) => {
    const frames = spellFrames(ch, 0);
    expect(frames.length).toBeGreaterThan(0);
    check(ch, frames);
  });

  it("gives every word one sign", () => {
    const words = LEXICON.flatMap((s) => s.words);
    expect(words.length).toBe(new Set(words).size);
  });
});
