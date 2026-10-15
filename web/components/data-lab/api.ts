import type {
  Language,
  LanguageProgress,
  Modality,
  RecordingUpload,
  RejectReason,
  ReviewItem,
  Task,
  Volunteer,
} from "./types";

const BASE = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080").replace(/\/$/, "");

/** An error response from the Data Lab API; `code` is stable (see backend/docs/data-lab.md). */
class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  { token, method = "GET", body }: { token?: string; method?: string; body?: unknown } = {},
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/api/v1/data-lab${path}`, {
      method,
      headers: {
        ...(body !== undefined && { "Content-Type": "application/json" }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "network_error", "The Data Lab can't be reached. Check your connection and try again.");
  }
  if (res.status === 204) return undefined as T;
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(
      res.status,
      json?.error?.code ?? "internal_error",
      json?.error?.message ?? "Something went wrong.",
    );
  }
  return json.data as T;
}

const dataLabApi = {
  languages: () => request<Language[]>("/languages"),
  progress: () => request<LanguageProgress[]>("/progress"),
  /** Optional features this server has: voice is false until storage is set up. */
  features: () => request<{ voice: boolean }>("/features"),
  me: (token: string) => request<Volunteer>("/me", { token }),
  onboard: (token: string, body: { name: string; languages: string[]; consent_version: string }) =>
    request<Volunteer>("/onboarding", { token, method: "POST", body }),
  acceptVoiceConsent: (token: string) => request<Volunteer>("/consent/voice", { token, method: "POST" }),
  nextTask: (token: string, language: string, modality: Modality = "text") =>
    request<Task>(
      `/tasks/next?language=${encodeURIComponent(language)}&modality=${modality}`,
      { token },
    ),
  startRecording: (token: string, body: { item_id: number; language: string; content_type: string }) =>
    request<RecordingUpload>("/recordings", { token, method: "POST", body }),
  contribute: (
    token: string,
    body: {
      item_id: number;
      language: string;
      modality: Modality;
      /** The text, or a recording's optional transcript. */
      text: string;
      audio_key?: string;
      pasted: boolean;
    },
  ) => request<unknown>("/contributions", { token, method: "POST", body }),
  nextReview: (token: string, language: string) =>
    request<ReviewItem>(`/reviews/next?language=${encodeURIComponent(language)}`, { token }),
  review: (
    token: string,
    body: {
      contribution_id: number;
      decision: "accept" | "correct" | "reject";
      reason?: RejectReason;
      note?: string;
      corrected_text?: string;
    },
  ) => request<void>("/reviews", { token, method: "POST", body }),
};

/**
 * Uploads a recording straight to storage, to the URL the API issued. The
 * Content-Type must be the one the URL was signed for.
 */
async function uploadRecording(upload: RecordingUpload, recording: Blob): Promise<void> {
  const res = await fetch(upload.upload_url, {
    method: "PUT",
    headers: { "Content-Type": upload.content_type },
    body: recording,
  }).catch(() => null);
  if (!res?.ok) {
    throw new ApiError(
      res?.status ?? 0,
      "upload_failed",
      "The recording didn't upload. Check your connection and try again.",
    );
  }
}

/** The WebSocket URL that streams live progress to a signed-in volunteer. */
const progressSocketUrl = (token: string) =>
  `${BASE.replace(/^http/, "ws")}/ws?token=${encodeURIComponent(token)}`;

export { ApiError, dataLabApi, progressSocketUrl, uploadRecording };
