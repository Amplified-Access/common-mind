import { DocumentsIcon, HighlightIcon } from "@sanity/icons";
import { defineArrayMember, defineField, defineType } from "sanity";

// Rich text for legal pages, limited to what the page design draws:
// numbered sections (Section heading), subheadings, paragraphs and bullet
// lists, with links, monospace text, and "To confirm" for details still
// pending (drawn in yellow until replaced).
const legalText = (sections: boolean) =>
  defineArrayMember({
    type: "block",
    styles: [
      { title: "Paragraph", value: "normal" },
      ...(sections
        ? [
            { title: "Section heading", value: "h2" },
            { title: "Subheading", value: "h3" },
          ]
        : []),
    ],
    lists: sections ? [{ title: "Bullets", value: "bullet" }] : [],
    marks: {
      decorators: [
        { title: "Monospace", value: "code" },
        { title: "To confirm", value: "pending", icon: HighlightIcon },
      ],
      annotations: [
        {
          name: "link",
          type: "object",
          title: "Link",
          fields: [
            defineField({
              name: "href",
              title: "Link",
              type: "string",
              description: 'A page on this site ("/privacy") or a full address ("https://…", "mailto:…").',
              validation: (rule) => rule.required(),
            }),
          ],
        },
      ],
    },
  });

// The Privacy Policy and Terms of Use, one document each (ids "legal-privacy"
// and "legal-terms"). Section headings are numbered by the site.
export const legalPage = defineType({
  name: "legalPage",
  title: "Legal page",
  type: "document",
  icon: DocumentsIcon,
  fields: [
    defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
    defineField({
      name: "description",
      type: "text",
      rows: 2,
      description: "The page's description in search results and link previews.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "updated",
      title: "Last updated",
      type: "date",
      description: 'Shown as the month and year, e.g. "October 2026".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "body",
      type: "array",
      description: 'Start each numbered section with a "Section heading"; the site adds the numbers.',
      of: [legalText(true)],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "closing",
      type: "array",
      description: "The short note after the last section.",
      of: [legalText(false)],
    }),
  ],
  preview: { select: { title: "title", subtitle: "updated" } },
});
