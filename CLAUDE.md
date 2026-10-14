# Project Guide

See `AGENTS.md` for setup, data studio rules, and security rules; `docs/adr/` for architectural decisions.

## Stack
| Layer | Tech |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript 5, Tailwind CSS 4 |
| Backend | Go 1.25, Gin, `database/sql` + pgx v5 stdlib |
| Database | PostgreSQL 16 + Redis 7 via Docker Compose |
| Inference | Python (FastAPI) on a Runpod GPU pod — see `inference/README.md` |
| Dev tools | pnpm, Air (Go hot reload), Testcontainers |

## Run commands
```bash
cd backend && make docker-run   # start Postgres + Redis
cd backend && make watch        # backend dev with hot reload (Air) → :8080
cd web && pnpm dev              # web dev → :3000

cd backend && make test         # all tests
cd backend && make itest        # integration tests only (requires Docker)
cd web && pnpm lint && pnpm build
```

## Migration commands (run from backend/)
```bash
make migrate-create name=<slug>   # create a new timestamped SQL migration file
make migrate-status               # show applied vs. pending migrations
make migrate-up                   # apply all pending migrations
make migrate-up-one               # apply the next pending migration only
make migrate-down                 # roll back the last applied migration
make migrate-reset                # roll back everything to version 0
make migrate-version              # print current schema version
```

## Feature development workflow — always follow this
1. **Check docs first** — delegate to `docs` agent: find relevant topic docs, verify they match the current code
2. **Fix stale docs** — if docs diverge from code, update docs before implementing
3. **Migrate** — if the feature needs new or changed tables: `make migrate-create name=<slug>`, write the SQL, `make migrate-up`
4. **Write tests first (TDD)** — write failing tests that describe the intended behaviour before writing any implementation code
5. **Implement** — delegate to `backend` or `web` agent, passing the relevant doc content as context; implementation is complete when all tests pass
6. **Env vars** — if any new env vars were added to `loadConfig()`, add them to `backend/.env.example` with a safe placeholder value and a comment explaining the format
7. **Update docs** — delegate to `docs` agent: update `last_verified`, add new topics if introduced
8. **Quality gate** — run `/project:check` before declaring done

Use `/project:implement` to run this workflow end-to-end.

## Documentation locations
```
backend/docs/    # database, migrations, routing, testing, error-handling, environment, …
web/docs/        # not created yet — add with the first web topic
docs/adr/        # architectural decisions
```
Each doc file has `last_verified` and `sources` frontmatter. The `docs` agent maintains these.

## Available subagents — delegate to these
- **`backend`** — Go/Gin/PostgreSQL tasks
- **`web`** — Next.js/React/TypeScript tasks
- **`reviewer`** — pre-commit code review across all layers
- **`db-explorer`** — read-only DB schema and query analysis
- **`docs`** — documentation check, update, and creation

## Custom commands
- `/project:implement` — full documentation-first feature workflow
- `/project:check` — full quality gate (vet + lint + build + test)
- `/project:test` — run all tests with output
- `/project:new-route` — scaffold a new Go API route end-to-end

## Project layout
```
backend/
  cmd/api/main.go               # entry point — wires layers, graceful shutdown
  cmd/migrate/main.go           # migration CLI — wraps goose, reads BLUEPRINT_DB_* env vars
  internal/
    bootstrap/
      bootstrap.go              # App struct, Run() — config validation, DB init, service probing
    domain/                     # Layer 1: entities (no external deps)
      health.go                 # HealthStats type
    usecase/                    # Layer 2: application logic
      health_usecase.go         # HealthReader interface, HealthUseCase interface + impl
    infrastructure/
      database/
        postgres/               # Layer 3: DB implementations
          db.go                 # DBConfig, NewPostgresDB() → *sql.DB
          health_repository.go  # implements HealthReader
          health_repository_test.go # integration tests (Testcontainers)
        migrations/             # SQL migration files (goose) — YYYYMMDDHHMMSS_<slug>.sql
    transport/
      handlers/                 # Layer 3: HTTP adapters
        handler.go              # Handler struct, NewHandler()
        routes.go               # RegisterRoutes() on *Handler
        hello_handler.go        # HelloWorldHandler
        health_handler.go       # HealthHandler (503 when DB down)
        hello_handler_test.go   # httptest unit tests
      middleware/
        logger.go               # structuredLogger() — slog-based Gin middleware
    server/
      server.go                 # NewServer() — wires all layers, returns *http.Server
  pkg/
    logger/
      logger.go                 # New(env) — JSON handler for staging/production, text otherwise
  docker-compose.yml
  .env                          # never commit secrets
  Makefile
web/
  app/                          # Next.js App Router
  CLAUDE.md → AGENTS.md         # web-specific rules (read before writing Next.js)
inference/
  server.py                     # FastAPI model server that runs on the Runpod pod
  translator.py                 # Flash worker with the same logic, for local iteration
docs/adr/                       # architectural decisions (0009–0011 cover the data studio)
```

## Swagger / OpenAPI

Swagger UI is served at `http://localhost:8080/swagger/index.html`. Docs are generated from swaggo annotations and committed to `backend/docs/swagger/`.

**Every new route must include swaggo annotations.** Run `make swagger` from `backend/` after adding or changing any handler to regenerate the docs package and commit the updated files.

Annotation rules:
- API-level metadata (`@title`, `@version`, `@host`, `@BasePath`) lives in `cmd/api/main.go` above `main()`.
- Handler-level annotations go immediately above each handler method: `@Summary`, `@Tags`, `@Produce`, `@Param` (if applicable), `@Success`, `@Failure`, `@Router`.
- If a handler returns a `domain.*` type, add a `type Alias = domain.Type` line to `internal/transport/handlers/swagger_types.go` and reference it as `{object} Alias` in the annotation — swaggo cannot traverse the `usecase → domain` import chain automatically.
- See `backend/docs/swagger.md` for the full annotation reference and examples.

```bash
cd backend && make swagger   # regenerate docs/swagger/ after annotation changes
```

## Go conventions (Clean Architecture)
- Follow the dependency rule: `domain` ← `usecase` ← `transport`/`infrastructure` ← `server` ← `cmd`.
- New feature → add entity to `domain/`, interface to `usecase/`, implementation to `infrastructure/database/postgres/`, handler to `transport/handlers/`, wire in `server/server.go`.
- New route → add use case interface + impl in `usecase/`, handler method on `*Handler`, register in `transport/handlers/routes.go`, wire in `server/server.go`.
- Repository interfaces live in `usecase/` (the layer that depends on them), not in `infrastructure/`.
- Return errors up the stack. Never `log.Fatal` or `os.Exit` inside `internal/`.
- Run `go vet ./...` before committing.

## Migrations (goose)
- Any feature that introduces or changes a table **must** include a goose migration.
- `make migrate-create name=<slug>` → edit the generated SQL → `make migrate-up`.
- SQL only — no Go migrations. No DDL inside repository methods.
- Never edit or delete an applied migration; add a new one to fix it.
- Integration tests do NOT run migrations — Testcontainers starts blank and tests create their own schema via `testDB.Exec`.
- See `backend/docs/migrations.md` for the full workflow and format rules.

## TypeScript/React conventions
- App Router only. Default to Server Components.
- Add `"use client"` only when browser APIs or React hooks are required.
- Tailwind v4 for all styles — no CSS modules, no inline styles.
- No `any`. Use proper interfaces or `unknown`.
- Shared components → `components/`, utilities → `lib/`, types → `types/`.

## Testing — non-negotiable

**Test-Driven Development is the required approach.** Write failing tests first; make them pass; then refactor.

### Backend (Go)
- **Never mock the database.** Always use Testcontainers (real PostgreSQL, real Redis).
- Follow the `TestMain` + `mustStartPostgresContainer()` pattern from `internal/infrastructure/database/postgres/health_repository_test.go`.
- DB/cache integration tests live in their respective `infrastructure/` package.
- Handler unit tests live in `internal/transport/handlers/` and may use mock use case interfaces — that is not mocking the database.
- Usecase unit tests live in `internal/usecase/` and mock the repository interface (not the database).
- Docker must be running for any integration test.
- See `backend/docs/testing.md` for full patterns.

### Web (Next.js)
- No test suite yet. When adding one, use Vitest + `@testing-library/react` (`jsdom`), and Playwright for full-page flows.

## Hard rules (hooks enforce some of these)
- No secrets in committed files.
- No direct pushes to `main` — always open a PR.
- No `log.Fatal` / `os.Exit` inside `internal/`.
- No `"use client"` without a concrete browser requirement.
- No database mocks in tests.
- No `any` in TypeScript.
- **No new backend feature without tests.** Every new route, use case, and repository must ship with tests.
- **Every new env var must appear in `backend/.env.example`** with a safe placeholder value and a comment. Never leave a new `loadConfig()` variable undocumented in the example file.
