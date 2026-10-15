// Writes the seed content into the dataset: the documents in seed.ndjson,
// and one document per page holding its original wording (lib/copy/pages).
//
//   pnpm sanity:seed            creates the documents the dataset lacks
//   pnpm sanity:seed --replace  overwrites every seed document
//
// The default never changes a document that exists, so it is safe to run
// against a dataset editors work in: it only adds the fields a page
// document lacks (text added to the page in code since), leaving every
// existing field as the editors left it. Images are given as
// "_sanityAsset": "image@file://./public/…" and uploaded once each.
// Needs SANITY_API_TOKEN (Editor) in web/.env.local; see docs/cms.md.
import { readFileSync } from "node:fs";
import { basename, join } from "node:path";

import { createClient } from "@sanity/client";

import type { CopyTree } from "../../lib/copy/overlay";
import { PAGES, pageDocumentId, pageTypeName, type PageKey } from "../../lib/copy/pages";
import { SANITY_API_VERSION } from "../apiVersion";
import { dataset, projectId } from "../env";

type Doc = { _id: string; _type: string; [field: string]: unknown };

const token = process.env.SANITY_API_TOKEN;
if (!projectId || !token) {
  console.error("Set NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN in web/.env.local.");
  process.exit(1);
}

const client = createClient({ projectId, dataset, token, apiVersion: SANITY_API_VERSION, useCdn: false });
const replace = process.argv.includes("--replace");
const pages: Doc[] = (Object.keys(PAGES) as PageKey[]).map((key) => ({
  _id: pageDocumentId(key),
  _type: pageTypeName(key),
  ...PAGES[key].copy,
}));
const seed: Doc[] = [
  ...readFileSync(join(import.meta.dirname, "seed.ndjson"), "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line)),
  ...pages,
];

const uploads = new Map<string, Promise<string>>();
const upload = (path: string) => {
  if (!uploads.has(path)) {
    uploads.set(
      path,
      client.assets
        .upload("image", readFileSync(join(process.cwd(), path)), { filename: basename(path) })
        .then((asset) => asset._id),
    );
  }
  return uploads.get(path)!;
};

// Swaps every { _sanityAsset: "image@file://./path" } for an uploaded image.
async function withAssets(value: unknown): Promise<unknown> {
  if (Array.isArray(value)) return Promise.all(value.map(withAssets));
  if (!value || typeof value !== "object") return value;
  const { _sanityAsset, ...rest } = value as Record<string, unknown>;
  if (typeof _sanityAsset === "string") {
    const path = _sanityAsset.replace(/^image@file:\/\//, "");
    return { ...rest, asset: { _type: "reference", _ref: await upload(path) } };
  }
  const entries = await Promise.all(Object.entries(rest).map(async ([k, v]) => [k, await withAssets(v)]));
  return Object.fromEntries(entries);
}

// "hero.title" → "Open models", for every text in a page's copy.
const leaves = (tree: CopyTree, prefix = ""): [string, string | string[]][] =>
  Object.entries(tree).flatMap(([key, value]) =>
    typeof value === "string" || Array.isArray(value)
      ? [[`${prefix}${key}`, value] as [string, string | string[]]]
      : leaves(value, `${prefix}${key}.`),
  );

async function main() {
  const existing = new Set(
    await client.fetch<string[]>("*[_id in $ids]._id", { ids: seed.map((d) => d._id) }),
  );
  const todo = replace ? seed : seed.filter((doc) => !existing.has(doc._id));
  const transaction = client.transaction();
  if (!replace) {
    for (const key of Object.keys(PAGES) as PageKey[]) {
      const id = pageDocumentId(key);
      if (existing.has(id)) {
        transaction.patch(id, (patch) => patch.setIfMissing(Object.fromEntries(leaves(PAGES[key].copy))));
      }
    }
  }
  for (const doc of todo) {
    const ready = (await withAssets(doc)) as Doc;
    if (replace) transaction.createOrReplace(ready);
    else transaction.createIfNotExists(ready);
  }
  await transaction.commit();
  console.log(
    todo.length
      ? `${replace ? "Wrote" : "Created"} ${todo.length} document(s): ${todo.map((d) => d._id).join(", ")}`
      : "Every seed document is already in the dataset; page documents have any new fields.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
