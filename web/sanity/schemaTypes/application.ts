import { LaunchIcon } from "@sanity/icons/Launch";
import { defineField, defineType } from "sanity";

import { logoFields, tagList } from "./parts";

// An application CommonMind powers, shown on the home page and /applications.
export const application = defineType({
  name: "application",
  title: "Application",
  type: "document",
  icon: LaunchIcon,
  fields: [
    defineField({ name: "name", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "href", title: "Website", type: "url", validation: (rule) => rule.required() }),
    defineField({
      name: "domain",
      type: "string",
      description: 'The site\'s address as the card\'s link names it, e.g. "thewatchtower.tech".',
      validation: (rule) => rule.required(),
    }),
    ...logoFields,
    defineField({
      name: "description",
      type: "text",
      rows: 3,
      description: "The project's own description, from its site or README.",
      validation: (rule) => rule.required(),
    }),
    tagList("tags", "Tags"),
    defineField({
      name: "order",
      type: "number",
      description: "Position in the list; lower comes first.",
      validation: (rule) => rule.required().integer(),
    }),
  ],
  orderings: [{ title: "List order", name: "order", by: [{ field: "order", direction: "asc" }] }],
  preview: { select: { title: "name", subtitle: "domain", media: "logo" } },
});
