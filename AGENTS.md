# AGENTS.md

CommonMind — Go + Gin backend, Next.js 16 + React 19 web app, PostgreSQL + Redis, and a Python inference server on Runpod.

Each layer has its own `AGENTS.md`. Read the file closest to what you are editing:
- `backend/AGENTS.md` + `backend/docs/` — Go API (Data Lab, release engine)
- `web/AGENTS.md` — Next.js site, and later the Data Lab UI at `/data-lab`
- `inference/AGENTS.md` + `inference/README.md` — model server behind the Playground
- `ingest/AGENTS.md` + `ingest/README.md` — offline pipeline that prepares Data Lab import files (ADR 0013)

Architectural decisions live in `docs/adr/`. Read 0009–0011 before working on the Data Lab.

**Naming:** the Data Lab (`/data-lab`) is the volunteer platform for creating, annotating, and verifying civic language datasets, starting with the Civic Corpus. `/studio` is reserved for the embedded Sanity CMS. `/research/civic-corpus` is the informational page about the corpus and links to the Data Lab.

Claude Code users: see `CLAUDE.md` for the feature development workflow and subagent definitions.

---

## Setup

Prerequisites: Go 1.25+, Node.js 22+, pnpm, Docker + Docker Compose.

```bash
make setup                      # first run: checks tools, installs deps, copies .env files, migrates

# Or by hand:
cd backend && make docker-run   # Postgres (:5434) + Redis (:6380) + Prometheus + Grafana
cd backend && make migrate-up
cd backend && make watch        # → http://localhost:8080 (Swagger at /swagger/index.html)
cd web && pnpm install && pnpm dev   # → http://localhost:3000
```

Container ports are shifted from the defaults so CommonMind runs alongside ActionChallenge and the other sibling projects.

---

## Testing

**Test-first, scoped to behaviour.** Before implementing a behaviour, write the test that fails without it, make it pass, then refactor. The goal is a small suite where every test protects something that could realistically break. A large suite is not the goal.

### Write a test for
- **Rules and decisions**: use-case logic with branches or invariants, e.g. trigger and gate evaluation, trust-level promotion, "a contributor cannot review their own row".
- **SQL**: each repository query, once, against real Postgres (Testcontainers). Cover the happy path plus the constraint or edge the query exists to handle (a conflict, a filter, an empty result).
- **Handler logic**: request validation and error-to-status mapping, when the handler does more than pass through.
- **Bugs**: a regression test that reproduces the bug, written before the fix.

### Don't write a test for
- Wiring and constructors (`NewX` returning a struct), getters, and field-to-field mapping.
- Framework or library behaviour: Gin routing, JSON encoding, goose, pgx scanning.
- Generated code (Swagger), config passthrough, and anything the compiler already checks.
- The same behaviour at several layers. Test it at the lowest layer that owns it; a higher layer tests only what it adds.
- Pass-through handlers and use cases with no logic of their own. The repository or end-to-end test already covers them.

### How
- One test per behaviour. Use table-driven cases for variants of the same behaviour, not near-identical test functions.
- Name tests after the behaviour (`TestReview_RejectsOwnContribution`), not the function.
- Never mock the database or cache. Hand-written fakes of use-case or repository interfaces are fine in handler and use-case tests.
- Deleting a redundant or low-value test is a good change. Leave the suite smaller than you found it when you can.

```bash
cd backend && make test         # unit + integration (Docker must be running)
cd backend && make itest        # integration only
cd web && pnpm lint
cd web && pnpm test
cd web && pnpm build
```

The web app uses Vitest (`cd web && pnpm test`, run in CI) for `lib/` logic. For interactive client components that have behaviour, add `@testing-library/react` with `jsdom` (not render-only or snapshot tests).

---

## Commits

**Commit each logical change on its own, as soon as it is done.** Don't let a session's work pile up into one commit.

- **One change per commit**: one migration and the code that uses it, one feature, one fix, one refactor. If the message needs "and" to describe two unrelated things, it is two commits.
- **Each commit stands alone**: it builds, passes `go vet` and tests, and could be reverted without breaking other commits.
- **Tests travel with their code**: in the same commit. No separate "add tests" commit.
- **Keep kinds apart**: refactors, renames, and formatting go in their own commits, separate from behaviour changes. Dependency bumps also get their own commit.
- **Generated and derived files go with their source**: regenerated Swagger with the annotation change, a doc update with the code it describes.
- **Stage by path** (`git add <files>`), then read `git diff --staged` before committing. Avoid `git add -A` and `git add .`.
- **Conventional Commits** for the subject (`feat(backend): …`, `fix(web): …`). The body explains why, when the subject doesn't.

---

## Code style

### Go
- Business logic in `internal/` only — `cmd/` wires things together, nothing more
- Return errors up the stack — never swallow them
- Parameterized SQL only (`$1`, `$2`) — no string-concatenated queries
- `go vet ./...` must pass

### TypeScript / React
- Strict TypeScript — no `any`
- Next.js App Router only — no `pages/` directory
- Server Components by default — `"use client"` only for browser APIs or React hooks
- Tailwind CSS v4 only

---

## Data Lab rules

- Every corpus row is written by a person. The Data Lab never calls the inference server (ADR 0010).
- Every row keeps its provenance: contributor, consent version, source and licence, reviewer, timestamps.
- Languages are database rows, keyed by the BCP-47 codes Watchtower uses (`sw`, `lg`, `rw`, `am`, `ki`, `suk`, `luo`, `om`, `din`), plus Karimojong (`kdj`).
- Release thresholds are configuration, never constants in code (ADR 0011).

---

## Security

- No hardcoded secrets or credentials anywhere in the codebase
- Never commit `.env` or `.env.local` files
- All SQL must use parameterized queries
- CORS `AllowOrigins` must not be `["*"]` in non-local environments
- Treat contributor data as personal data: collect the minimum, and never log submission text or contact details

---

## PR instructions

- Branch from `main` — no direct pushes to `main`
- Before opening a PR, all checks must pass: `make test` (backend), `pnpm lint && pnpm build` (web)
- Behaviour changes come with the tests described under [Testing](#testing)
- One feature or fix per PR, made of atomic commits (see [Commits](#commits))
- PR title: concise description of what changed, not implementation details
