# ADR 0009 — Monorepo layout: web, backend, inference

**Status:** Accepted  
**Date:** 2026-10-14

## Context

CommonMind started as a single Next.js app: the public site plus one API route (`/api/translate`) that forwards Playground requests to the inference server on Runpod. The Data Lab, the volunteer platform that builds the Civic Corpus and the datasets after it, needs much more than that: volunteer accounts, consent records, task queues, review workflows, background jobs that build and publish snapshots, and live progress updates. None of this fits comfortably in Next.js route handlers.

The team's other projects (Blaze, ActionChallenge, Watchtower) share a layout from the fullstack template: a Go backend, a Next.js web app, and shared scripts, CI, and agent setup. Using the same layout here means the same commands, conventions, and review habits work across every repo.

## Decision

Restructure the repository into the template layout:

```
web/        Next.js site, and later the Data Lab UI as a route group
backend/    Go + Gin API from the template (ADR 0001–0004, 0006–0008)
inference/  Python model server on Runpod, deployed on its own
scripts/  Makefile  .github/  .claude/  docs/adr/
```

- `web/` is the existing site, moved with `git mv` so file history is kept.
- `backend/` is the template backend minus FCM push notifications (there is no mobile app) and IP geolocation (it would send every volunteer's IP to a third party on each request).
- `inference/` is unchanged. The Playground keeps calling it through `web/app/api/translate/route.ts`; the Data Lab does not use it (ADR 0010).
- The Data Lab UI lives in `web/` as a route group served at `/data-lab`, so it shares the site's design system and deploy. It can move to a `data-lab.` subdomain later through the proxy. `/studio` is reserved for the embedded Sanity CMS.
- Volunteers sign in with Firebase (ADR 0004), which also covers phone-number sign-in for people without a Google account.

## Consequences

### Positive
- One set of commands (`make setup`, `make dev`, `make test`) and CI conventions shared with the sibling repos.
- The backend can run the release engine (ADR 0011) as Asynq jobs, with Testcontainers-backed tests.
- Each layer deploys on its own: web on Vercel, backend on Railway, inference on Runpod.

### Negative / trade-offs
- The Vercel project's Root Directory must be set to `web`.
- Two runtimes (Node and Go) to install for full local development.
- The web layer has no test suite yet. `web-ci` runs lint and build only until Vitest is added.
