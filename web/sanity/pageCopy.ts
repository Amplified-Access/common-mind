import { DocumentIcon } from "@sanity/icons/Document";
import { defineArrayMember, defineField, defineType, type FieldDefinition } from "sanity";

import type { CopyTree, CopyValue } from "../lib/copy/overlay";
import { PAGES, pageTypeName, type PageKey } from "../lib/copy/pages";

// The pages' words, one document each, generated from their original
// wording in lib/copy/pages: every group is a collapsible section and every
// text a field with the same key. The site lays the published text over the
// original, so an emptied field shows the original wording again.

// "titleLine1" → "Title line 1"
const spell = (key: string) => {
  const words = key
    .replace(/([a-z])([A-Z0-9])/g, "$1 $2")
    .replace(/([0-9])([A-Za-z])/g, "$1 $2")
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

const HIGHLIGHT_HELP = "Put *stars* around words to highlight them.";

function field(name: string, original: CopyValue): FieldDefinition {
  if (typeof original === "string") {
    const long = original.length > 90 || original.includes("\n");
    return defineField({
      name,
      title: spell(name),
      type: long ? "text" : "string",
      ...(long && { rows: Math.min(6, Math.ceil(original.length / 90) + 1) }),
      placeholder: original,
      description: original.includes("*") ? HIGHLIGHT_HELP : undefined,
    });
  }
  if (Array.isArray(original)) {
    return defineField({
      name,
      title: spell(name),
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      options: { layout: "tags" },
    });
  }
  return defineField({
    name,
    title: spell(name),
    type: "object",
    options: { collapsible: true, collapsed: true },
    fields: fields(original),
  });
}

const fields = (tree: CopyTree) => Object.entries(tree).map(([name, value]) => field(name, value));

export const pageTypes = (Object.keys(PAGES) as PageKey[]).map((key) =>
  defineType({
    name: pageTypeName(key),
    title: `${PAGES[key].title} page`,
    type: "document",
    icon: DocumentIcon,
    description: "Leave a field empty to use its original wording.",
    fields: fields(PAGES[key].copy),
    preview: { prepare: () => ({ title: PAGES[key].title }) },
  }),
);

export const PAGE_TYPES = new Set(pageTypes.map((type) => type.name));
