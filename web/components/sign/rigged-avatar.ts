import {
  type Bone,
  Group,
  type Material,
  Matrix4,
  Mesh,
  type Object3D,
  Quaternion,
  Raycaster,
  SkinnedMesh,
  type Texture,
  Vector3,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

import { type Body, type Landmarks, bodyFrom } from "@/lib/sign/body";
import { contactPoint, digitPoints, jointsFor } from "@/lib/sign/hand";
import { solveArm } from "@/lib/sign/ik";
import type { FacePose, HandPose, Pose, Vec3 } from "@/lib/sign/types";

// A rigged avatar (3ds Max Biped skeleton, ARKit face shapes) driven by the
// sign engine's poses. On load it is turned to face the viewer, placed so
// its shoulders and chest line up with the engine's default body, and
// measured: shoulders, arm lengths, hand size and the places on the face a
// hand goes. Each frame the arms are solved for the elbow, the hands turned,
// each finger joint aimed along the engine's hand model, and the face set
// from its blendshapes.

const FORWARD = new Vector3(0, 0, 1);
const UP = new Vector3(0, 1, 0);

type Side = "L" | "R";
type Arm = {
  side: Side;
  /** -1 mirrors the engine's frame onto the signer's right. */
  mirror: number;
  upper: Bone;
  fore: Bone;
  hand: Bone;
  /** Index, middle, ring, pinky, thumb: three bones each, base to tip. */
  digits: Bone[][];
  /** The hand's rest orientation and, in that pose, which way its fingers
   * point and its palm faces. */
  handRest: Quaternion;
  restFingers: Vector3;
  restPalm: Vector3;
};

// Bone names as the glTF loader sanitises them ("Bip01 R Hand" → "Bip01_R_Hand").
const bone = (root: Object3D, name: string) => {
  const found = root.getObjectByName(name.replace(/\s/g, "_"));
  if (!found) throw new Error(`The avatar has no bone "${name}"`);
  return found as Bone;
};

const v = () => new Vector3();
const worldPos = (o: Object3D, out = v()) => o.getWorldPosition(out);
const worldQuat = (o: Object3D, out = new Quaternion()) => o.getWorldQuaternion(out);

/** Sets a bone's rotation from a world-space orientation. */
function setWorldQuat(b: Object3D, q: Quaternion) {
  const parent = b.parent ? worldQuat(b.parent) : new Quaternion();
  b.quaternion.copy(parent.invert().multiply(q));
  b.updateMatrixWorld(true);
}

/** The rotation taking one orthonormal frame (primary, secondary) to another. */
function frameRotation(fromA: Vector3, fromB: Vector3, toA: Vector3, toB: Vector3): Quaternion {
  const basis = (a: Vector3, b: Vector3) => {
    const x = a.clone().normalize();
    const z = new Vector3().crossVectors(x, b).normalize();
    const y = new Vector3().crossVectors(z, x);
    return new Matrix4().makeBasis(x, y, z);
  };
  const m = basis(toA, toB).multiply(basis(fromA, fromB).transpose());
  return new Quaternion().setFromRotationMatrix(m);
}

export class RiggedAvatar {
  readonly root = new Group();
  readonly body: Body;
  private readonly model: Object3D;
  private readonly arms: Arm[];
  private readonly spine: Bone;
  private readonly neck: Bone;
  private readonly head: Bone;
  private readonly eyes: Bone[];
  private readonly meshes: Mesh[] = [];
  private readonly faces: Mesh[] = [];
  /** Every bone this class turns, with its rest rotation, to reset each frame. */
  private readonly rest = new Map<Bone, Quaternion>();
  private readonly eyeRest: Quaternion[];
  private readonly headRest: Quaternion;
  private nextBlink = 1.2;
  private blinkAt = -10;

  static async load(url: string): Promise<RiggedAvatar> {
    const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(url);
    return new RiggedAvatar(gltf.scene);
  }

  private constructor(model: Object3D) {
    this.model = model;
    this.root.add(model);
    model.traverse((o) => {
      if (o instanceof Mesh) {
        o.frustumCulled = false;
        this.meshes.push(o);
        if (o.morphTargetDictionary && Object.keys(o.morphTargetDictionary).length > 0) this.faces.push(o);
      }
    });
    this.root.updateMatrixWorld(true);

    // Face the viewer: the signer's left shoulder at +x, looking down +z.
    const left = worldPos(bone(model, "Bip01 L UpperArm"));
    const right = worldPos(bone(model, "Bip01 R UpperArm"));
    const facing = new Vector3().crossVectors(left.clone().sub(right), UP).setY(0).normalize();
    this.root.rotation.y = -Math.atan2(facing.x, facing.z);
    this.root.updateMatrixWorld(true);

    this.spine = bone(model, "Bip01 Spine2");
    this.neck = bone(model, "Bip01 Neck");
    this.head = bone(model, "Bip01 Head");
    this.eyes = [bone(model, "Bip01 LEye"), bone(model, "Bip01 REye")];

    // Line the shoulders and chest up with the engine's default body.
    const shoulders = worldPos(bone(model, "Bip01 L UpperArm")).add(worldPos(bone(model, "Bip01 R UpperArm"))).multiplyScalar(0.5);
    this.root.position.set(-shoulders.x, 0.5 - shoulders.y, 0);
    this.root.updateMatrixWorld(true);
    const chestFront = this.frontAt(0, 0.4) ?? 0.12;
    this.root.position.z += 0.122 - chestFront;
    this.root.updateMatrixWorld(true);

    this.arms = (["L", "R"] as const).map((side) => this.buildArm(side));
    for (const b of [this.spine, this.neck, this.head, ...this.eyes]) this.rest.set(b, b.quaternion.clone());
    this.eyeRest = this.eyes.map((e) => worldQuat(e));
    this.headRest = worldQuat(this.head);
    this.body = bodyFrom(this.measure());
  }

  private buildArm(side: Side): Arm {
    const b = (part: string) => bone(this.model, `Bip01 ${side} ${part}`);
    const digits = ["1", "2", "3", "4", "0"].map((n) => [b(`Finger${n}`), b(`Finger${n}1`), b(`Finger${n}2`)]);
    const arm: Arm = {
      side,
      mirror: side === "L" ? 1 : -1,
      upper: b("UpperArm"),
      fore: b("Forearm"),
      hand: b("Hand"),
      digits,
      handRest: new Quaternion(),
      restFingers: v(),
      restPalm: v(),
    };
    for (const x of [arm.upper, arm.fore, arm.hand, ...digits.flat()]) this.rest.set(x, x.quaternion.clone());

    // The hand at rest: fingers from the wrist to the middle knuckle, thumb
    // side from the little-finger knuckle to the index knuckle. The palm
    // faces fingers × thumb-side on the left, the reverse on the right.
    const wrist = worldPos(arm.hand);
    const fingers = worldPos(digits[1][0]).sub(wrist).normalize();
    const thumbSide = worldPos(digits[0][0]).sub(worldPos(digits[3][0])).normalize();
    const palm = new Vector3().crossVectors(fingers, thumbSide).multiplyScalar(arm.mirror).normalize();
    arm.restFingers.copy(fingers);
    arm.restPalm.copy(palm.sub(fingers.clone().multiplyScalar(palm.dot(fingers))).normalize());
    worldQuat(arm.hand, arm.handRest);
    return arm;
  }

  /** The nearest skin straight in front of a point, from the front. */
  private frontAt(x: number, y: number): number | null {
    return this.hit(new Vector3(x, y, 2), new Vector3(0, 0, -1))?.z ?? null;
  }

  /** The outer surface at the signer's left, from the side. */
  private sideAt(y: number, z: number): number | null {
    return this.hit(new Vector3(2, y, z), new Vector3(-1, 0, 0))?.x ?? null;
  }

  private hit(from: Vector3, dir: Vector3): Vector3 | null {
    const ray = new Raycaster(from, dir);
    // Skin and clothes only: hair and lashes are drawn with see-through cards.
    const solid = this.meshes.filter((m) => !(m.material as Material).name.endsWith("_opacity"));
    return ray.intersectObjects(solid, false)[0]?.point ?? null;
  }

  private measure(): Landmarks {
    const p = (name: string) => worldPos(bone(this.model, name));
    const shoulder = p("Bip01 L UpperArm");
    const elbow = p("Bip01 L Forearm");
    const wrist = p("Bip01 L Hand");
    const tipBase = p("Bip01 L Finger21");
    const tipJoint = p("Bip01 L Finger22");
    const tip = tipJoint.clone().add(tipJoint.clone().sub(tipBase).multiplyScalar(0.9));
    const handScale = tip.distanceTo(wrist) / contactPoint("tips", jointsFor("B")).length();

    const eye = p("Bip01 LEye");
    const mouthY = (p("Bip01 MUpperLip").y + p("Bip01 MBottomLip").y) / 2;
    const neckY = (p("Bip01 Neck").y + p("Bip01 Head").y) / 2;
    const ex = Math.abs(eye.x);
    const front = (x: number, y: number, gap: number, fallback: number): Vec3 => [x, y, (this.frontAt(x, y) ?? fallback) + gap];
    const side = (y: number, z: number, gap: number, fallback: number): Vec3 => [(this.sideAt(y, z) ?? fallback) + gap, y, z];

    return {
      shoulder: [Math.abs(shoulder.x), shoulder.y, shoulder.z],
      upperArm: shoulder.distanceTo(elbow),
      forearm: elbow.distanceTo(wrist),
      handScale,
      points: {
        forehead: front(0, eye.y + 0.05, 0.008, eye.z + 0.03),
        eye: front(ex, eye.y, 0.012, eye.z + 0.012),
        nose: front(0, eye.y - 0.032, 0.006, eye.z + 0.035),
        mouth: front(0, mouthY, 0.008, eye.z + 0.01),
        chin: front(0, mouthY - 0.035, 0.008, eye.z - 0.005),
        cheek: front(ex + 0.012, eye.y - 0.04, 0.008, eye.z),
        temple: side(eye.y + 0.02, eye.z - 0.025, 0.008, ex + 0.04),
        ear: side(eye.y - 0.01, eye.z - 0.075, 0.006, ex + 0.05),
        jaw: side(mouthY - 0.015, eye.z - 0.03, 0.008, ex + 0.025),
        throat: front(0, neckY, 0.01, eye.z - 0.03),
        chest: front(0, 0.4, 0.008, 0.12),
        "chest-side": front(0.075, 0.41, 0.008, 0.115),
        stomach: front(0, 0.2, 0.008, 0.12),
      },
    };
  }

  /** Two-bone arm: the upper arm and forearm aimed at the solved elbow and
   * wrist, keeping the elbow's bend in the plane the solver chose. */
  private applyArm(arm: Arm, pose: HandPose) {
    const m = arm.mirror;
    const mirror = (p: readonly number[]) => new Vector3(p[0] * m, p[1], p[2]);
    const shoulder = worldPos(arm.upper);
    const { elbow, wrist } = solveArm(shoulder, mirror(pose.wrist), mirror(pose.elbow), this.body.upperArm, this.body.forearm);

    const upperNow = worldPos(arm.fore).sub(shoulder);
    const upperTo = elbow.clone().sub(shoulder);
    const foreTo = wrist.clone().sub(elbow);
    // The axis the elbow bends about: from the solved arm, or, when it is
    // straight, the one a forward bend would use.
    let hinge = new Vector3().crossVectors(upperTo, foreTo);
    if (hinge.lengthSq() < 1e-8) hinge = new Vector3().crossVectors(upperTo, FORWARD);
    const restHinge = new Vector3().crossVectors(upperNow, FORWARD);
    setWorldQuat(arm.upper, frameRotation(upperNow, restHinge, upperTo, hinge).multiply(worldQuat(arm.upper)));

    const foreNow = worldPos(arm.hand).sub(worldPos(arm.fore));
    setWorldQuat(arm.fore, frameRotation(foreNow, hinge, foreTo, hinge).multiply(worldQuat(arm.fore)));

    // The hand, turned so its fingers and palm face the way the pose says.
    const q = new Quaternion(...pose.quat);
    const fingers = mirror(new Vector3(0, 1, 0).applyQuaternion(q).toArray());
    const palm = mirror(new Vector3(0, 0, 1).applyQuaternion(q).toArray());
    const handWorld = frameRotation(arm.restFingers, arm.restPalm, fingers, palm).multiply(arm.handRest);

    // Share the wrist's twist with the forearm, as the two forearm bones do,
    // so the wrist doesn't wring.
    const axis = arm.hand.position.clone().normalize();
    const local = worldQuat(arm.fore).invert().multiply(handWorld);
    const along = new Vector3(local.x, local.y, local.z).dot(axis);
    const twist = new Quaternion(axis.x * along, axis.y * along, axis.z * along, local.w).normalize();
    // The short way round.
    if (twist.w < 0) twist.set(-twist.x, -twist.y, -twist.z, -twist.w);
    const half = new Quaternion().slerp(twist, 0.6);
    setWorldQuat(arm.fore, worldQuat(arm.fore).multiply(half));
    setWorldQuat(arm.hand, handWorld);

    // Fingers: each joint aimed along the engine's hand model.
    arm.digits.forEach((chain, d) => {
      const points = digitPoints(d, pose.joints);
      chain.forEach((b, i) => {
        const want = mirror(points[i + 1].clone().sub(points[i]).applyQuaternion(q).toArray()).normalize();
        const now = this.boneDirection(b, chain[i + 1]);
        setWorldQuat(b, new Quaternion().setFromUnitVectors(now, want).multiply(worldQuat(b)));
      });
    });
  }

  /** Which way a bone points: to its child, or for the last bone in a
   * chain, along the local axis its parent points along (Biped bones all
   * run along the same local axis). */
  private boneDirection(b: Bone, child?: Bone): Vector3 {
    if (child) return worldPos(child).sub(worldPos(b)).normalize();
    return b.position.clone().normalize().applyQuaternion(worldQuat(b));
  }

  private applyHead(pose: Pose, gaze: Vector3 | null, idle: number, time: number) {
    // Head movement from the signing, plus a turn toward the gaze while idle.
    let yaw = pose.head.turn + Math.sin(time * 0.23) * 0.02;
    let pitch = pose.head.nod + Math.sin(time * 0.6) * 0.008;
    if (gaze) {
      const from = worldPos(this.head);
      const d = gaze.clone().sub(from);
      yaw += Math.atan2(d.x, d.z) * 0.3 * idle;
      pitch += -Math.atan2(d.y, Math.hypot(d.x, d.z)) * 0.25 * idle;
    }
    const turn = (share: number) =>
      new Quaternion()
        .setFromAxisAngle(UP, yaw * share)
        .multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), pitch * share))
        .multiply(new Quaternion().setFromAxisAngle(FORWARD, pose.head.tilt * share));
    setWorldQuat(this.neck, turn(0.4).multiply(worldQuat(this.neck)));
    setWorldQuat(this.head, turn(0.6).multiply(worldQuat(this.head)));

    // Eyes on the gaze point, within the range eyes turn.
    if (!gaze) return;
    const headTurn = worldQuat(this.head).multiply(this.headRest.clone().invert());
    const toHead = headTurn.clone().invert();
    this.eyes.forEach((eye, i) => {
      const d = gaze.clone().sub(worldPos(eye)).applyQuaternion(toHead);
      const y = Math.max(-0.32, Math.min(0.32, Math.atan2(d.x, d.z)));
      const p = Math.max(-0.22, Math.min(0.22, Math.atan2(d.y, Math.hypot(d.x, d.z))));
      const look = new Quaternion().setFromAxisAngle(UP, y).multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -p));
      setWorldQuat(eye, headTurn.clone().multiply(look).multiply(this.eyeRest[i]));
    });
  }

  private applyFace(face: FacePose, time: number) {
    if (time > this.nextBlink) {
      this.blinkAt = time;
      this.nextBlink = time + 2.4 + Math.random() * 3;
    }
    const b = (time - this.blinkAt) / 0.17;
    const blink = b >= 0 && b <= 1 ? Math.sin(b * Math.PI) : 0;
    const up = Math.max(face.brows, 0);
    const down = Math.max(-face.brows, 0);
    const shapes: Record<string, number> = {
      browInnerUp: up,
      browOuterUpLeft: up * 0.8,
      browOuterUpRight: up * 0.8,
      browDownLeft: down,
      browDownRight: down,
      eyeWideLeft: up * 0.35,
      eyeWideRight: up * 0.35,
      eyeSquintLeft: down * 0.4 + face.wide * 0.3,
      eyeSquintRight: down * 0.4 + face.wide * 0.3,
      eyeBlinkLeft: blink,
      eyeBlinkRight: blink,
      jawOpen: face.open * 0.55,
      mouthSmileLeft: face.wide * 0.8,
      mouthSmileRight: face.wide * 0.8,
      mouthPucker: face.round * 0.8,
      mouthFunnel: face.round * 0.45,
    };
    for (const mesh of this.faces) {
      const dict = mesh.morphTargetDictionary;
      const influences = mesh.morphTargetInfluences;
      if (!dict || !influences) continue;
      for (const [name, value] of Object.entries(shapes)) {
        const i = dict[name];
        if (i !== undefined) influences[i] = Math.min(Math.max(value, 0), 1);
      }
    }
  }

  /** Puts the avatar in a pose. `gaze` is a point to look at; `idle` (0–1)
   * is how far the head may follow it. */
  update(pose: Pose, time: number, gaze: Vector3 | null = null, idle = 1) {
    for (const [b, q] of this.rest) b.quaternion.copy(q);
    // Breathing and a slight sway.
    this.spine.quaternion.multiply(
      new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), Math.sin(time * 0.37) * 0.01),
    );
    this.root.updateMatrixWorld(true);

    for (const arm of this.arms) this.applyArm(arm, arm.side === "L" ? pose.l : pose.r);
    this.applyHead(pose, gaze, idle, time);
    this.applyFace(pose.face, time);
  }

  dispose() {
    this.root.traverse((o) => {
      if (o instanceof Mesh) {
        o.geometry.dispose();
        const materials = Array.isArray(o.material) ? o.material : [o.material];
        for (const mat of materials as Material[]) {
          for (const value of Object.values(mat)) if ((value as Texture | null)?.isTexture) (value as Texture).dispose();
          mat.dispose();
        }
      }
      if (o instanceof SkinnedMesh) o.skeleton.dispose();
    });
    this.root.removeFromParent();
  }
}
