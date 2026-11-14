import "server-only";

import type { ContributionStatus } from "@/lib/data-lab-admin/view";

import type { Language } from "../types";
import type { AdminContributionPage, Translator } from "./types";

// Read on the server only: the password never reaches the browser.
// An empty BACKEND_URL (as in .env.example) falls back too.
const BASE = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080").replace(/\/$/, "");

/** How long to wait for the backend before saying it can't be reached. */
const TIMEOUT_MS = 10_000;

/** Why an admin read returned no data. */
export type AdminFailure =
  /** Wrong password, or it changed since they signed in. */
  | { status: "unauthorized" }
  /** Too many wrong passwords from this server just now; it clears within a minute. */
  | { status: "locked" }
  /** No such translator. */
  | { status: "not_found" }
  /** The backend is down or failing, or has no ADMIN_PASSWORD (the routes are off). */
  | { status: "unavailable" };

export type AdminResult<T> = { status: "ok"; data: T } | AdminFailure;

/** Reads an admin endpoint with the password the admin typed (backend/docs/data-lab-admin.md). */
async function adminGet<T>(path: string, password: string): Promise<AdminResult<T>> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/api/v1/admin/data-lab${path}`, {
      headers: { Authorization: `Bearer ${password}` },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return { status: "unavailable" };
  }
  if (res.status === 401) return { status: "unauthorized" };
  if (res.status === 429) return { status: "locked" };
  // The route itself is missing when the backend has no ADMIN_PASSWORD.
  if (res.status === 404) {
    const body = (await res.json().catch(() => null)) as { error?: { code?: string } } | null;
    return body?.error?.code === "not_found" ? { status: "not_found" } : { status: "unavailable" };
  }
  if (!res.ok) return { status: "unavailable" };
  const body = (await res.json()) as { data: T };
  return { status: "ok", data: body.data };
}

export const fetchTranslators = (password: string, language: string | null) =>
  adminGet<Translator[]>(`/translators${language ? `?language=${encodeURIComponent(language)}` : ""}`, password);

export const fetchTranslator = (password: string, id: number) => adminGet<Translator>(`/translators/${id}`, password);

export function fetchContributions(
  password: string,
  filter: { contributor: number; language: string | null; status: ContributionStatus | null; limit: number; offset: number },
) {
  const query = new URLSearchParams({
    contributor: String(filter.contributor),
    limit: String(filter.limit),
    offset: String(filter.offset),
  });
  if (filter.language) query.set("language", filter.language);
  if (filter.status) query.set("status", filter.status);
  return adminGet<AdminContributionPage>(`/contributions?${query}`, password);
}

/** The Data Lab's languages, for their names; empty when the backend can't be reached. */
export async function fetchLanguages(): Promise<Language[]> {
  try {
    const res = await fetch(`${BASE}/api/v1/data-lab/languages`, { cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) return [];
    return ((await res.json()) as { data: Language[] }).data;
  } catch {
    return [];
  }
}
