import { CubeIcon } from "@sanity/icons/Cube";
import { defineArrayMember, defineField, defineType } from "sanity";

import { registryModels } from "../../components/models/registry";

// A model's written copy for its page at /models/<slug>. The model itself
// (name, base, scores, availability) is in the registry in code
// (components/models/registry.ts), so a new model starts there; this
// document adds the words around it.
const nameOf = (slug?: string) => registryModels.find((m) => m.slug === slug)?.name;

export const model = defineType({
  name: "model",
  title: "Model",
  type: "document",
  icon: CubeIcon,
  fields: [
    defineField({
      name: "slug",
      title: "Model",
      type: "string",
      description: "Which model in the registry this copy is for.",
      options: { list: registryModels.map((m) => ({ title: m.name, value: m.slug })) },
      readOnly: ({ document }) => Boolean(document?._createdAt && document?.slug),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "tagline",
      type: "text",
      rows: 2,
      description: "One sentence, without a closing full stop; the page adds it.",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "overview", type: "text", rows: 5, validation: (rule) => rule.required() }),
    defineField({
      name: "metrics",
      type: "array",
      description: "The figures in the model page's header.",
      of: [
        defineArrayMember({
          type: "object",
          name: "metric",
          fields: [
            defineField({ name: "value", type: "string", validation: (rule) => rule.required() }),
            defineField({ name: "label", type: "string", validation: (rule) => rule.required() }),
          ],
          preview: { select: { title: "value", subtitle: "label" } },
        }),
      ],
    }),
    defineField({ name: "capabilities", type: "array", of: [defineArrayMember({ type: "string" })] }),
    defineField({
      name: "achievements",
      title: "Highlights",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
    }),
    defineField({
      name: "usage",
      title: "Python usage example",
      type: "object",
      fields: [
        defineField({ name: "language", type: "string", initialValue: "python", hidden: true }),
        defineField({ name: "code", type: "text", rows: 20, validation: (rule) => rule.required() }),
      ],
    }),
  ],
  preview: {
    select: { slug: "slug", tagline: "tagline" },
    prepare: ({ slug, tagline }) => ({ title: nameOf(slug) ?? slug, subtitle: tagline }),
  },
});
