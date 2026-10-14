# AGENTS.md

CommonMind — Go + Gin backend, Next.js 16 + React 19 web app, PostgreSQL + Redis, and a Python inference server on Runpod.

Each layer has its own `AGENTS.md`. Read the file closest to what you are editing:
- `backend/AGENTS.md` + `backend/docs/` — Go API (data studio, release engine)
- `web/AGENTS.md` — Next.js site, and later the studio UI
- `inference/AGENTS.md` + `inference/README.md` — model server behind the Playground

Architectural decisions live in `docs/adr/`. Read 0009–0011 before working on the data studio.

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

**TDD is required for backend work.** Write failing tests first, then implement.

```bash
cd backend && make test         # unit + integration (Docker must be running)
cd backend && make itest        # integration only
cd web && pnpm lint
cd web && pnpm build
```

- Backend DB and cache tests use **Testcontainers** (real PostgreSQL, real Redis). Never mock the database.
- The web app has no test suite yet. When adding one, use Vitest + `@testing-library/react`, and add a `test` step to `.github/workflows/web-ci.yml`.

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

## Data studio rules

- Every corpus row is written by a person. The studio never calls the inference server (ADR 0010).
- Every row keeps its provenance: contributor, consent version, source and licence, reviewer, timestamps.
- Languages are database rows, keyed by the BCP-47 codes Watchtower uses (`sw`, `lg`, `rw`, `am`, `ki`, `suk`, `luo`, `om`, `din`).
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
- No new backend feature without tests — every route, use case, and repository ships with tests
- One logical change per PR
- PR title: concise description of what changed, not implementation details
