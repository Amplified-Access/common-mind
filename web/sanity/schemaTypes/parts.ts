import { defineArrayMember, defineField, defineType } from "sanity";

// Small shapes shared by several documents.

/** A labelled link: a site path ("/models") or a full URL. */
export const link = defineType({
  name: "link",
  title: "Link",
  type: "object",
  fields: [
    defineField({ name: "label", type: "string", validation: (rule) => rule.required() }),
    defineField({
      name: "href",
      title: "Link",
      type: "string",
      description: 'A page on this site ("/models", "/build#api") or a full address ("https://…").',
      validation: (rule) =>
        rule.required().custom((href?: string) =>
          !href || href.startsWith("/") || /^https?:\/\//.test(href)
            ? true
            : 'Start with "/" for a page on this site, or "https://" for another site.',
        ),
    }),
  ],
  preview: { select: { title: "label", subtitle: "href" } },
});

// How tall a logo is drawn; logos differ in shape, so each is tuned to read
// at a similar weight. The site maps each size to its height (LOGO_SIZES).
export const LOGO_SIZE_OPTIONS = [
  { title: "Small (28px)", value: "sm" },
  { title: "Medium (40px)", value: "md" },
  { title: "Large (48px)", value: "lg" },
  { title: "Extra large (80px)", value: "xl" },
];

export const logoFields = [
  defineField({
    name: "logo",
    type: "image",
    description: "A white or light mark on a transparent background; SVG works best.",
    validation: (rule) => rule.required(),
  }),
  defineField({
    name: "logoSize",
    title: "Logo size",
    type: "string",
    options: { list: LOGO_SIZE_OPTIONS, layout: "radio", direction: "horizontal" },
    initialValue: "md",
    validation: (rule) => rule.required(),
  }),
];

/** A list of short strings, edited as tags. */
export const tagList = (name: string, title: string, description?: string) =>
  defineField({
    name,
    title,
    description,
    type: "array",
    of: [defineArrayMember({ type: "string" })],
    options: { layout: "tags" },
  });
