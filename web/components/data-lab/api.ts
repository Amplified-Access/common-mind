import type {
  Language,
  LanguageProgress,
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
  me: (token: string) => request<Volunteer>("/me", { token }),
  onboard: (token: string, body: { name: string; languages: string[]; consent_version: string }) =>
    request<Volunteer>("/onboarding", { token, method: "POST", body }),
  nextTask: (token: string, language: string) =>
    request<Task>(`/tasks/next?language=${encodeURIComponent(language)}`, { token }),
  contribute: (
    token: string,
    body: { item_id: number; language: string; text: string; pasted: boolean },
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

/** The WebSocket URL that streams live progress to a signed-in volunteer. */
const progressSocketUrl = (token: string) =>
  `${BASE.replace(/^http/, "ws")}/ws?token=${encodeURIComponent(token)}`;

export { ApiError, dataLabApi, progressSocketUrl };
