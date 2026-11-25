import { Quaternion, Vector3 } from "three";
import { describe, expect, it } from "vitest";

import type { LandmarkFrame, LandmarksFile } from "@/lib/sign-capture/landmarks";

import { DEFAULT_BODY } from "./body";
import { digitPoints, jointsFor, orientHand } from "./hand";
import { replayTimeline, retargetHand } from "./replay";
import { REST_HAND } from "./resolve";
import { samplePose } from "./timeline";

type Triple = [number, number, number];

// MediaPipe's world axes: x to the image's right (the signer's left), y down,
// z away from the camera. The engine's: x to the signer's left, y up, z
// toward the viewer.
const toMediaPipe = (v: Vector3): Triple => [v.x, -v.y, -v.z];

/** MediaPipe's 21 hand points for an engine hand with the given joints and
 * orientation, on the signer's side given. */
function mediaPipeHand(joints: number[], quat: Quaternion, side: "left" | "right"): Triple[] {
  const mirror = side === "right" ? -1 : 1;
  const world = (p: Vector3) => {
    const v = p.clone().applyQuaternion(quat);
    return toMediaPipe(new Vector3(v.x * mirror, v.y, v.z));
  };
  // Wrist; thumb CMC to tip; then index, middle, ring and pinky, knuckle to tip.
  const points = [new Vector3(0, 0, 0), ...digitPoints(4, joints), ...[0, 1, 2, 3].flatMap((d) => digitPoints(d, joints))];
  return points.map(world);
}

// A signer standing square to the camera, in MediaPipe world coordinates
// (metres from the middle of the hips).
const SHOULDER_L: Triple = [0.18, -0.5, 0];
const SHOULDER_R: Triple = [-0.18, -0.5, 0];

/** 33 pose points: shoulders, elbows, wrists and the head where the test
 * puts them, everything else at the hips. */
// Arms hang straight down, 0.28 m to the elbow and 0.25 m on to the wrist,
// the default avatar's own arm.
function pose({
  wristL = [0.18, 0.03, 0] as Triple,
  wristR = [-0.18, 0.03, 0] as Triple,
  elbowL = [0.18, -0.22, 0] as Triple,
  elbowR = [-0.18, -0.22, 0] as Triple,
  visibility = 1,
  turn = 0,
} = {}): { image: [number, number, number, number][]; world: Triple[] } {
  const world: Triple[] = Array.from({ length: 33 }, () => [0, 0, 0] as Triple);
  // The head turned by `turn` toward the signer's left.
  const ear = (x: number): Triple => [x * Math.cos(turn), -0.68, x * Math.sin(turn)];
  world[0] = [0.1 * Math.sin(turn), -0.66, -0.1 * Math.cos(turn)];
  world[7] = ear(0.075);
  world[8] = ear(-0.075);
  world[11] = SHOULDER_L;
  world[12] = SHOULDER_R;
  world[13] = elbowL;
  world[14] = elbowR;
  world[15] = wristL;
  world[16] = wristR;
  const image = world.map(([x, y, z]) => [x, y, z, visibility] as [number, number, number, number]);
  return { image, world };
}

const flat = orientHand(new Vector3(0, 1, 0), new Vector3(0, 0, 1));

function frame(t: number, opts: Partial<LandmarkFrame> & { body?: ReturnType<typeof pose> } = {}): LandmarkFrame {
  const body = opts.body ?? pose();
  return {
    t,
    pose: body.image,
    poseWorld: body.world,
    left: null,
    leftWorld: null,
    right: null,
    rightWorld: null,
    face: null,
    ...opts,
  };
}

const file = (frames: LandmarkFrame[], blendshapes: string[] = []): LandmarksFile => ({
  format: "commonmind.sign-landmarks",
  version: 1,
  tracker: "test",
  video: { width: 1280, height: 720 },
  blendshapes,
  frames,
});

describe("retargetHand", () => {
  it("recovers the engine's own hand: its orientation and every finger joint", () => {
    const quat = orientHand(new Vector3(0.3, 1, 0.4), new Vector3(0, -0.2, 1));
    for (const shape of ["B", "5", "A", "V", "C", "claw"]) {
      for (const side of ["left", "right"] as const) {
        const joints = jointsFor(shape);
        const hand = retargetHand(mediaPipeHand(joints, quat, side), side);
        expect(hand, `${shape} ${side}`).not.toBeNull();
        // The same orientation, either sign of the quaternion.
        const got = new Quaternion(...hand!.quat);
        expect(Math.abs(got.dot(quat)), `${shape} ${side} orientation`).toBeGreaterThan(0.999);
        hand!.joints.slice(0, 16).forEach((angle, i) => {
          expect(angle, `${shape} ${side} finger joint ${i}`).toBeCloseTo(joints[i], 2);
        });
      }
    }
  });

  it("puts the thumb tip where the signer's was, to within a centimetre", () => {
    for (const shape of ["B", "A", "L", "O", "Y"]) {
      const joints = jointsFor(shape);
      const hand = retargetHand(mediaPipeHand(joints, flat, "left"), "left")!;
      const want = digitPoints(4, joints)[3];
      const got = digitPoints(4, hand.joints)[3];
      expect(got.distanceTo(want), shape).toBeLessThan(0.01);
    }
  });

  it("gives up on a hand too flattened to orient", () => {
    const line: Triple[] = Array.from({ length: 21 }, (_, i) => [0, -i * 0.01, 0]);
    expect(retargetHand(line, "left")).toBeNull();
  });
});

describe("replayTimeline", () => {
  it("lasts as long as the take and plays a frame at each tracked time", () => {
    const tl = replayTimeline(file([frame(0), frame(0.5), frame(1.2)]));
    expect(tl.duration).toBeCloseTo(1.2, 5);
    expect(tl.frames.map((f) => f.t)).toEqual([0, 0.5, 1.2]);
    expect(tl.items).toEqual([]);
  });

  it("places a raised hand out from its own shoulder, as the signer held it", () => {
    // The right elbow out to the side, down and forward; the forearm in,
    // up and forward. Both arms keep the avatar's lengths, so positions
    // carry over one to one.
    const step = (from: Triple, dir: Triple, length: number): Triple => {
      const d = new Vector3(...dir).normalize().multiplyScalar(length);
      return [from[0] + d.x, from[1] + d.y, from[2] + d.z];
    };
    const elbowR = step(SHOULDER_R, [-0.35, 0.85, -0.4], DEFAULT_BODY.upperArm);
    const wristR = step(elbowR, [0.3, -0.5, -0.8], DEFAULT_BODY.forearm);
    const raised = pose({ wristR, elbowR });
    const hand = mediaPipeHand(jointsFor("B"), flat, "right");
    const tl = replayTimeline(file([frame(0, { body: raised, right: hand, rightWorld: hand })]));
    const { r } = samplePose(tl, 0);

    // In the right hand's mirrored frame: +x out to the signer's right, +y
    // up, +z toward the viewer.
    const [sx, sy, sz] = DEFAULT_BODY.shoulder;
    expect(r.wrist[0]).toBeCloseTo(sx - (wristR[0] - SHOULDER_R[0]), 3);
    expect(r.wrist[1]).toBeCloseTo(sy - (wristR[1] - SHOULDER_R[1]), 3);
    expect(r.wrist[2]).toBeCloseTo(sz - (wristR[2] - SHOULDER_R[2]), 3);
    // The elbow leans outward, down and forward, as the signer's did.
    expect(r.elbow[0]).toBeGreaterThan(0);
    expect(r.elbow[1]).toBeLessThan(0);
    expect(r.elbow[2]).toBeGreaterThan(0);
  });

  it("drops a hand to rest while it is out of view", () => {
    const hidden = pose({ visibility: 0.1 });
    const tl = replayTimeline(file([frame(0, { body: hidden }), frame(1, { body: hidden })]));
    const { r, l } = samplePose(tl, 0.5);
    r.wrist.forEach((v, i) => expect(v).toBeCloseTo(REST_HAND.wrist[i], 5));
    l.wrist.forEach((v, i) => expect(v).toBeCloseTo(REST_HAND.wrist[i], 5));
  });

  it("keeps the handshape through a brief gap in hand tracking", () => {
    const fist = mediaPipeHand(jointsFor("A"), flat, "left");
    const frames = [0, 1, 2, 3, 4, 5, 6].map((i) =>
      // Frame 3 lost the hand for one frame; the arm is still tracked.
      frame(i / 30, i === 3 ? {} : { left: fist, leftWorld: fist }),
    );
    const tl = replayTimeline(file(frames));
    const { l } = samplePose(tl, 3 / 30);
    l.joints.slice(0, 16).forEach((angle, i) => expect(angle).toBeCloseTo(jointsFor("A")[i], 1));
  });

  it("smooths tracking jitter", () => {
    const steady = mediaPipeHand(jointsFor("B"), flat, "left");
    const frames = [0, 1, 2, 3, 4, 5, 6].map((i) => {
      // The wrist jumps 4 cm on one frame.
      const jolt = i === 3 ? 0.04 : 0;
      const body = pose({ wristL: [0.2 + jolt, 0.05, 0] });
      return frame(i / 30, { body, left: steady, leftWorld: steady });
    });
    const tl = replayTimeline(file(frames));
    const before = samplePose(tl, 2 / 30).l.wrist[0];
    const jolted = samplePose(tl, 3 / 30).l.wrist[0];
    expect(Math.abs(jolted - before)).toBeLessThan(0.02);
  });

  it("carries the tracked face onto the avatar's matching face shapes", () => {
    const tl = replayTimeline(
      file([frame(0, { face: [0, 0.8, 0.6] })], ["_neutral", "browInnerUp", "jawOpen"]),
    );
    const { face } = samplePose(tl, 0);
    expect(face.shapes?.browInnerUp).toBeCloseTo(0.8, 5);
    expect(face.shapes?.jawOpen).toBeCloseTo(0.6, 5);
    expect(face.brows).toBeGreaterThan(0);
  });

  it("turns the head the way the signer turned, from where they usually face", () => {
    // Facing the camera most of the take, then turned toward their left.
    const frames = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => frame(i, { body: pose({ turn: i >= 5 ? 0.4 : 0 }) }));
    const tl = replayTimeline(file(frames));
    expect(samplePose(tl, 0).head.turn).toBeCloseTo(0, 2);
    // Toward the signer's left, which the engine counts as positive.
    expect(samplePose(tl, 7).head.turn).toBeCloseTo(0.4, 2);
  });

  it("stands at rest for a take with no frames", () => {
    const tl = replayTimeline(file([]));
    expect(tl.duration).toBe(0);
    samplePose(tl, 0).r.wrist.forEach((v, i) => expect(v).toBeCloseTo(REST_HAND.wrist[i], 5));
  });
});
