# Architecture Decision Records

This directory captures significant architectural decisions for CommonMind. Each record documents the context, decision, and trade-offs at the time the choice was made.

Records 0001–0008 come from the fullstack template shared with Blaze and ActionChallenge, and keep the template's numbers so an ADR number means the same decision across those repos. Records from 0009 on are specific to CommonMind.

## Format

Each ADR follows this structure:

- **Status** — Accepted / Deprecated / Superseded by [NNNN]
- **Date** — When the decision was recorded
- **Context** — The forces at play that drove a decision
- **Decision** — What was chosen and why
- **Consequences** — What becomes easier, what becomes harder

## Index

| # | Title | Status |
|---|---|---|
| [0001](0001-go-gin-backend.md) | Go 1.25 + Gin for the backend API | Accepted |
| [0002](0002-postgresql-goose.md) | PostgreSQL 16 + goose migrations | Accepted |
| [0003](0003-nextjs-app-router.md) | Next.js 16 App Router + React 19 | Accepted |
| [0004](0004-firebase-auth.md) | Firebase Authentication (cross-platform) | Accepted |
| 0005 | Android + Kotlin + Jetpack Compose + Material3 | Not adopted — CommonMind has no mobile app yet |
| [0006](0006-redis-asynq.md) | Redis + Asynq for background jobs and event streaming | Accepted |
| [0007](0007-testcontainers.md) | Testcontainers for backend integration tests | Accepted |
| [0008](0008-cloudflare-r2.md) | Cloudflare R2 for object storage | Accepted |
| [0009](0009-monorepo-layout.md) | Monorepo layout: web, backend, inference | Accepted |
| [0010](0010-human-only-civic-corpus.md) | A human-only data studio for the Civic Corpus | Accepted |
| [0011](0011-triggered-corpus-releases.md) | Live corpus with metric-triggered snapshot releases | Accepted |

## Adding a new ADR

1. Copy the next sequential number.
2. Create `NNNN-short-title.md` in this directory.
3. Add a row to the index table above.
4. Set **Status: Accepted** when the team aligns on the decision.
