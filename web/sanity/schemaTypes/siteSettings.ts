import { CogIcon } from "@sanity/icons/Cog";
import { defineArrayMember, defineField, defineType } from "sanity";

import { logoFields } from "./parts";

// Site-wide settings: how the site describes itself, the announcement bar,
// the footer's partners and link columns. One document, id "siteSettings".
export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  icon: CogIcon,
  groups: [
    { name: "identity", title: "Identity", default: true },
    { name: "announcement", title: "Announcement" },
    { name: "footer", title: "Footer" },
  ],
  fields: [
    defineField({
      name: "statement",
      type: "string",
      group: "identity",
      description: 'Follows the name in the home page\'s browser tab: "CommonMind · …".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "tagline",
      type: "text",
      rows: 2,
      group: "identity",
      description: "The site's description in search results and link previews.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "organization",
      type: "object",
      group: "identity",
      description: "The organization behind CommonMind, linked from the footer.",
      fields: [
        defineField({ name: "name", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "href", title: "Website", type: "url", validation: (rule) => rule.required() }),
      ],
    }),
    defineField({
      name: "announcement",
      type: "object",
      group: "announcement",
      description: "The bar above the header on every page. Visitors can dismiss it.",
      fields: [
        defineField({ name: "enabled", title: "Show the announcement", type: "boolean", initialValue: true }),
        defineField({
          name: "key",
          type: "slug",
          description:
            "Identifies this announcement. Change it (Generate) for a new announcement, so visitors who dismissed the last one see it.",
          options: { source: "announcement.message" },
          validation: (rule) => rule.required(),
        }),
        defineField({ name: "message", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "link", type: "link" }),
      ],
    }),
    defineField({
      name: "partners",
      type: "array",
      group: "footer",
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
      name: "footerColumns",
      title: "Footer columns",
      type: "array",
      group: "footer",
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
      group: "footer",
      description: "The links along the bottom of the footer.",
      of: [defineArrayMember({ type: "link" })],
    }),
  ],
  preview: { prepare: () => ({ title: "Site settings" }) },
});
