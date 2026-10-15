import { DocumentTextIcon } from "@sanity/icons";
import { defineArrayMember, defineField, defineType } from "sanity";

import { tagList } from "./parts";

// A technical report, published at /research/<slug> and listed on the
// research index.
export const publication = defineType({
  name: "publication",
  title: "Research report",
  type: "document",
  icon: DocumentTextIcon,
  groups: [
    { name: "article", title: "Article", default: true },
    { name: "card", title: "Index card" },
  ],
  fields: [
    defineField({ name: "title", type: "string", group: "article", validation: (rule) => rule.required() }),
    defineField({
      name: "slug",
      type: "slug",
      group: "article",
      description: "The report's address: /research/<slug>.",
      options: { source: "title" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "dek",
      title: "Summary",
      type: "text",
      rows: 3,
      group: "article",
      description: "The sentence under the title.",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "date", type: "date", group: "article", validation: (rule) => rule.required() }),
    defineField({
      ...tagList(
        "tags",
        "Tags",
        'Language names ("Luganda") link the report to that language\'s page; the rest are topics.',
      ),
      group: "article",
    }),
    defineField({
      name: "sections",
      type: "array",
      group: "article",
      of: [
        defineArrayMember({
          type: "object",
          name: "section",
          fields: [
            defineField({ name: "heading", type: "string", validation: (rule) => rule.required() }),
            defineField({
              name: "paragraphs",
              type: "array",
              of: [defineArrayMember({ type: "text", rows: 5 })],
              validation: (rule) => rule.required().min(1),
            }),
          ],
          preview: { select: { title: "heading" } },
        }),
      ],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: "results",
      type: "object",
      group: "article",
      description: "The scores table beside the article. Leave empty for none.",
      fields: [
        defineField({ name: "caption", type: "string" }),
        defineField({
          name: "rows",
          type: "array",
          of: [
            defineArrayMember({
              type: "object",
              name: "resultRow",
              fields: [
                defineField({ name: "label", type: "string", validation: (rule) => rule.required() }),
                defineField({ name: "before", type: "string", description: "The base model's score, if compared." }),
                defineField({ name: "after", type: "string", validation: (rule) => rule.required() }),
              ],
              preview: { select: { title: "label", subtitle: "after" } },
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: "sources",
      type: "array",
      group: "article",
      of: [defineArrayMember({ type: "link" })],
    }),
    defineField({
      name: "card",
      title: "Index card",
      type: "object",
      group: "card",
      description: "How the report reads as a card on the research index.",
      fields: [
        defineField({ name: "title", type: "string", description: "Leave empty to use the report's title." }),
        defineField({ name: "description", type: "text", rows: 3, validation: (rule) => rule.required() }),
        tagList("tags", "Tags"),
      ],
    }),
  ],
  orderings: [{ title: "Newest first", name: "dateDesc", by: [{ field: "date", direction: "desc" }] }],
  preview: { select: { title: "title", subtitle: "date" } },
});
