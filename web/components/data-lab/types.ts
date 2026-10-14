// Mirrors backend/internal/domain/datalab.go. Field names match the JSON.

export type Language = {
  code: string;
  name: string;
  native_name: string;
  role: "target" | "source";
  script: string;
  extra_characters: string[];
};

export type Level = "contributor" | "reviewer" | "lead";

export type Membership = { language_code: string; level: Level };

export type Volunteer = {
  id: number;
  name: string;
  email: string;
  languages: Membership[];
  consent_version: string;
};

export type LanguageProgress = {
  code: string;
  /** Sentence pairs with English, pending review or verified. */
  translated: number;
  /** Sentence pairs a second speaker approved. */
  verified: number;
  /** Contributions of any kind waiting for review. */
  pending: number;
  /** Whether the language accepts contributions yet. */
  open: boolean;
};

export type Task = {
  item_id: number;
  kind: "translate" | "write";
  category: string;
  text: string;
  text_language: string;
  target_language: string;
};

export type ReviewItem = {
  contribution_id: number;
  kind: "translate" | "write";
  category: string;
  item_text: string;
  item_language: string;
  language_code: string;
  text: string;
  pasted: boolean;
  submitted_at: string;
};

export type RejectReason = "inaccurate" | "incomplete" | "machine_translated" | "off_topic" | "other";

export const canReview = (level: Level) => level === "reviewer" || level === "lead";
