import { Vector3 } from "three";

/**
 * Places an elbow so the wrist reaches the target with fixed bone lengths:
 * the two-bone triangle, bent toward the pole. A target out of reach is
 * reached for in a straight line; one too close is held at the shortest
 * distance the bones allow.
 */
export function solveArm(
  shoulder: Vector3,
  target: Vector3,
  pole: Vector3,
  upper: number,
  lower: number,
): { elbow: Vector3; wrist: Vector3 } {
  const toTarget = target.clone().sub(shoulder);
  const min = Math.abs(upper - lower) + 1e-4;
  const max = upper + lower - 1e-4;
  const reach = Math.min(Math.max(toTarget.length(), min), max);

  const n = toTarget.lengthSq() > 1e-12 ? toTarget.normalize() : new Vector3(0, 0, 1);
  const wrist = shoulder.clone().addScaledVector(n, reach);

  // Distance along the reach to the foot of the elbow, and the elbow's
  // height off that line (law of cosines).
  const along = (upper * upper - lower * lower + reach * reach) / (2 * reach);
  const off = Math.sqrt(Math.max(upper * upper - along * along, 0));

  // The pole, made perpendicular to the reach.
  let side = pole.clone().addScaledVector(n, -pole.dot(n));
  if (side.lengthSq() < 1e-9) side = new Vector3(0, -1, 0).addScaledVector(n, n.y);
  if (side.lengthSq() < 1e-9) side = new Vector3(1, 0, 0);
  side.normalize();

  const elbow = shoulder.clone().addScaledVector(n, along).addScaledVector(side, off);
  return { elbow, wrist };
}
