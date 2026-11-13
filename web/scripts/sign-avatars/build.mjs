// Builds the signing avatars in public/sign/avatars from the Microsoft
// Rocketbox library (MIT). For each character it downloads the rigged FBX
// with facial blendshapes, converts it to glTF, keeps the face shapes
// signing uses (renamed to their ARKit names), swaps the textures for
// 1024px WebP, quantizes, and writes a small portrait for the picker.
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
import { dedup, prune, quantize } from "@gltf-transform/functions";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "../../public/sign/avatars");
const work = join(tmpdir(), "sign-avatars");
const REPO = "microsoft/Microsoft-Rocketbox";
const RAW = `https://raw.githubusercontent.com/${REPO}/master/Assets/Avatars`;

// Our id → the Rocketbox avatar it is drawn from. lib/sign/characters.ts
// names them and describes them.
const CAST = {
  nakato: "Professions/Business_Female_01",
  amani: "Professions/Business_Male_05",
  okello: "Adults/Male_Adult_12",
  achieng: "Adults/Female_Party_02",
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

async function textureNames(source) {
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/Assets/Avatars/${source}/Textures`);
  if (!res.ok) throw new Error(`${res.status} listing ${source}`);
  return (await res.json()).map((f) => f.name);
}

const magick = (...args) => execFileSync("magick", args, { stdio: "inherit" });

async function build(id, source) {
  const name = source.split("/").pop();
  const dir = join(work, id);
  mkdirSync(dir, { recursive: true });
  console.log(`${id}: ${name}`);

  const fbx = join(dir, `${name}_facial.fbx`);
  await download(`${RAW}/${source}/Export/${name}_facial.fbx`, fbx);
  await download(`${RAW}/${source}/${name}.png`, join(dir, "preview.png"));

  // Textures: colour and normal maps for body and head, and the hair and
  // lashes with their alpha. Specular maps are left out.
  const textures = {};
  for (const file of await textureNames(source)) {
    const m = file.match(/_(body|head)_(color|normal)\.tga$|_(opacity)_color\.tga$/);
    if (!m) continue;
    const key = m[3] ? "opacity" : `${m[1]}_${m[2]}`;
    const tga = join(dir, file);
    await download(`${RAW}/${source}/Textures/${file}`, tga);
    const webp = join(dir, `${key}.webp`);
    const quality = key.endsWith("normal") ? "90" : "84";
    magick(tga, "-resize", "1024x1024", "-quality", quality, "-define", "webp:alpha-quality=90", webp);
    textures[key] = readFileSync(webp);
  }

  // FBX → glTF. The blendshape names come from the converter's verbose log,
  // in the order the targets are written.
  const raw = join(dir, "raw");
  const run = spawnSync(fbx2gltf, ["-v", "--binary", "-i", fbx, "-o", raw], { encoding: "utf8" });
  if (run.status !== 0) throw new Error(run.stderr || run.stdout);
  const log = run.stdout + run.stderr;
  const channels = [...log.matchAll(/blendshape channel: [^.]+\.(\S+)/g)].map((m) => m[1]);

  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  const doc = await io.read(`${raw}.glb`);
  const root = doc.getRoot();

  for (const mesh of root.listMeshes()) {
    const count = mesh.listPrimitives()[0]?.listTargets().length ?? 0;
    const order = channels.slice(0, count);
    const keep = [];
    order.forEach((channel, i) => {
      const m = channel.match(/^AK_\d+_(.+)$/);
      if (m && KEEP.includes(m[1])) keep.push({ i, name: m[1][0].toLowerCase() + m[1].slice(1) });
    });
    for (const prim of mesh.listPrimitives()) {
      const targets = prim.listTargets();
      const kept = new Set(keep.map((k) => targets[k.i]));
      for (const t of targets) if (!kept.has(t)) prim.removeTarget(t);
      prim.setAttribute("COLOR_0", null);
    }
    mesh.setWeights(keep.map(() => 0));
    mesh.setExtras({ targetNames: keep.map((k) => k.name) });
    console.log(`  ${keep.length} face shapes`);
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
  await doc.transform(prune(), dedup(), quantize());
  await io.write(join(out, `${id}.glb`), doc);

  // A portrait for the picker: the head from the library's preview, with
  // the white backdrop cleared.
  magick(
    join(dir, "preview.png"),
    "-trim", "+repage",
    "-gravity", "north", "-crop", "44%x17%+0+0", "+repage",
    "-alpha", "set", "-bordercolor", "white", "-border", "1",
    "-fill", "none", "-fuzz", "7%", "-draw", "color 0,0 floodfill", "-shave", "1x1",
    "-gravity", "center", "-background", "none", "-extent", "%[fx:max(w,h)]x%[fx:max(w,h)]",
    "-resize", "160x160", "-quality", "86",
    join(out, `${id}.webp`),
  );
}

mkdirSync(out, { recursive: true });
for (const [id, source] of Object.entries(CAST)) await build(id, source);
copyFileSync(join(here, "LICENSE.md"), join(out, "LICENSE.md"));
console.log(`Wrote ${Object.keys(CAST).length} avatars to ${out}`);
