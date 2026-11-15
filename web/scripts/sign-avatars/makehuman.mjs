// Builds MakeHuman signers into public/sign/avatars with Blender and MPFB
// (MakeHuman for Blender). MakeHuman's core assets are CC0. For each
// character makehuman.py builds and exports the human, then the textures
// become WebP, only the face shapes and visemes signing uses are kept, the
// materials are set for the web, and the file is compressed with meshopt.
//
// One-time setup: install the MPFB extension in Blender, then load three
// asset packs (MPFB tab → Apply assets → Library settings → Load pack): the
// MakeHuman system assets, faceunits01 and visemes02, from
// https://static.makehumancommunity.org/assets/assetpacks.html. Then:
//
//   cd web/scripts/sign-avatars && pnpm install --ignore-workspace && node makehuman.mjs
//
// Needs `blender` (with MPFB) and ImageMagick 7 (`magick`) on the PATH.

import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS, EXTTextureWebP } from "@gltf-transform/extensions";
import { dedup, meshopt, prune } from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";

import { FACE_SHAPES, VISEMES } from "./face-shapes.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "../../public/sign/avatars");
const work = join(tmpdir(), "sign-avatars", "makehuman");

/** An MPFB human: a body from MakeHuman's macro sliders (each 0–1), and
 * assets from the system pack by folder name. */
const human = ({ phenotype, skin, hair, eyebrows, clothes }) => ({
  phenotype: {
    age: 0.5, gender: 0.5, height: 0.5, muscle: 0.5, weight: 0.5, proportions: 0.5, cupsize: 0.5, firmness: 0.5,
    race: { african: 1, asian: 0, caucasian: 0 },
    ...phenotype,
  },
  skin_mhmat: `skins/${skin}/${skin}.mhmat`,
  skin_material_type: "GAMEENGINE",
  eyes: "eyes/high-poly/high-poly.mhclo",
  eyes_material_type: "MAKESKIN",
  eyes_material_settings: {},
  alternative_materials: {},
  eyebrows: `eyebrows/${eyebrows}/${eyebrows}.mhclo`,
  eyelashes: "eyelashes/eyelashes01/eyelashes01.mhclo",
  teeth: "teeth/teeth_base/teeth_base.mhclo",
  tongue: "tongue/tongue01/tongue01.mhclo",
  hair: `hair/${hair}/${hair}.mhclo`,
  clothes: clothes.map((c) => `clothes/${c}/${c}.mhclo`),
  clothes_material_type: "GAMEENGINE",
  proxy: "",
  rig: "default",
  targets: [],
  expressions: [],
  makeup: [],
  color_adjustments: {},
  skin_material_settings: {},
});

// Our id → the human it is built from. lib/sign/characters.ts names them.
const CAST = {
  kato: human({
    phenotype: { gender: 1, age: 0.45, height: 0.55, muscle: 0.55, proportions: 0.6 },
    skin: "young_african_male",
    hair: "short01",
    eyebrows: "eyebrow001",
    clothes: ["male_elegantsuit01", "shoes01"],
  }),
};

const magick = (...args) => execFileSync("magick", args, { stdio: "inherit" });

/** Parts drawn as see-through cards: their edges are cut out, not blended. */
const CARDS = /eyebrow|eyelashes|hair|short\d|afro|bob\d|braid|long\d|ponytail/;

async function build(id, preset) {
  const dir = join(work, id);
  mkdirSync(dir, { recursive: true });
  console.log(`${id}: building in Blender`);
  const presetFile = join(dir, "preset.json");
  writeFileSync(presetFile, JSON.stringify(preset, null, 2));
  const raw = join(dir, "raw.glb");
  execFileSync("blender", ["--background", "--python", join(here, "makehuman.py"), "--", presetFile, raw], {
    stdio: ["ignore", "ignore", "inherit"],
  });

  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ "meshopt.encoder": MeshoptEncoder, "meshopt.decoder": MeshoptDecoder });
  const doc = await io.read(raw);
  const root = doc.getRoot();
  const wanted = new Set([...FACE_SHAPES, ...VISEMES]);

  for (const mesh of root.listMeshes()) {
    const names = mesh.getExtras()?.targetNames ?? [];
    const keep = names.flatMap((name, i) => (wanted.has(name) ? [{ i, name }] : []));
    for (const prim of mesh.listPrimitives()) {
      const targets = prim.listTargets();
      keep.forEach((k) => targets[k.i].setName(k.name));
      const kept = new Set(keep.map((k) => targets[k.i]));
      for (const t of targets) if (!kept.has(t)) prim.removeTarget(t);
      prim.setAttribute("COLOR_0", null);
    }
    mesh.setWeights(keep.map(() => 0));
    mesh.setExtras({ ...mesh.getExtras(), targetNames: keep.map((k) => k.name) });
  }

  // Textures as WebP: the skin at 2048px, as it covers the whole body and
  // the face is a small part of it; everything else at 1024px.
  for (const texture of root.listTextures()) {
    const name = texture.getName() || "texture";
    const png = join(dir, `${name}.png`);
    const webp = join(dir, `${name}.webp`);
    writeFileSync(png, texture.getImage());
    const size = /skinned|african|caucasian|asian/.test(name) ? "2048x2048>" : "1024x1024>";
    const quality = name.endsWith("normal") ? "90" : "84";
    magick(png, "-resize", size, "-quality", quality, "-define", "webp:alpha-quality=90", webp);
    texture.setImage(readFileSync(webp)).setMimeType("image/webp");
  }

  // Blender writes every material as blended. Skin, teeth and clothes are
  // solid; hair, brows and lashes are cut out; the eyes stay blended, for
  // the clear cornea over the iris.
  for (const material of root.listMaterials()) {
    material.setMetallicFactor(0);
    if (CARDS.test(material.getName())) {
      material.setAlphaMode("MASK").setAlphaCutoff(0.4).setDoubleSided(true);
    } else if (/high-poly|low-poly/.test(material.getName())) {
      material.setAlphaMode("BLEND");
    } else {
      material.setAlphaMode("OPAQUE");
    }
    if (material.getName().endsWith(".body")) material.setRoughnessFactor(0.62);
  }

  doc.createExtension(EXTTextureWebP).setRequired(true);
  await doc.transform(prune(), dedup(), meshopt({ encoder: MeshoptEncoder, level: "medium" }));
  await io.write(join(out, `${id}.glb`), doc);
  console.log(`  wrote ${id}.glb`);
}

await MeshoptEncoder.ready;
await MeshoptDecoder.ready;
mkdirSync(out, { recursive: true });
for (const [id, preset] of Object.entries(CAST)) await build(id, preset);
copyFileSync(join(here, "LICENSE.md"), join(out, "LICENSE.md"));
