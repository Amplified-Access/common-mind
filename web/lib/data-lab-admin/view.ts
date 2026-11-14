// What the Data Lab admin shows, as it is kept in the address: the language,
// the contributions' status, and the page. Links carry it, so reloads, Back
// and shared links keep the view.

export const STATUSES = ["pending", "verified", "rejected"] as const;
export type ContributionStatus = (typeof STATUSES)[number];

/** Contributions per page on a translator's page. */
export const PAGE_SIZE = 25;

export interface AdminView {
  language: string | null;
  status: ContributionStatus | null;
  page: number;
}

type SearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** Reads the view from a page's search params; anything unknown falls back to all, page 1. */
export function readView(params: SearchParams): AdminView {
  const status = first(params.status);
  const page = Number(first(params.page));
  return {
    language: first(params.language) || null,
    status: STATUSES.find((s) => s === status) ?? null,
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

/** The link to a view of path, leaving out what is the default. */
export function adminHref(path: string, view: AdminView): string {
  const query = new URLSearchParams();
  if (view.language) query.set("language", view.language);
  if (view.status) query.set("status", view.status);
  if (view.page > 1) query.set("page", String(view.page));
  const qs = query.toString();
  return qs ? `${path}?${qs}` : path;
}

/** The share of a translator's reviewed work that was verified, in whole percent; null until any is reviewed. */
export function acceptanceRate({ verified, rejected }: { verified: number; rejected: number }): number | null {
  const reviewed = verified + rejected;
  return reviewed === 0 ? null : Math.round((verified / reviewed) * 100);
}
