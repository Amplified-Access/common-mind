import { TranslateIcon } from "@sanity/icons/Translate";
import { defineArrayMember, defineField, defineType } from "sanity";

import { languages } from "../../components/languages/data";

// A language's details for the Languages page and its page at
// /languages/<code>. The language itself (code, name, map location, the
// tags that match datasets and research) is in code
// (components/languages/data.ts), so a new language starts there.
export const language = defineType({
  name: "language",
  title: "Language",
  type: "document",
  icon: TranslateIcon,
  fields: [
    defineField({
      name: "code",
      title: "Language",
      type: "string",
      description: "Which language these details are for.",
      options: { list: languages.map((l) => ({ title: l.name, value: l.code })) },
      readOnly: ({ document }) => Boolean(document?._createdAt && document?.code),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "endonym",
      description: "The language's name in itself, where it is commonly written.",
      type: "string",
    }),
    defineField({
      name: "tagline",
      type: "text",
      rows: 3,
      description: "One or two sentences on the language's card and at the top of its page.",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "family", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "branch", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "script", type: "string", validation: (rule) => rule.required() }),
    defineField({
      name: "regions",
      title: "Countries",
      type: "array",
      description: "Where it is spoken. The first two show as tags on its page.",
      of: [defineArrayMember({ type: "string" })],
    }),
  ],
  preview: {
    select: { code: "code", endonym: "endonym" },
    prepare: ({ code, endonym }: { code?: string; endonym?: string }) => ({
      title: languages.find((l) => l.code === code)?.name ?? "Language",
      subtitle: endonym,
    }),
  },
});
