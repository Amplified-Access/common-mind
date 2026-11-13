import {
  BufferGeometry,
  CapsuleGeometry,
  Color,
  CylinderGeometry,
  Group,
  InstancedMesh,
  LatheGeometry,
  Material,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  Quaternion,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  Vector3,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

import { FOREARM, HEAD_CENTER, HEAD_RADII, HEAD_SCALE, SHOULDER, UPPER_ARM } from "@/lib/sign/body";
import type { Character, HairStyle } from "@/lib/sign/characters";
import { FINGERS, PALM, THUMB, fingerBaseEuler, thumbBaseEuler } from "@/lib/sign/hand";
import { solveArm } from "@/lib/sign/ik";
import type { FacePose, HandPose, Pose } from "@/lib/sign/types";

// The signer, built from simple shapes so every character shares one body and
// one set of measurements (lib/sign/body.ts). Arms are placed each frame by
// solving for the elbow; the dominant (right) arm is the left one mirrored.

const UP = new Vector3(0, 1, 0);
const NECK_PIVOT = new Vector3(0, 0.6, 0);

type Chain = { base: Group; mid: Group; tip: Group };

type Arm = {
  group: Group;
  upper: Mesh;
  sleeve: Mesh;
  elbow: Mesh;
  forearm: Mesh;
  hand: Group;
  fingers: Chain[];
  thumb: Chain;
};

type Lip = { mesh: InstancedMesh; count: number };

const unitSphere = () => new SphereGeometry(1, 32, 20);

/** A cylinder of unit height standing on its base, to stretch between joints. */
const limb = (base: number, top: number, open = false) =>
  new CylinderGeometry(top, base, 1, 20, 1, open).translate(0, 0.5, 0);

function add<T extends Object3D>(parent: Object3D, child: T, position?: readonly number[], scale?: readonly number[]): T {
  if (position) child.position.set(position[0], position[1], position[2]);
  if (scale) child.scale.set(scale[0], scale[1], scale[2]);
  parent.add(child);
  return child;
}

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};

/** Points spread evenly over a sphere. */
function fibonacci(n: number): Vector3[] {
  const out: Vector3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n;
    const r = Math.sqrt(1 - y * y);
    out.push(new Vector3(Math.cos(golden * i) * r, y, Math.sin(golden * i) * r));
  }
  return out;
}

// A seeded random, so a character's curls are the same every time it's drawn.
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** How much hair grows at a direction from the head's centre, 0–1: a
 * hairline high on the forehead, down to the nape at the back, clear of
 * the ears. */
function hairMask(d: Vector3, hairline: number): number {
  const threshold = -0.62 + (hairline + 0.62) * ((d.z + 1) / 2);
  const ears = Math.abs(d.x) > 0.8 && d.y < 0.3 && d.z > -0.45 ? 0 : 1;
  return smoothstep(threshold, threshold + 0.1, d.y) * ears;
}

/** The skin of the head at a direction from its centre: an egg that narrows
 * below the cheeks to a rounded chin. `jaw` is the jaw's width, 1 broadest. */
function headSurface(d: Vector3, jaw: number, out = new Vector3()): Vector3 {
  const below = Math.max(-d.y, 0);
  const front = Math.max(d.z, 0);
  const taper = 1 - below ** 1.4 * (0.44 - 0.22 * jaw);
  const ry = d.y >= 0 ? HEAD_RADII[1] : HEAD_RADII[1] + 0.022 * front;
  const chin = 0.012 * below ** 1.5 * front;
  const tuck = d.y < 0 ? 1 - 0.1 * below * (1 - front) : 1;
  return out.set(d.x * HEAD_RADII[0] * taper, d.y * ry, d.z * HEAD_RADII[2] * tuck + chin);
}

const HAIR: Record<HairStyle, { hairline: number; thickness: (d: Vector3) => number; curl: number; curls: number }> = {
  crop: { hairline: 0.5, thickness: () => 1.05, curl: 0.0052, curls: 1400 },
  bun: { hairline: 0.55, thickness: () => 1.035, curl: 0, curls: 0 },
  twists: { hairline: 0.5, thickness: (d) => 1.09 + 0.07 * Math.max(d.y, 0), curl: 0.0085, curls: 900 },
  puff: { hairline: 0.55, thickness: () => 1.035, curl: 0, curls: 0 },
};

export class SignerAvatar {
  readonly root = new Group();
  private readonly body = new Group();
  private readonly head = new Group();
  private readonly arms: { r: Arm; l: Arm };
  private readonly eyes: Group[] = [];
  private readonly lids: Mesh[] = [];
  private readonly brows: Mesh[] = [];
  private readonly lips: { upper: Lip; lower: Lip; inner: Mesh; teeth: Mesh };
  private lipFullness = 1;
  private nextBlink = 1.5;
  private blinkAt = -10;

  // Scratch values, reused every frame.
  private readonly s = new Vector3();
  private readonly t = new Vector3();
  private readonly p = new Vector3();
  private readonly m = new Matrix4();
  private readonly q = new Quaternion();
  private readonly v = new Vector3();
  private readonly sc = new Vector3();

  constructor(c: Character) {
    const skin = new MeshPhysicalMaterial({
      color: c.skin,
      roughness: 0.5,
      sheen: 0.5,
      sheenRoughness: 0.55,
      sheenColor: new Color(c.skin).offsetHSL(0.01, 0, 0.18),
    });
    const shirt = new MeshStandardMaterial({ color: c.shirt, roughness: 0.9 });
    const trim = new MeshStandardMaterial({ color: c.trim, roughness: 0.55 });
    const hair = new MeshStandardMaterial({ color: c.hair.color, roughness: 0.95 });
    const lipMat = new MeshPhysicalMaterial({ color: c.lips, roughness: 0.38 });

    this.root.add(this.body);

    // Torso: a turned profile, flattened front to back.
    const profile = [
      [0, -0.06], [0.15, -0.06], [0.152, 0.08], [0.162, 0.24], [0.17, 0.37],
      [0.166, 0.445], [0.138, 0.515], [0.085, 0.56], [0.058, 0.574], [0, 0.578],
    ].map(([r, y]) => new Vector2(r, y));
    add(this.body, new Mesh(new LatheGeometry(profile, 48), shirt), [0, 0, 0], [1.06, 1, 0.62]);
    const collar = add(this.body, new Mesh(new TorusGeometry(0.06, 0.0075, 10, 40), trim), [0, 0.566, 0.002], [1, 0.82, 1]);
    collar.rotation.x = Math.PI / 2;
    add(this.body, new Mesh(limb(0.058, 0.052), skin), [0, 0.52, -0.004], [1, 0.15, 0.9]);

    // Head, turning about the top of the neck.
    add(this.body, this.head, NECK_PIVOT.toArray());
    const face = add(this.head, new Group(), [HEAD_CENTER[0], HEAD_CENTER[1] - NECK_PIVOT.y, HEAD_CENTER[2]]);
    face.scale.setScalar(HEAD_SCALE);
    const head = new SphereGeometry(1, 72, 48);
    const hp = head.attributes.position;
    const dir = new Vector3();
    for (let i = 0; i < hp.count; i++) {
      headSurface(dir.fromBufferAttribute(hp, i).normalize(), c.jaw, this.v);
      hp.setXYZ(i, this.v.x, this.v.y, this.v.z);
    }
    head.computeVertexNormals();
    add(face, new Mesh(head, skin));
    for (const side of [-1, 1]) {
      add(face, new Mesh(unitSphere(), skin), [side * 0.079, -0.004, -0.004], [0.011, 0.025, 0.017]);
      add(face, new Mesh(unitSphere(), skin), [side * 0.012, -0.026, 0.091], [0.0095, 0.009, 0.009]);
    }
    add(face, new Mesh(unitSphere(), skin), [0, -0.002, 0.087], [0.0105, 0.024, 0.012]);
    add(face, new Mesh(unitSphere(), skin), [0, -0.023, 0.096], [0.0165, 0.0125, 0.0125]);

    this.buildEyes(face, c, skin, hair);
    this.lips = this.buildMouth(face, lipMat, !!c.fullLips);
    this.buildHair(face, c, hair);
    if (c.beard) this.buildBeard(face, c, hair);
    if (c.earrings) {
      const gold = new MeshStandardMaterial({ color: c.earrings, metalness: 0.85, roughness: 0.3 });
      for (const side of [-1, 1]) add(face, new Mesh(unitSphere(), gold), [side * 0.081, -0.031, 0.001], [0.0055, 0.0055, 0.0055]);
    }

    this.arms = {
      r: this.buildArm(skin, shirt, trim, true),
      l: this.buildArm(skin, shirt, trim, false),
    };
  }

  private buildEyes(face: Group, c: Character, skin: Material, hair: Material) {
    const sclera = new MeshStandardMaterial({ color: "#ddd4c8", roughness: 0.3 });
    const iris = new MeshStandardMaterial({ color: c.iris, roughness: 0.25 });
    const pupil = new MeshBasicMaterial({ color: "#060403" });
    const upperLid = new SphereGeometry(0.0149, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    const lowerLid = new SphereGeometry(0.0147, 24, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    // A dark line along the upper lid's edge; heavier where there are lashes.
    const lash = new TorusGeometry(0.0149, c.lashes ? 0.0017 : 0.0009, 4, 20, Math.PI).rotateX(Math.PI / 2);

    for (const side of [-1, 1]) {
      const socket = add(face, new Group(), [side * 0.03, 0.013, 0.073]);
      const eye = add(socket, new Group());
      add(eye, new Mesh(unitSphere(), sclera), [0, 0, 0], [0.0135, 0.0135, 0.0135]);
      add(eye, new Mesh(unitSphere(), iris), [0, 0, 0.0118], [0.0086, 0.0086, 0.003]);
      add(eye, new Mesh(unitSphere(), pupil), [0, 0, 0.0134], [0.0038, 0.0038, 0.0012]);
      this.eyes.push(eye);
      const lid = add(socket, new Mesh(upperLid, skin));
      add(lid, new Mesh(lash, hair));
      this.lids.push(lid);
      const lower = add(socket, new Mesh(lowerLid, skin));
      lower.rotation.x = 0.62;

      const brow = add(face, new Mesh(new CapsuleGeometry(0.0034, 0.022, 4, 8), hair), [side * 0.031, 0.036, 0.081]);
      brow.userData.side = side;
      this.brows.push(brow);
    }
  }

  private buildMouth(face: Group, lipMat: Material, full: boolean) {
    this.lipFullness = full ? 1.22 : 1;
    const mouth = add(face, new Group(), [0, -0.05, 0.085]);
    const inner = add(mouth, new Mesh(unitSphere(), new MeshBasicMaterial({ color: "#1d0e0b" })), [0, 0, -0.003]);
    const teeth = add(mouth, new Mesh(unitSphere(), new MeshStandardMaterial({ color: "#ebe4d6", roughness: 0.35 })), [0, 0.001, -0.001]);
    const lip = (count: number): Lip => ({ mesh: add(mouth, new InstancedMesh(unitSphere(), lipMat, count)), count });
    return { upper: lip(13), lower: lip(13), inner, teeth };
  }

  private buildHair(face: Group, c: Character, hair: Material) {
    const style = HAIR[c.hair.style];

    // A shell over the cranium, pulled back inside the head where there's
    // no hair, so the hairline is a soft edge.
    const shell = new SphereGeometry(1, 72, 48);
    const pos = shell.attributes.position;
    const d = new Vector3();
    for (let i = 0; i < pos.count; i++) {
      d.fromBufferAttribute(pos, i).normalize();
      const k = 0.95 + (style.thickness(d) - 0.95) * hairMask(d, style.hairline);
      pos.setXYZ(i, d.x * HEAD_RADII[0] * k, d.y * HEAD_RADII[1] * k, d.z * HEAD_RADII[2] * k);
    }
    shell.computeVertexNormals();
    add(face, new Mesh(shell, hair));

    const rand = seeded(c.id.length * 7919 + c.id.charCodeAt(0));
    const curls: { at: Vector3; normal: Vector3; size: number }[] = [];

    if (style.curls > 0) {
      for (const dir of fibonacci(style.curls)) {
        if (hairMask(dir, style.hairline) < 0.85) continue;
        const k = style.thickness(dir);
        const at = new Vector3(dir.x * HEAD_RADII[0] * k, dir.y * HEAD_RADII[1] * k, dir.z * HEAD_RADII[2] * k);
        curls.push({ at, normal: dir.clone(), size: style.curl * (0.75 + rand() * 0.5) });
      }
    }

    // A bun or a puff: a ball of hair, covered in curls.
    const ball = (center: Vector3, radius: number, curl: number, count: number) => {
      add(face, new Mesh(unitSphere(), hair), center.toArray(), [radius, radius * 0.9, radius]);
      for (const dir of fibonacci(count)) {
        const at = center.clone().add(new Vector3(dir.x * radius, dir.y * radius * 0.9, dir.z * radius));
        curls.push({ at, normal: dir.clone(), size: curl * (0.75 + rand() * 0.5) });
      }
    };
    if (c.hair.style === "bun") {
      ball(new Vector3(0, 0.094, -0.048), 0.042, 0.0068, 260);
      // Cornrows: braided rows running back from the hairline to the bun.
      for (let row = 0; row < 9; row++) {
        const s = (row / 8) * 2 - 1;
        for (let i = 0; i <= 30; i++) {
          const t = i / 30;
          const z = 0.66 - 1.2 * t;
          const x = s * 0.85 * (1 - 0.6 * t) * Math.sqrt(Math.max(1 - z * z, 0));
          const dir = new Vector3(x, Math.sqrt(Math.max(1 - x * x - z * z, 0)), z).normalize();
          if (hairMask(dir, style.hairline) < 0.6) continue;
          const k = style.thickness(dir) + 0.008;
          const at = new Vector3(dir.x * HEAD_RADII[0] * k, dir.y * HEAD_RADII[1] * k, dir.z * HEAD_RADII[2] * k);
          curls.push({ at, normal: dir, size: 0.0056 });
        }
      }
    }
    if (c.hair.style === "puff") ball(new Vector3(0, 0.09, -0.04), 0.074, 0.0095, 520);

    if (curls.length > 0) {
      const mesh = new InstancedMesh(unitSphere(), hair, curls.length);
      curls.forEach(({ at, normal, size }, i) => {
        this.q.setFromUnitVectors(UP, normal);
        this.m.compose(at, this.q, this.sc.set(size, size * 1.4, size));
        mesh.setMatrixAt(i, this.m);
      });
      face.add(mesh);
    }
  }

  private buildBeard(face: Group, c: Character, hair: Material) {
    const points: Vector3[] = [];
    for (const d of fibonacci(4200)) {
      const mouth = Math.abs(d.x) < 0.34 && d.y > -0.62 && d.z > 0.72;
      const jawline = d.y < -0.2 && d.z > -0.15;
      const sideburn = Math.abs(d.x) > 0.82 && d.y > -0.5 && d.y < 0.05 && d.z > -0.1 && d.z < 0.4;
      if (mouth || !(jawline || sideburn)) continue;
      points.push(headSurface(d, c.jaw).multiplyScalar(1.012));
    }
    // A moustache along the upper lip.
    for (let i = 0; i < 26; i++) {
      const s = i / 25 - 0.5;
      points.push(new Vector3(s * 0.04, -0.039 - Math.abs(s) * 0.012, 0.0905 - s * s * 0.03));
    }
    const mesh = new InstancedMesh(unitSphere(), hair, points.length);
    points.forEach((at, i) => {
      this.m.compose(at, this.q.identity(), this.sc.setScalar(0.0034));
      mesh.setMatrixAt(i, this.m);
    });
    face.add(mesh);
  }

  private buildArm(skin: Material, shirt: Material, trim: Material, mirrored: boolean): Arm {
    const group = add(this.body, new Group());
    if (mirrored) group.scale.x = -1;

    add(group, new Mesh(unitSphere(), shirt), SHOULDER, [0.052, 0.046, 0.052]);
    const upper = add(group, new Mesh(limb(0.041, 0.035), skin));
    const sleeve = add(group, new Mesh(limb(0.052, 0.047, true), shirt));
    add(sleeve, new Mesh(new TorusGeometry(0.047, 0.0035, 8, 32).rotateX(Math.PI / 2).translate(0, 1, 0), trim));
    const elbow = add(group, new Mesh(unitSphere(), skin), undefined, [0.035, 0.035, 0.035]);
    const forearm = add(group, new Mesh(limb(0.035, 0.027), skin));

    const hand = add(group, new Group());
    add(hand, new Mesh(unitSphere(), skin), [0, 0.004, 0], [0.026, 0.02, 0.018]);
    add(hand, new Mesh(new RoundedBoxGeometry(PALM.width, PALM.length, PALM.depth, 3, 0.012), skin), [0, PALM.length / 2, 0]);
    add(hand, new Mesh(unitSphere(), skin), [-0.022, 0.032, 0.006], [0.019, 0.03, 0.013]);

    const chain = (parent: Object3D, base: readonly number[], lengths: readonly number[], radius: number): Chain => {
      const root = add(parent, new Group(), base);
      add(root, new Mesh(new CapsuleGeometry(radius, lengths[0], 4, 10), skin), [0, lengths[0] / 2, 0]);
      const mid = add(root, new Group(), [0, lengths[0], 0]);
      add(mid, new Mesh(new CapsuleGeometry(radius * 0.94, lengths[1], 4, 10), skin), [0, lengths[1] / 2, 0]);
      const tip = add(mid, new Group(), [0, lengths[1], 0]);
      const r = radius * 0.88;
      add(tip, new Mesh(new CapsuleGeometry(r, lengths[2] - r, 4, 10), skin), [0, (lengths[2] - r) / 2, 0]);
      return { base: root, mid, tip };
    };

    return {
      group,
      upper,
      sleeve,
      elbow,
      forearm,
      hand,
      fingers: FINGERS.map((f) => chain(hand, f.base, f.lengths, f.radius)),
      thumb: chain(hand, THUMB.base, THUMB.lengths, THUMB.radius),
    };
  }

  /** Stretches a limb from one joint to the next. */
  private span(mesh: Mesh, from: Vector3, to: Vector3, length?: number) {
    this.v.subVectors(to, from);
    const len = this.v.length();
    mesh.position.copy(from);
    mesh.quaternion.setFromUnitVectors(UP, this.v.divideScalar(len || 1));
    mesh.scale.set(1, length ?? len, 1);
  }

  private applyArm(arm: Arm, pose: HandPose) {
    this.s.set(...SHOULDER);
    this.t.set(...pose.wrist);
    this.p.set(...pose.elbow);
    const { elbow, wrist } = solveArm(this.s, this.t, this.p, UPPER_ARM, FOREARM);

    this.span(arm.upper, this.s, elbow);
    this.span(arm.sleeve, this.s, elbow, 0.13);
    arm.elbow.position.copy(elbow);
    this.span(arm.forearm, elbow, wrist);
    arm.hand.position.copy(wrist);
    arm.hand.quaternion.set(...pose.quat);

    const j = pose.joints;
    arm.fingers.forEach((f, i) => {
      f.base.rotation.copy(fingerBaseEuler(j[i * 4], j[i * 4 + 1]));
      f.mid.rotation.x = j[i * 4 + 2];
      f.tip.rotation.x = j[i * 4 + 3];
    });
    arm.thumb.base.rotation.copy(thumbBaseEuler(j[16], j[17], j[18]));
    arm.thumb.mid.rotation.x = j[19];
    arm.thumb.tip.rotation.x = j[20];
  }

  private applyFace(face: FacePose, time: number) {
    // Blinks every few seconds, each a sixth of a second.
    if (time > this.nextBlink) {
      this.blinkAt = time;
      this.nextBlink = time + 2.2 + Math.random() * 3.2;
    }
    const b = (time - this.blinkAt) / 0.16;
    const blink = b >= 0 && b <= 1 ? Math.sin(b * Math.PI) : 0;
    for (const lid of this.lids) lid.rotation.x = -0.5 + blink * 0.95 - face.brows * 0.08;

    for (const brow of this.brows) {
      const side = brow.userData.side as number;
      const furrow = face.brows < 0 ? -face.brows * 0.22 : -face.brows * 0.06;
      brow.rotation.z = Math.PI / 2 + side * furrow;
      brow.position.y = 0.036 + face.brows * 0.0065;
      brow.position.x = side * (0.031 - Math.max(-face.brows, 0) * 0.0025);
    }

    // Lips are rows of beads along a curve, so they can widen, round and
    // open without new geometry.
    const half = 0.017 * (1 + 0.3 * face.wide - 0.38 * face.round);
    const open = face.open * 0.012 + face.round * 0.004;
    const forward = face.round * 0.005;
    const row = (lip: Lip, y: number, radius: number, cupid: number) => {
      for (let i = 0; i < lip.count; i++) {
        const s = (i / (lip.count - 1)) * 2 - 1;
        const curve = face.wide * 0.0055 * s * s - cupid * (1 - s * s);
        this.v.set(s * half, y + curve, forward - 0.007 * s * s);
        this.m.compose(this.v, this.q.identity(), this.sc.setScalar(radius * (1 - 0.45 * s * s)));
        lip.mesh.setMatrixAt(i, this.m);
      }
      lip.mesh.instanceMatrix.needsUpdate = true;
    };
    const full = this.lipFullness;
    row(this.lips.upper, 0.0032 * full, 0.0041 * full, -0.001);
    row(this.lips.lower, -0.0034 * full - open, 0.005 * full, 0.0016);
    this.lips.inner.scale.set(half * 0.92, 0.0012 + open * 0.55, 0.005);
    this.lips.inner.position.y = -open / 2;
    const teeth = face.open > 0.15 ? 1 : 0;
    this.lips.teeth.scale.set(half * 0.68 * teeth, 0.0028 * teeth, 0.004 * teeth);
  }

  /** Puts the avatar in a pose. `time` drives breathing and blinking. */
  update(pose: Pose, time: number) {
    this.body.position.y = Math.sin(time * 1.5) * 0.002;
    this.body.rotation.y = Math.sin(time * 0.37) * 0.012;
    this.body.rotation.z = Math.sin(time * 0.29) * 0.005;

    this.applyArm(this.arms.r, pose.r);
    this.applyArm(this.arms.l, pose.l);

    this.head.rotation.set(
      pose.head.nod + Math.sin(time * 0.6) * 0.01,
      pose.head.turn + Math.sin(time * 0.23) * 0.025,
      pose.head.tilt,
    );
    // The eyes stay on the viewer as the head turns.
    for (const eye of this.eyes) eye.rotation.set(-pose.head.nod * 0.6, -this.head.rotation.y * 0.7, 0);
    this.applyFace(pose.face, time);
  }

  dispose() {
    const geometries = new Set<BufferGeometry>();
    const materials = new Set<Material>();
    this.root.traverse((o) => {
      if (o instanceof Mesh) {
        geometries.add(o.geometry);
        (Array.isArray(o.material) ? o.material : [o.material]).forEach((m: Material) => materials.add(m));
      }
      if (o instanceof InstancedMesh) o.dispose();
    });
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    this.root.removeFromParent();
  }
}
