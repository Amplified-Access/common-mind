# CommonMind

Open language models, datasets, and benchmarks for African languages, and the Data Lab, where volunteers create civic language datasets, starting with the Civic Corpus.

## Project structure

```
common-mind/
├── web/          # Next.js 16 site — models, datasets, research, Playground; later the Data Lab at /data-lab
├── backend/      # Go + Gin API — Data Lab, release engine (Postgres, Redis/Asynq, R2)
├── inference/    # Python model server on a Runpod GPU pod, behind the Playground
├── docs/adr/     # Architectural decision records
├── scripts/      # setup, dev, staging sync, production deploy
├── .github/      # CI per layer, backend CD to Railway, PR labeler
└── .claude/      # Agent subagents, commands, and hooks
```

The layout follows the fullstack template shared with Blaze and ActionChallenge (see [ADR 0009](docs/adr/0009-monorepo-layout.md)).

## Tech stack

| Layer | Technology |
|---|---|
| Web | Next.js 16, React 19, TypeScript 5, Tailwind CSS 4 |
| Backend | Go 1.25, Gin, `database/sql` + pgx v5 |
| Data | PostgreSQL 16 (goose migrations), Redis 7 + Asynq, Cloudflare R2 |
| Auth | Firebase Authentication |
| Inference | Python, FastAPI, Runpod |
| Testing | Testcontainers (Go) |
| Observability | Prometheus, Grafana, Sentry |

## Getting started

Prerequisites: Go 1.25+, Node.js 22+, pnpm, and Docker (running).

```bash
make setup   # checks tools, installs web deps, copies .env files, starts Postgres + Redis, migrates
make dev     # Postgres + Redis, backend (:8080, hot reload), and web (:3000) in one terminal
```

Or start each part on its own:

```bash
cd backend && make docker-run   # Postgres :5434, Redis :6380, Auth Emulator :9099 (UI :4000), Prometheus :9092, Grafana :3012
cd backend && make watch        # API → http://localhost:8080 (Swagger at /swagger/index.html)
cd web && pnpm dev              # site → http://localhost:3000
```

The Playground needs a running inference pod; see [inference/README.md](inference/README.md). Without one, the rest of the site works and `/api/translate` returns 503.

## Common commands

| Command | What it does |
|---|---|
| `make test` | Backend unit and integration tests (Docker required) |
| `make lint` | `go vet` and ESLint |
| `make build` | Backend binary and production web build |
| `cd backend && make migrate-create name=<slug>` | New SQL migration |
| `cd backend && make swagger` | Regenerate API docs after changing handler annotations |
| `make deploy-prod` | Advance `production` to `main` (see [RUNBOOK.md](RUNBOOK.md)) |

## Documentation

- [AGENTS.md](AGENTS.md) and [CLAUDE.md](CLAUDE.md) — conventions and workflow for contributors and coding agents
- [backend/docs/](backend/docs/_index.md) — backend topics: database, routing, auth, queue, storage, testing
- [docs/adr/](docs/adr/0000-index.md) — why things are the way they are
- [RUNBOOK.md](RUNBOOK.md) — deploying and operating each layer
- [CONTRIBUTING.md](CONTRIBUTING.md) — how to propose changes

## License

[MIT](LICENSE). Datasets and models published by CommonMind carry their own licences, listed on their pages.
