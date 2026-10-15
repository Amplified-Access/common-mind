// Writes the seed content into the dataset: the documents in seed.ndjson,
// and one document per page holding its original wording (lib/copy/pages).
//
//   pnpm sanity:seed            creates the documents the dataset lacks
//   pnpm sanity:seed --replace  overwrites every seed document
//
// The default never touches a document that exists, so it is safe to run
// against a dataset editors work in. Images are given as
// "_sanityAsset": "image@file://./public/…" and uploaded once each.
// Needs SANITY_API_TOKEN (Editor) in web/.env.local; see docs/cms.md.
import { readFileSync } from "node:fs";
import { basename, join } from "node:path";

import { createClient } from "@sanity/client";

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

async function main() {
  const existing = new Set(
    await client.fetch<string[]>("*[_id in $ids]._id", { ids: seed.map((d) => d._id) }),
  );
  const todo = replace ? seed : seed.filter((doc) => !existing.has(doc._id));
  if (todo.length === 0) {
    console.log("Every seed document is already in the dataset.");
    return;
  }
  const transaction = client.transaction();
  for (const doc of todo) {
    const ready = (await withAssets(doc)) as Doc;
    if (replace) transaction.createOrReplace(ready);
    else transaction.createIfNotExists(ready);
  }
  await transaction.commit();
  console.log(`${replace ? "Wrote" : "Created"} ${todo.length} document(s): ${todo.map((d) => d._id).join(", ")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
