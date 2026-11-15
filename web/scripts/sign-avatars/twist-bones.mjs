// Gives a Biped skeleton twist bones in each forearm. A Rocketbox avatar's
// forearm is one bone, so turning the wrist palm-up turns the whole forearm
// with it and the sleeve wrings at the elbow. In a real arm the twist grows
// along the forearm, from none at the elbow to all of it at the wrist.
//
// Three twist bones sit on the forearm bone; the web app turns them by a
// third, two thirds and all of the wrist's twist (rigged-avatar.ts). Each
// forearm vertex is weighted between the two bones either side of how far
// along the forearm it is. Steps of a third keep neighbouring bones close
// enough in angle that the skin between them keeps its volume: one bone
// taking a half turn would pinch the sleeve flat halfway down.

export const TWIST_BONES = 3;
const ZERO_AT = 0.1; // of the way from the elbow: no twist before here
const FULL_AT = 0.95; // all of it from here on

/** Where a joint sits in the bind pose: the translation of the inverse of
 * its (affine, column-major) inverse bind matrix. */
function bindPosition(ibm) {
  const [a, b, c, , d, e, f, , g, h, i, , x, y, z] = ibm;
  // The inverse of the 3x3 part, applied to -t.
  const det = a * (e * i - f * h) - d * (b * i - c * h) + g * (b * f - c * e);
  const inv = [
    (e * i - f * h) / det, (c * h - b * i) / det, (b * f - c * e) / det,
    (f * g - d * i) / det, (a * i - c * g) / det, (c * d - a * f) / det,
    (d * h - e * g) / det, (b * g - a * h) / det, (a * e - b * d) / det,
  ];
  return [
    -(inv[0] * x + inv[3] * y + inv[6] * z),
    -(inv[1] * x + inv[4] * y + inv[7] * z),
    -(inv[2] * x + inv[5] * y + inv[8] * z),
  ];
}

/** Adds "Bip01 L ForeTwist1"… to every skin that has the forearms, and
 * shares the forearms' weights with them. */
export function addTwistBones(doc) {
  const root = doc.getRoot();
  const node = (name) => root.listNodes().find((n) => n.getName() === name);
  for (const side of ["L", "R"]) {
    // Weights already shared for this side (accessors can be shared).
    const done = new Set();
    const forearm = node(`Bip01 ${side} Forearm`);
    const hand = node(`Bip01 ${side} Hand`);
    if (!forearm || !hand) throw new Error(`No ${side} forearm and hand to add a twist bone to`);
    const twists = Array.from({ length: TWIST_BONES }, (_, n) => {
      const twist = doc.createNode(`Bip01 ${side} ForeTwist${n + 1}`);
      forearm.addChild(twist);
      return twist;
    });

    for (const skin of root.listSkins()) {
      const joints = skin.listJoints();
      const fi = joints.indexOf(forearm);
      const hi = joints.indexOf(hand);
      if (fi < 0 || hi < 0) continue;

      // The twist bones bind where the forearm does. Joint 0 of the steps
      // is the forearm itself.
      const ibms = skin.getInverseBindMatrices();
      const matrices = ibms.getArray();
      const forearmIbm = Array.from(matrices.slice(fi * 16, fi * 16 + 16));
      const elbow = bindPosition(forearmIbm);
      const wrist = bindPosition(Array.from(matrices.slice(hi * 16, hi * 16 + 16)));
      const steps = [fi];
      const grown = new Float32Array(matrices.length + 16 * TWIST_BONES);
      grown.set(matrices);
      twists.forEach((twist, n) => {
        steps.push(joints.length + n);
        skin.addJoint(twist);
        grown.set(forearmIbm, matrices.length + 16 * n);
      });
      ibms.setArray(grown);

      const along = wrist.map((w, k) => w - elbow[k]);
      const length2 = along.reduce((s, v) => s + v * v, 0);

      for (const mesh of root.listMeshes()) {
        for (const prim of mesh.listPrimitives()) {
          const J = prim.getAttribute("JOINTS_0");
          const W = prim.getAttribute("WEIGHTS_0");
          const P = prim.getAttribute("POSITION");
          if (!J || !W || !P || done.has(J)) continue;
          // Only primitives skinned by this skin.
          if (!root.listNodes().some((n) => n.getMesh() === mesh && n.getSkin() === skin)) continue;
          done.add(J);

          const j = [], w = [], p = [];
          for (let v = 0; v < J.getCount(); v++) {
            J.getElement(v, j);
            W.getElement(v, w);
            const k = j.findIndex((x, n) => x === fi && w[n] > 0);
            if (k < 0) continue;
            P.getElement(v, p);
            const t = p.reduce((s, x, n) => s + (x - elbow[n]) * along[n], 0) / length2;
            const u = Math.min(Math.max((t - ZERO_AT) / (FULL_AT - ZERO_AT), 0), 1) * TWIST_BONES;
            if (u < 0.001) continue;
            // Between step i and the next, a fraction f of the way.
            const i = Math.min(Math.floor(u), TWIST_BONES - 1);
            const f = u - i;

            const total = w[k];
            j[k] = steps[i];
            w[k] = total * (1 - f);
            // A free slot for the next step, or the weakest other one,
            // whose weight goes to this one.
            let slot = w.findIndex((x, n) => x === 0 && n !== k);
            if (slot < 0) {
              slot = w.reduce((m, x, n) => (n !== k && (m < 0 || x < w[m]) ? n : m), -1);
              w[k] += w[slot];
            }
            j[slot] = steps[i + 1];
            w[slot] = total * f;
            const sum = w.reduce((s, x) => s + x, 0);
            J.setElement(v, j);
            W.setElement(v, w.map((x) => x / sum));
          }
        }
      }
    }
  }
}
