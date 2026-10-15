import { RocketIcon } from "@sanity/icons/Rocket";
import { defineField, defineType } from "sanity";

import { tagList } from "./parts";

// A model release, listed on the research index's timeline.
export const release = defineType({
  name: "release",
  title: "Model release",
  type: "document",
  icon: RocketIcon,
  fields: [
    defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "date", type: "date", validation: (rule) => rule.required() }),
    defineField({ name: "description", type: "text", rows: 3, validation: (rule) => rule.required() }),
    defineField({
      name: "href",
      title: "Link",
      type: "string",
      description: 'The released model\'s page, e.g. "/models/swahili-nllb-1-3b".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "card",
      title: "Index card",
      type: "object",
      description: "How the release reads as a card on the research index.",
      fields: [
        defineField({ name: "title", type: "string", description: "Leave empty to use the release's title." }),
        defineField({ name: "description", type: "text", rows: 3, validation: (rule) => rule.required() }),
        tagList("tags", "Tags"),
        defineField({
          name: "cta",
          title: "Button text",
          type: "string",
          validation: (rule) => rule.required(),
        }),
      ],
    }),
  ],
  orderings: [{ title: "Newest first", name: "dateDesc", by: [{ field: "date", direction: "desc" }] }],
  preview: { select: { title: "title", subtitle: "date" } },
});
