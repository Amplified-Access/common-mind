import { DatabaseIcon } from "@sanity/icons/Database";
import { defineArrayMember, defineField, defineType } from "sanity";

import { languages } from "../../components/languages/data";
import { registryModels } from "../../components/models/registry";

import { tagList } from "./parts";

export const DATASET_KINDS = [
  "Parallel",
  "Instruction",
  "Question Answering",
  "Monolingual",
  "Evaluation",
] as const;

// An open dataset behind the models, listed at /datasets with its own page.
export const dataset = defineType({
  name: "dataset",
  title: "Dataset",
  type: "document",
  icon: DatabaseIcon,
  fields: [
    defineField({ name: "name", type: "string", validation: (rule) => rule.required() }),
    defineField({
      name: "slug",
      type: "slug",
      description: "The page's address: /datasets/<slug>.",
      options: { source: "name" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "kind",
      type: "string",
      options: { list: [...DATASET_KINDS] },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "languages",
      type: "array",
      description: "The languages it contributes, besides English.",
      of: [defineArrayMember({ type: "string" })],
      options: { list: languages.map((l) => l.name) },
      validation: (rule) => rule.required().min(1),
    }),
    tagList("domains", "Domains", "Subject areas, where the source describes them."),
    defineField({
      name: "source",
      type: "string",
      description: 'Where it is published, e.g. "Hugging Face".',
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "href", title: "Link", type: "url", validation: (rule) => rule.required() }),
    defineField({ name: "description", type: "text", rows: 3, validation: (rule) => rule.required() }),
    defineField({
      name: "used",
      type: "string",
      description: "How much of it the models used, as reported in the technical reports.",
    }),
    defineField({
      name: "usedBy",
      title: "Used by",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      options: { list: registryModels.map((m) => m.name) },
    }),
    defineField({
      name: "order",
      type: "number",
      description: "Position in the datasets list; lower comes first.",
      validation: (rule) => rule.required().integer(),
    }),
  ],
  orderings: [{ title: "List order", name: "order", by: [{ field: "order", direction: "asc" }] }],
  preview: { select: { title: "name", subtitle: "kind" } },
});
