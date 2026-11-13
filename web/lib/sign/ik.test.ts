import { Vector3 } from "three";
import { describe, expect, it } from "vitest";

import { solveArm } from "./ik";

const shoulder = new Vector3(0, 0, 0);
const pole = new Vector3(0, -1, 0);

describe("solveArm", () => {
  it("puts the wrist on a reachable target with both bones at length", () => {
    const target = new Vector3(0.2, 0.1, 0.25);
    const { elbow, wrist } = solveArm(shoulder, target, pole, 0.28, 0.25);

    expect(wrist.distanceTo(target)).toBeLessThan(1e-6);
    expect(elbow.distanceTo(shoulder)).toBeCloseTo(0.28, 6);
    expect(wrist.distanceTo(elbow)).toBeCloseTo(0.25, 6);
  });

  it("bends the elbow toward the pole", () => {
    const { elbow } = solveArm(shoulder, new Vector3(0, 0, 0.4), pole, 0.28, 0.25);
    expect(elbow.y).toBeLessThan(-0.05);
  });

  it("stops at full reach when the target is too far", () => {
    const target = new Vector3(0, 0, 2);
    const { elbow, wrist } = solveArm(shoulder, target, pole, 0.28, 0.25);

    expect(wrist.distanceTo(shoulder)).toBeLessThanOrEqual(0.53);
    expect(wrist.z).toBeGreaterThan(0.52);
    expect(wrist.distanceTo(elbow)).toBeCloseTo(0.25, 6);
  });

  it("keeps the bones at length when the target is inside the shoulder", () => {
    const { elbow, wrist } = solveArm(shoulder, new Vector3(0, 0, 0.001), pole, 0.28, 0.25);
    expect(elbow.distanceTo(shoulder)).toBeCloseTo(0.28, 6);
    expect(wrist.distanceTo(elbow)).toBeCloseTo(0.25, 6);
  });
});
