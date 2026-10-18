import { DocumentIcon } from "@sanity/icons/Document";
import { defineArrayMember, defineField, defineType } from "sanity";

import { logoFields } from "./parts";

// Everything in the footer under the call to action: the partner strip, the
// organization line, the link columns and the bottom row. One document, id
// "footer". The organization's name and website stay in Site settings.
export const footer = defineType({
  name: "footer",
  title: "Footer",
  type: "document",
  icon: DocumentIcon,
  groups: [
    { name: "text", title: "Text", default: true },
    { name: "partners", title: "Partners" },
    { name: "links", title: "Links" },
  ],
  fields: [
    defineField({
      name: "powering",
      type: "string",
      group: "text",
      description: 'The title beside the partner logos, e.g. "Powering:".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "initiative",
      type: "string",
      group: "text",
      description: "The line under the logo. The organization's name follows it, linked (Site settings → Identity).",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "copyright",
      type: "string",
      group: "text",
      description: "Follows © and the current year along the bottom.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "partners",
      type: "array",
      group: "partners",
      description: "The projects CommonMind powers or partners with, scrolling across the footer.",
      of: [
        defineArrayMember({
          type: "object",
          name: "partner",
          fields: [
            defineField({ name: "name", type: "string", validation: (rule) => rule.required() }),
            defineField({ name: "href", title: "Website", type: "url" }),
            ...logoFields,
          ],
          preview: { select: { title: "name", subtitle: "href", media: "logo" } },
        }),
      ],
    }),
    defineField({
      name: "columns",
      title: "Link columns",
      type: "array",
      group: "links",
      of: [
        defineArrayMember({
          type: "object",
          name: "footerColumn",
          fields: [
            defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
            defineField({ name: "links", type: "array", of: [defineArrayMember({ type: "link" })] }),
          ],
          preview: { select: { title: "title" } },
        }),
      ],
    }),
    defineField({
      name: "legalLinks",
      title: "Legal links",
      type: "array",
      group: "links",
      description: "The links along the bottom of the footer.",
      of: [defineArrayMember({ type: "link" })],
    }),
  ],
  preview: { prepare: () => ({ title: "Footer" }) },
});
