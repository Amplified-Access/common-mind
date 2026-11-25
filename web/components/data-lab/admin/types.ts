// Mirrors backend/internal/domain/datalab_admin.go. Field names match the JSON.

import type { ContributionStatus } from "@/lib/data-lab-admin/view";

import type { ItemKind, Level, Modality } from "../types";

/** One of a translator's languages and how much they've contributed in it. */
export type TranslatorLanguage = {
  language_code: string;
  /** "" when they contributed in it but are no longer a member. */
  level: Level | "";
  contributions: number;
};

export type Translator = {
  id: number;
  name: string;
  email: string;
  /** Busiest first; the counts cover every language whatever the filter. */
  languages: TranslatorLanguage[];
  joined_at: string;
  written: number;
  recorded: number;
  signed: number;
  pending: number;
  verified: number;
  /** Verified with a reviewer's correction; part of verified. */
  corrected: number;
  rejected: number;
  /** Reviews they made of other volunteers' work. */
  reviewed: number;
  last_active_at: string | null;
};

export type AdminReview = {
  decision: "accept" | "correct" | "reject";
  reason?: string;
  note?: string;
  corrected_text?: string;
  reviewer_id: number;
  reviewer_name: string;
  reviewed_at: string;
};

export type AdminContribution = {
  id: number;
  contributor_id: number;
  contributor_name: string;
  item_id: number;
  kind: ItemKind;
  category: string;
  source_title: string;
  /** The segment translated or the prompt answered, in item_language. */
  item_text: string;
  item_language: string;
  language_code: string;
  modality: Modality;
  /** What the volunteer wrote; "" for a recording. */
  text: string;
  /** For a recording: the verified translation it reads. */
  read_text?: string;
  audio_url?: string;
  /** Where to watch a sign. */
  video_url?: string;
  pasted: boolean;
  status: ContributionStatus;
  submitted_at: string;
  review: AdminReview | null;
};

export type AdminContributionPage = {
  total: number;
  contributions: AdminContribution[];
};
