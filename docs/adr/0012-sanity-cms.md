# ADR 0012 — Sanity for the site's words and editorial content

**Status:** Accepted  
**Date:** 2026-10-15

## Context

Every word on the site, every research report, dataset and application, and the legal pages lived in TypeScript. Changing a sentence needed a developer, a commit and a deploy. The sister projects (ActionChallenge, Watchtower) already run Sanity with the Studio embedded in their Next.js sites, and `/studio` was reserved for it here (ADR 0009).

## Decision

Use **Sanity** (project `8m5302r8`) for the site's words and editorial content, edited in a Studio embedded at `/studio`.

- **Collections:** research reports, model releases, datasets, applications, each model's written copy, site settings, and the Privacy Policy and Terms (Portable Text). The site reads them at request time through `lib/content`, cached by Next for 60 seconds.
- **Page copy:** each page's original wording stays in code (`lib/copy/pages`). The Studio form is generated from it, and the site lays published text over it. The page's structure stays in code, an emptied field falls back to the original, and the site never shows a blank where text belongs.
- **Stays in code:** the model registry (names, scores, availability), benchmark results, language data, civic terminology, and interface labels. Charts, the playground and the Data Lab compute from these, and they change with the code that uses them.
- The site's routes move into an `app/(site)` route group, so the Studio has its own root layout without the site's chrome, smooth scrolling or global styles.

## Consequences

### Positive
- Editors change words, reports and datasets without a deploy; a publish shows within a minute.
- The same setup as the sister projects.
- Page copy can't drift out of shape: fields are generated from the page's own text, and the site keeps the original wording as a fallback.

### Negative / trade-offs
- Builds and page renders depend on Sanity's API. CI and hosting need the project ID, and an outage stops pages from regenerating (cached pages keep serving).
- A new model needs both a registry entry in code and its copy in the Studio.
- Adding a text field means a code change plus `pnpm sanity:seed` to give the existing document that field.
