import type { Publication } from "@/lib/content/types";

/** Minutes to read a report, at 200 words a minute. */
export function readTimeForPublication(publication: Publication) {
  const words = [
    publication.title,
    publication.dek,
    ...publication.sections.flatMap((section) => [
      section.heading,
      ...section.paragraphs,
    ]),
  ].join(" ").split(/\s+/).filter(Boolean).length;

  return Math.max(1, Math.round(words / 200));
}
