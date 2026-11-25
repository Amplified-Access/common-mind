import { Quaternion, Vector3 } from "three";

import type { LandmarkFrame, LandmarksFile } from "@/lib/sign-capture/landmarks";

import { type Body, DEFAULT_BODY } from "./body";
import { digitPoints } from "./hand";
import { solveArm } from "./ik";
import { type Timeline, samplePose } from "./timeline";
import type { HandPose, Pose } from "./types";

// The reverse of replay.ts, for checking it: an engine timeline filmed as
// the tracker would see it, in MediaPipe's axes (x to the image's right, y
// down, z away from the camera).

type Triple = [number, number, number];

const toMediaPipe = (v: Vector3): Triple => [v.x, -v.y, -v.z];

/** A hand's world points and its arm, from the engine's pose of that hand. */
function film(hand: HandPose, side: "left" | "right", body: Body) {
  const m = side === "right" ? -1 : 1;
  const world = (v: Vector3) => new Vector3(v.x * m, v.y, v.z);
  const shoulder = world(new Vector3(...body.shoulder));
  const { elbow, wrist } = solveArm(
    shoulder,
    world(new Vector3(...hand.wrist)),
    world(new Vector3(...hand.elbow)),
    body.upperArm,
    body.forearm,
  );
  const q = new Quaternion(...hand.quat);
  const local = [new Vector3(), ...digitPoints(4, hand.joints), ...[0, 1, 2, 3].flatMap((d) => digitPoints(d, hand.joints))];
  const points = local.map((p) => toMediaPipe(world(p.clone().applyQuaternion(q)).add(wrist)));
  return { shoulder: toMediaPipe(shoulder), elbow: toMediaPipe(elbow), wrist: toMediaPipe(wrist), points };
}

function frameOf(pose: Pose, t: number, body: Body): LandmarkFrame {
  const l = film(pose.l, "left", body);
  const r = film(pose.r, "right", body);
  const world: Triple[] = Array.from({ length: 33 }, () => [0, 0, 0]);
  // A head facing the camera.
  world[0] = [0, -0.66, -0.1];
  world[7] = [0.075, -0.68, 0];
  world[8] = [-0.075, -0.68, 0];
  world[11] = l.shoulder;
  world[12] = r.shoulder;
  world[13] = l.elbow;
  world[14] = r.elbow;
  world[15] = l.wrist;
  world[16] = r.wrist;
  return {
    t,
    pose: world.map(([x, y, z]) => [x, y, z, 1]),
    poseWorld: world,
    left: null,
    leftWorld: l.points,
    right: null,
    rightWorld: r.points,
    face: null,
  };
}

/** The timeline filmed at `fps`, as a landmarks file. */
export function filmTimeline(tl: Timeline, fps = 30, body: Body = DEFAULT_BODY): LandmarksFile {
  const frames: LandmarkFrame[] = [];
  for (let i = 0; i * (1 / fps) <= tl.duration; i++) {
    const t = i / fps;
    frames.push(frameOf(samplePose(tl, t), t, body));
  }
  return {
    format: "commonmind.sign-landmarks",
    version: 1,
    tracker: "engine round trip",
    video: { width: 1280, height: 720 },
    blendshapes: [],
    frames,
  };
}
