import { describe, expect, it } from "vitest";

import { createLandmarkLog, type TrackerResult } from "./landmarks";

const point = (v: number, visibility = 0.98765) => ({ x: v, y: v / 2, z: -v, visibility });
const points = (count: number, v: number) => Array.from({ length: count }, () => point(v));

const blendshapes = [
  {
    categories: [
      { categoryName: "browInnerUp", score: 0.123456 },
      { categoryName: "jawOpen", score: 0.5 },
    ],
  },
];

const empty: TrackerResult = {
  poseLandmarks: [],
  poseWorldLandmarks: [],
  leftHandLandmarks: [],
  leftHandWorldLandmarks: [],
  rightHandLandmarks: [],
  rightHandWorldLandmarks: [],
  faceBlendshapes: [],
};

const tracked: TrackerResult = {
  poseLandmarks: [points(33, 0.123456)],
  poseWorldLandmarks: [points(33, 0.2)],
  leftHandLandmarks: [],
  leftHandWorldLandmarks: [],
  rightHandLandmarks: [points(21, 0.333333)],
  rightHandWorldLandmarks: [points(21, 0.05)],
  faceBlendshapes: blendshapes,
};

const meta = { tracker: "test-tracker", video: { width: 1280, height: 720 } };

describe("createLandmarkLog", () => {
  it("keeps each frame's pose, hands and face, rounded, with the time since the take started", () => {
    const log = createLandmarkLog(meta);
    log.add(tracked, 0.0333333);

    const file = log.file();
    expect(file.format).toBe("commonmind.sign-landmarks");
    expect(file.version).toBe(1);
    expect(file.tracker).toBe("test-tracker");
    expect(file.video).toEqual({ width: 1280, height: 720 });
    expect(file.blendshapes).toEqual(["browInnerUp", "jawOpen"]);

    const [frame] = file.frames;
    expect(frame.t).toBe(0.033);
    expect(frame.pose).toHaveLength(33);
    expect(frame.pose?.[0]).toEqual([0.1235, 0.0617, -0.1235, 0.99]);
    expect(frame.poseWorld?.[0]).toEqual([0.2, 0.1, -0.2]);
    expect(frame.right).toHaveLength(21);
    expect(frame.right?.[0]).toEqual([0.3333, 0.1667, -0.3333]);
    expect(frame.rightWorld?.[0]).toEqual([0.05, 0.025, -0.05]);
    expect(frame.left).toBeNull();
    expect(frame.leftWorld).toBeNull();
    expect(frame.face).toEqual([0.1235, 0.5]);
  });

  it("records a frame with nothing tracked as empty, so time stays continuous", () => {
    const log = createLandmarkLog(meta);
    log.add(empty, 0);

    expect(log.file().frames[0]).toEqual({
      t: 0,
      pose: null,
      poseWorld: null,
      left: null,
      leftWorld: null,
      right: null,
      rightWorld: null,
      face: null,
    });
    expect(log.file().blendshapes).toEqual([]);
  });

  it("measures the share of frames with a hand in view", () => {
    const log = createLandmarkLog(meta);
    expect(log.handCoverage()).toBe(0);

    log.add(tracked, 0);
    log.add(empty, 0.03);
    log.add(tracked, 0.06);
    log.add(tracked, 0.1);

    expect(log.handCoverage()).toBe(0.75);
  });

  it("starts again empty after a reset, for the next take", () => {
    const log = createLandmarkLog(meta);
    log.add(tracked, 0);
    log.reset();

    expect(log.file().frames).toEqual([]);
    expect(log.handCoverage()).toBe(0);
  });
});
