---
topic: cms
last_verified: 2026-10-18
sources:
  - sanity.config.ts
  - sanity.cli.ts
  - sanity/structure.ts
  - sanity/pageCopy.ts
  - sanity/schemaTypes/
  - sanity/seed/import.ts
  - sanity/seed/seed.ndjson
  - app/studio/
  - lib/sanity/client.ts
  - lib/content/
  - lib/copy/
  - .env.example
---

# Content (Sanity)

The site's words and editorial content live in Sanity (project `8m5302r8`, dataset `production`) and are edited in the Studio embedded at **`/studio`**. Editors sign in with their Sanity account. Decision record: [ADR 0012](../../docs/adr/0012-sanity-cms.md).

## What lives where

| In Sanity (edited in the Studio) | In code |
|---|---|
| Every page's words: headings, intros, buttons, search titles and descriptions (`lib/copy/pages` holds the originals) | Page structure, layout, and interface labels (filters, search boxes, chart controls) |
| Research reports and model releases | The model registry: names, bases, scores, availability (`components/models/registry.ts`) |
| Datasets and applications | Benchmark results, language data, civic terminology |
| Each model's written copy: tagline, overview, capabilities, highlights, usage example | Code samples on the Build page (`components/build/snippets.ts`) |
| Site settings: description, announcement bar, the organization | Header navigation (`lib/site.ts`) |
| The footer: partner logos, link columns, legal links, its text lines and © line | |
| Privacy Policy and Terms of Use (rich text) | The Data Lab app's own screens |

## Setup

1. In `web/.env.local` set `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET` and, to seed, `SANITY_API_TOKEN` (an Editor token from sanity.io/manage → API → Tokens). See `.env.example`.
2. In sanity.io/manage → API → CORS origins, allow each origin the Studio runs on, with credentials: `http://localhost:3000` is set; add the production domain when the site deploys.
3. For an empty dataset, run `pnpm sanity:seed`.

The site needs Sanity to build and render: without `NEXT_PUBLIC_SANITY_PROJECT_ID`, `getContent()` throws. CI sets the project ID in `.github/workflows/web-ci.yml`; set the same two variables in the hosting environment.

## How the site reads it

- **Collections and settings:** `getContent()` (`lib/content`) runs one GROQ query for every collection plus site settings. React's `cache` shares it across a request's components.
- **Legal pages:** `getLegalPage(id)` (`lib/content`) loads the Privacy Policy or Terms; `components/legal/legal-text.tsx` renders their rich text.
- **Page copy:** `getPageCopy(key)` (`lib/copy`) loads a page's document and lays it over the original wording with `overlay()`.

Every fetch goes through `lib/sanity/client.ts`. It reads published documents only, with no token, and Next caches each fetch for 60 seconds under the `sanity` tag. A publish shows on the site within a minute, without a redeploy.

## Page copy

Each page's original wording is a plain object in `lib/copy/pages/<page>.ts`, registered in `lib/copy/pages/index.ts`. From it:

- `sanity/pageCopy.ts` generates the page's Studio form. Each group is a collapsible section, each text a field, and the original wording is each field's placeholder.
- The site shows the editor's text where there is some, and the original otherwise. **Emptying a field restores the original wording.**

Conventions editors can use in any field:

| Write | Shows as |
|---|---|
| `*multilingual*` | the word in the signal colour (`Emphasized`) |
| a new line in a title | a line break on wider screens |
| `{name}` | filled in by the page, e.g. a language's or model's name (`fill`) |

### Adding or changing a page's text

1. Add the text to the page's object in `lib/copy/pages/` and read it from `getPageCopy(...)` in the page.
2. Run `pnpm sanity:seed`. It adds the new field to the page's existing document and never changes fields editors have written.

A new page: create its copy module, add it to `PAGES`, then run `pnpm sanity:seed` to create its document. It appears under **Pages** in the Studio.

## Collections

| Studio | Type | Document IDs |
|---|---|---|
| Research → Research reports | `publication` | any; the page is `/research/<slug>` |
| Research → Model releases | `release` | any |
| Models → *each model* | `model` | `model-<registry slug>` (fixed) |
| Datasets | `dataset` | any; the page is `/datasets/<slug>`; `order` sets the list order |
| Applications | `application` | any; `order` sets the list order |
| Legal pages | `legalPage` | `legal-privacy`, `legal-terms` (fixed) |
| Site settings | `siteSettings` | `siteSettings` (fixed) |
| Pages → Footer | `footer` | `footer` (fixed) |
| Pages → *each page* | `<key>Page` | `page-<key>` (fixed) |

Fixed documents open straight from the sidebar and can't be created, duplicated or deleted (`FIXED_TYPES` in `sanity/structure.ts`).

**A new model** starts in the registry in code (`components/models/registry.ts`), which owns its name, scores and availability. Once deployed, it appears under Models in the Studio, where its copy is written. Until then its page renders without copy.

**Legal pages:** start each numbered section with a *Section heading*; the site numbers them. *To confirm* marks details still pending (yellow), *Bright* highlights text, *Monospace* is for contact details.

## Seeding

`pnpm sanity:seed` writes `sanity/seed/seed.ndjson` (the collections, settings and legal pages as they were when the site moved to Sanity) and one document per page from `lib/copy/pages`:

- It creates the documents a dataset lacks and adds missing fields to existing page documents. It never changes what editors wrote.
- `pnpm sanity:seed --replace` overwrites every seed document. Use it only on a fresh or scratch dataset.
- Logos are given as `"_sanityAsset": "image@file://./public/…"` and uploaded once each.

## Commands (from `web/`)

```bash
pnpm sanity:validate   # check the schema
pnpm sanity:seed       # seed a dataset / add new page fields
pnpm test              # includes the overlay, star and placeholder rules
```

Not set up yet: a publish webhook to revalidate instantly (today's ceiling is the 60-second cache), and draft previews.
