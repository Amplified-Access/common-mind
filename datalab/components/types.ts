// Mirrors backend/internal/domain/datalab.go. Field names match the JSON.

export type Language = {
  code: string;
  name: string;
  native_name: string;
  role: "target" | "source";
  script: string;
  extra_characters: string[];
  /** Spoken languages are written and read aloud; sign languages are signed on camera. */
  modality: "spoken" | "signed";
};

export type Level = "contributor" | "reviewer" | "lead";

export type Membership = { language_code: string; level: Level; modality: "spoken" | "signed" };

export type Volunteer = {
  id: number;
  name: string;
  email: string;
  languages: Membership[];
  consent_version: string;
  /** Whether that consent also covers voice recordings. */
  voice_consent: boolean;
  /** Whether it covers signing on camera. */
  video_consent: boolean;
};

/** How a contribution is given: written, said aloud, or signed on camera. */
export type Modality = "text" | "audio" | "video";

export type LanguageProgress = {
  code: string;
  /** Sentences available to translate: the whole every language works from.
   * For a sign language, the words and sentences available to sign. */
  available: number;
  /** Sentence pairs with English, pending review or verified. */
  translated: number;
  /** Sentence pairs a second speaker approved. */
  verified: number;
  /** Recordings pending review or verified, and verified. */
  recorded: number;
  recorded_verified: number;
  /** Signs recorded on camera, pending review or verified, and verified. */
  signed: number;
  signed_verified: number;
  /** Contributions of any kind waiting for review. */
  pending: number;
};

/** translate: a sentence; write: a prompt to answer; word: a word or short phrase to sign. */
export type ItemKind = "translate" | "write" | "word";

export type Task = {
  item_id: number;
  kind: ItemKind;
  category: string;
  text: string;
  /** For a recording task, the verified translation to read, in the target language. */
  text_language: string;
  target_language: string;
  modality: Modality;
};

/** Where to upload one recording, from POST /recordings. A sign also gets
 * a URL for its landmarks file. */
export type RecordingUpload = {
  upload_url: string;
  key: string;
  content_type: string;
  landmarks_upload_url?: string;
  landmarks_key?: string;
  landmarks_content_type?: string;
};

export type ReviewItem = {
  contribution_id: number;
  kind: ItemKind;
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
  /** Where to watch a sign, and its tracked landmarks when there are any. */
  video_url?: string;
  landmarks_url?: string;
  pasted: boolean;
  submitted_at: string;
};

export type RejectReason = "inaccurate" | "incomplete" | "machine_translated" | "off_topic" | "unclear" | "other";

export const canReview = (level: Level) => level === "reviewer" || level === "lead";
