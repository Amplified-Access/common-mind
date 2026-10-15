import "server-only";

import { createClient, type QueryParams } from "next-sanity";

import { SANITY_API_VERSION } from "@/sanity/apiVersion";
import { dataset, projectId } from "@/sanity/env";

// The site's editorial content lives in Sanity and is edited in the Studio
// embedded at /studio. Server Components read it through this module.
//
// Every fetch is cached by Next under the `sanity` tag for up to a minute,
// so a publish shows within a minute without a redeploy.
//
// The dataset is public, so published documents are read without a token.
// Drafts are never visible here.

/** Tag on every Sanity fetch. */
export const SANITY_CACHE_TAG = "sanity";

const client = projectId
  ? createClient({
      projectId,
      dataset,
      apiVersion: SANITY_API_VERSION,
      // Next's data cache does the caching; reading past Sanity's API CDN
      // means a revalidated fetch never gets a CDN copy of the old content.
      useCdn: false,
      perspective: "published",
    })
  : null;

/** Runs a GROQ query. Throws when Sanity isn't configured. */
export async function sanityFetch<T>(
  query: string,
  params: QueryParams = {},
): Promise<T> {
  if (!client) {
    throw new Error(
      "NEXT_PUBLIC_SANITY_PROJECT_ID is not set; see docs/cms.md.",
    );
  }
  return client.fetch<T>(query, params, {
    next: { revalidate: 60, tags: [SANITY_CACHE_TAG] },
  });
}
