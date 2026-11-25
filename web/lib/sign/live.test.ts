import { Vector3 } from "three";
import { describe, expect, it } from "vitest";

import type { LandmarkFrame } from "@/lib/sign-capture/landmarks";

import { DEFAULT_BODY } from "./body";
import { jointsFor } from "./hand";
import { createLiveRetarget } from "./live";
import { planSigns } from "./plan";
import { filmTimeline } from "./replay.fixtures";
import { REST_HAND } from "./resolve";
import { buildTimeline, samplePose } from "./timeline";

const VIDEO = { width: 1280, height: 720 };

describe("createLiveRetarget", () => {
  it("follows signing as it is tracked, a frame at a time, close behind", () => {
    const signed = buildTimeline(planSigns("hello my name grace thank you"));
    const filmed = filmTimeline(signed);
    const live = createLiveRetarget();

    let error = 0;
    let fingers = 0;
    let samples = 0;
    for (const frame of filmed.frames) {
      const pose = live.update(frame, [], VIDEO, DEFAULT_BODY);
      const want = samplePose(signed, frame.t);
      for (const side of ["r", "l"] as const) {
        error += new Vector3(...pose[side].wrist).distanceTo(new Vector3(...want[side].wrist));
        fingers += pose[side].joints.slice(0, 16).reduce((sum, a, i) => sum + Math.abs(a - want[side].joints[i]), 0) / 16;
        samples++;
      }
    }
    // Live smoothing only looks back, so it trails fast moves a little.
    expect(error / samples).toBeLessThan(0.02);
    expect(fingers / samples).toBeLessThan(0.08);
  });

  it("eases a hand that leaves the view down to rest, without a jump", () => {
    const signed = buildTimeline(planSigns("hello"));
    const raised = filmTimeline(signed).frames.find((f) => f.t >= 1.4)!;
    const live = createLiveRetarget();
    const up = live.update(raised, [], VIDEO, DEFAULT_BODY).r.wrist;
    for (let i = 1; i <= 3; i++) live.update({ ...raised, t: raised.t + i / 30 }, [], VIDEO, DEFAULT_BODY);

    // The hand goes out of view: no hands, the wrist barely visible.
    const gone = (t: number): LandmarkFrame => ({
      ...raised,
      t,
      pose: raised.pose!.map(([x, y, z]) => [x, y, z, 0.1]),
      left: null,
      leftWorld: null,
      right: null,
      rightWorld: null,
    });
    const next = live.update(gone(raised.t + 4 / 30), [], VIDEO, DEFAULT_BODY).r.wrist;
    const step = new Vector3(...next).distanceTo(new Vector3(...up));
    const whole = new Vector3(...REST_HAND.wrist).distanceTo(new Vector3(...up));
    expect(step).toBeGreaterThan(0);
    expect(step).toBeLessThan(whole * 0.6);

    let pose = live.update(gone(raised.t + 5 / 30), [], VIDEO, DEFAULT_BODY);
    for (let i = 6; i < 40; i++) pose = live.update(gone(raised.t + i / 30), [], VIDEO, DEFAULT_BODY);
    pose.r.wrist.forEach((v, i) => expect(v).toBeCloseTo(REST_HAND.wrist[i], 2));
  });

  it("keeps the handshape through a brief loss of the hand", () => {
    const signed = buildTimeline(planSigns("hello"));
    const frames = filmTimeline(signed).frames.filter((f) => f.t >= 1.2 && f.t <= 1.6);
    const live = createLiveRetarget();
    for (const f of frames.slice(0, 6)) live.update(f, [], VIDEO, DEFAULT_BODY);
    const lost = { ...frames[6], right: null, rightWorld: null };
    const pose = live.update(lost, [], VIDEO, DEFAULT_BODY);
    pose.r.joints.slice(0, 16).forEach((a, i) => expect(a).toBeCloseTo(jointsFor("B")[i], 1));
  });

  it("carries the face's tracked weights", () => {
    const signed = buildTimeline(planSigns("hello"));
    const frame = { ...filmTimeline(signed).frames[0], face: [0.9, 0.4] };
    const live = createLiveRetarget();
    let pose = live.update(frame, ["browInnerUp", "jawOpen"], VIDEO, DEFAULT_BODY);
    for (let i = 1; i < 20; i++) pose = live.update({ ...frame, t: i / 30 }, ["browInnerUp", "jawOpen"], VIDEO, DEFAULT_BODY);
    expect(pose.face.shapes?.browInnerUp).toBeCloseTo(0.9, 2);
    expect(pose.face.shapes?.jawOpen).toBeCloseTo(0.4, 2);
  });
});
