// Builds the signing avatars in public/sign/avatars from the Microsoft
// Rocketbox library (MIT). For each character it downloads the rigged FBX
// with facial blendshapes, converts it to glTF, keeps the face shapes
// signing uses (renamed to their ARKit names) and the visemes for mouthing,
// swaps the textures for 1024px WebP and compresses with meshopt. The
// picker's portraits are then taken from the avatars by portraits.mjs.
//
//   cd web/scripts/sign-avatars && pnpm install --ignore-workspace && node build.mjs
//
// Needs ImageMagick 7 (`magick`) on the PATH.

import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir, type } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS, EXTTextureWebP } from "@gltf-transform/extensions";
import { dedup, meshopt, prune } from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "../../public/sign/avatars");
const work = join(tmpdir(), "sign-avatars");
const REPO = "microsoft/Microsoft-Rocketbox";
const RAW = `https://raw.githubusercontent.com/${REPO}/master/Assets/Avatars`;

// Okello's skin tone, from his face and neck texture.
const DEEP_BROWN = [84, 55, 39];

// Parts of a Rocketbox head texture that are not skin, as rectangles on the
// 1024px texture: the eyes and mouth down the left, jewellery along the
// bottom.
const HEAD_ATLAS = ["0,614 287,1023", "0,752 1023,1023"];

// The inside of the mouth (tongue, gums and teeth) in a head texture, which
// is shaded darker: the avatars cast no shadows, so an open mouth would
// otherwise be lit as brightly as the face.
const MOUTH_INSIDE = "205x340+0+684";

// Our id → the Rocketbox avatar it is drawn from, and a skin tone to give
// it where the library's differs from the one wanted. lib/sign/characters.ts
// names them and describes them.
const CAST = {
  okello: { source: "Adults/Male_Adult_12" },
  achieng: { source: "Adults/Female_Party_02", skin: DEEP_BROWN },
  amani: { source: "Professions/Business_Male_05" },
  nakato: { source: "Professions/Business_Female_01" },
};

// The ARKit face shapes kept: brows and eyes for the grammar of questions
// and feeling, mouth shapes for mouthing and expression.
const KEEP = [
  "BrowDownLeft", "BrowDownRight", "BrowInnerUp", "BrowOuterUpLeft", "BrowOuterUpRight",
  "CheekPuff", "EyeBlinkLeft", "EyeBlinkRight", "EyeSquintLeft", "EyeSquintRight",
  "EyeWideLeft", "EyeWideRight", "JawOpen", "MouthClose", "MouthFunnel", "MouthPucker",
  "MouthSmileLeft", "MouthSmileRight", "MouthFrownLeft", "MouthFrownRight",
  "MouthStretchLeft", "MouthStretchRight", "MouthRollLower", "MouthPressLeft", "MouthPressRight",
];

// The visemes, mouth shapes for speech sounds, for mouthing words while
// signing. Kept under their Oculus names (viseme_PP, viseme_aa, …); the
// silent one is left out.
const VISEMES = ["PP", "FF", "TH", "DD", "KK", "CH", "SS", "nn", "RR", "aa", "E", "I", "O", "U"];

const fbx2gltf = join(
  dirname(createRequire(import.meta.url).resolve("fbx2gltf/package.json")),
  "bin",
  type(),
  type() === "Windows_NT" ? "FBX2glTF.exe" : "FBX2glTF",
);

async function download(url, file) {
  if (existsSync(file)) return;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
}

/** The avatar's texture files, listed once and kept with the downloads. */
async function textureNames(source, dir) {
  const cache = join(dir, "textures.json");
  if (existsSync(cache)) return JSON.parse(readFileSync(cache, "utf8"));
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/Assets/Avatars/${source}/Textures`);
  if (!res.ok) throw new Error(`${res.status} listing ${source}`);
  const names = (await res.json()).map((f) => f.name);
  writeFileSync(cache, JSON.stringify(names));
  return names;
}

const magick = (...args) => execFileSync("magick", args, { stdio: "inherit" });

/**
 * Gives an image's skin a new tone. Skin is picked out by colour (a warm
 * hue, some saturation, not dark), which leaves hair, eyes and dark clothes
 * alone, and is multiplied toward the target so its shading and detail
 * stay. `skip` lists rectangles to leave alone; `light` is the least
 * lightness counted as skin.
 */
function reskin(file, target, { skip = [], light = 0.32 } = {}) {
  const mask = `${file}.mask.png`;
  magick(
    file, "-alpha", "off", "-colorspace", "HSL",
    "-fx", `((u.r<0.11||u.r>0.95)&&u.g>0.18&&u.b>${light})?1:0`,
    "-channel", "R", "-separate", "+channel",
    ...skip.flatMap((r) => ["-fill", "black", "-draw", `rectangle ${r}`]),
    "-blur", "0x1.5", mask,
  );
  const mean = execFileSync(
    "magick",
    [file, "-alpha", "off", mask, "-compose", "CopyOpacity", "-composite", "-scale", "1x1!", "-format", "%[fx:255*u.r] %[fx:255*u.g] %[fx:255*u.b]", "info:"],
    { encoding: "utf8" },
  ).trim().split(" ").map(Number);
  const [r, g, b] = target.map((t, i) => String(t / mean[i]));
  magick(
    file,
    "(", "+clone", "-channel", "R", "-evaluate", "multiply", r, "-channel", "G", "-evaluate", "multiply", g,
    "-channel", "B", "-evaluate", "multiply", b, "+channel", ")",
    mask, "-composite", file,
  );
}

async function build(id, { source, skin }) {
  const name = source.split("/").pop();
  const dir = join(work, id);
  mkdirSync(dir, { recursive: true });
  console.log(`${id}: ${name}`);

  const fbx = join(dir, `${name}_facial.fbx`);
  await download(`${RAW}/${source}/Export/${name}_facial.fbx`, fbx);

  // Textures: colour and normal maps for body and head, and the hair and
  // lashes with their alpha. Specular maps are left out.
  const textures = {};
  for (const file of await textureNames(source, dir)) {
    const m = file.match(/_(body|head)_(color|normal)\.tga$|_(opacity)_color\.tga$/);
    if (!m) continue;
    const key = m[3] ? "opacity" : `${m[1]}_${m[2]}`;
    const tga = join(dir, file);
    await download(`${RAW}/${source}/Textures/${file}`, tga);
    const png = join(dir, `${key}.png`);
    magick(tga, "-resize", "1024x1024", png);
    if (skin && key.endsWith("color") && key !== "opacity") reskin(png, skin, { skip: key === "head_color" ? HEAD_ATLAS : [] });
    if (key === "head_color") magick(png, "-region", MOUTH_INSIDE, "-evaluate", "multiply", "0.4", "+region", png);
    const webp = join(dir, `${key}.webp`);
    const quality = key.endsWith("normal") ? "90" : "84";
    magick(png, "-quality", quality, "-define", "webp:alpha-quality=90", webp);
    textures[key] = readFileSync(webp);
  }

  // FBX → glTF. The blendshape names come from the converter's verbose log,
  // in the order the targets are written.
  const raw = join(dir, "raw");
  const run = spawnSync(fbx2gltf, ["-v", "--binary", "-i", fbx, "-o", raw], { encoding: "utf8" });
  if (run.status !== 0) throw new Error(run.stderr || run.stdout);
  const log = run.stdout + run.stderr;
  const channels = [...log.matchAll(/blendshape channel: [^.]+\.(\S+)/g)].map((m) => m[1]);

  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ "meshopt.encoder": MeshoptEncoder, "meshopt.decoder": MeshoptDecoder });
  const doc = await io.read(`${raw}.glb`);
  const root = doc.getRoot();

  for (const mesh of root.listMeshes()) {
    const count = mesh.listPrimitives()[0]?.listTargets().length ?? 0;
    const order = channels.slice(0, count);
    const keep = [];
    order.forEach((channel, i) => {
      const m = channel.match(/^AK_\d+_(.+)$/);
      if (m && KEEP.includes(m[1])) keep.push({ i, name: m[1][0].toLowerCase() + m[1].slice(1) });
      const v = channel.match(/^AA_VI_\d+_(.+)$/);
      if (v && VISEMES.includes(v[1])) keep.push({ i, name: `viseme_${v[1] === "KK" ? "kk" : v[1]}` });
    });
    for (const prim of mesh.listPrimitives()) {
      const targets = prim.listTargets();
      keep.forEach((k) => targets[k.i].setName(k.name));
      const kept = new Set(keep.map((k) => targets[k.i]));
      for (const t of targets) if (!kept.has(t)) prim.removeTarget(t);
      prim.setAttribute("COLOR_0", null);
    }
    // The writer names a mesh's targets (extras.targetNames) from the
    // targets themselves, so they are named above.
    mesh.setWeights(keep.map(() => 0));
    console.log(`  ${keep.length} face shapes and visemes`);
  }
  for (const animation of root.listAnimations()) animation.dispose();

  const texture = (key) =>
    doc.createTexture(key).setImage(textures[key]).setMimeType("image/webp");
  for (const material of root.listMaterials()) {
    const part = material.getName().match(/_(body|head|opacity)$/)?.[1];
    material.setMetallicFactor(0).setRoughnessFactor(0.72);
    if (part === "body" || part === "head") {
      material.setBaseColorTexture(texture(`${part}_color`));
      material.setNormalTexture(texture(`${part}_normal`));
    } else if (part === "opacity") {
      material.setBaseColorTexture(texture("opacity"));
      material.setAlphaMode("MASK").setAlphaCutoff(0.35).setDoubleSided(true);
    }
  }

  doc.createExtension(EXTTextureWebP).setRequired(true);
  // Meshopt compression: face shapes move only part of the face, and the
  // rest of each compresses to almost nothing.
  await doc.transform(prune(), dedup(), meshopt({ encoder: MeshoptEncoder, level: "medium" }));
  await io.write(join(out, `${id}.glb`), doc);
}

await MeshoptEncoder.ready;
await MeshoptDecoder.ready;
mkdirSync(out, { recursive: true });
for (const [id, entry] of Object.entries(CAST)) await build(id, entry);
copyFileSync(join(here, "LICENSE.md"), join(out, "LICENSE.md"));
console.log(`Wrote ${Object.keys(CAST).length} avatars to ${out}`);
