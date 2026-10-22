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
  /** Whether that consent also covers voice recordings. */
  voice_consent: boolean;
};

/** How a contribution is given: written, or said aloud. */
export type Modality = "text" | "audio";

export type LanguageProgress = {
  code: string;
  /** Sentences available to translate: the whole every language works from. */
  available: number;
  /** Sentence pairs with English, pending review or verified. */
  translated: number;
  /** Sentence pairs a second speaker approved. */
  verified: number;
  /** Recordings pending review or verified, and verified. */
  recorded: number;
  recorded_verified: number;
  /** Contributions of any kind waiting for review. */
  pending: number;
};

export type Task = {
  item_id: number;
  kind: "translate" | "write";
  category: string;
  text: string;
  /** For a recording task, the verified translation to read, in the target language. */
  text_language: string;
  target_language: string;
  modality: Modality;
};

/** Where to upload one recording, from POST /recordings. */
export type RecordingUpload = {
  upload_url: string;
  key: string;
  content_type: string;
};

export type ReviewItem = {
  contribution_id: number;
  kind: "translate" | "write";
  category: string;
  item_text: string;
  item_language: string;
  language_code: string;
  modality: Modality;
  /** The written text; "" for a recording. */
  text: string;
  /** For a recording: the verified translation it reads. */
  read_text?: string;
  /** Where to play a recording. */
  audio_url?: string;
  pasted: boolean;
  submitted_at: string;
};

export type RejectReason = "inaccurate" | "incomplete" | "machine_translated" | "off_topic" | "unclear" | "other";

export const canReview = (level: Level) => level === "reviewer" || level === "lead";
