import { civicCategories } from "@/components/civic/data";

import type { Language } from "../types";

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** "14 Nov 2026". */
export const formatDate = (iso: string) => dateFormat.format(new Date(iso));

export const categoryLabel = (id: string) => civicCategories.find((c) => c.id === id)?.label ?? id;

/** A language's English name, or its code when it isn't known. */
export const languageNamer = (languages: Language[]) => (code: string) =>
  languages.find((l) => l.code === code)?.name ?? code;

export const levelLabel = { contributor: "Contributor", reviewer: "Reviewer", lead: "Lead" } as const;

/** The reasons a reviewer gives for rejecting (domain.RejectReasons). */
export const rejectReasonLabel: Record<string, string> = {
  inaccurate: "Meaning is wrong",
  incomplete: "Something is missing",
  machine_translated: "Reads as machine-translated",
  off_topic: "Doesn't answer the prompt",
  unclear: "Hard to hear",
  other: "Other",
};
