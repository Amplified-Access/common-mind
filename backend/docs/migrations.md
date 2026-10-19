---
topic: migrations
last_verified: 2026-10-19
sources:
  - cmd/migrate/main.go
  - internal/infrastructure/database/migrations/
  - internal/infrastructure/database/migrations/20261019190500_add_source_provenance_and_import_batches.sql
  - internal/infrastructure/database/postgres/health_repository_test.go
  - Makefile
---

# Migrations

## Tool
goose v3 (`github.com/pressly/goose/v3`).
Entry point: `cmd/migrate/main.go` — a thin wrapper that reuses `postgres.NewPostgresDB` and reads the same `BLUEPRINT_DB_*` env vars as the server. No separate goose binary installation needed.

## File location
`backend/internal/infrastructure/database/migrations/` — SQL files only. Naming: `YYYYMMDDHHMMSS_<slug>.sql`, created automatically by `make migrate-create`.

## Makefile targets
| Target | What it does |
|---|---|
| `make migrate-create name=<slug>` | Create a new timestamped SQL file in `internal/infrastructure/database/migrations/` |
| `make migrate-status` | Show applied vs. pending migrations |
| `make migrate-up` | Apply all pending migrations |
| `make migrate-up-one` | Apply only the next pending migration |
| `make migrate-down` | Roll back the last applied migration |
| `make migrate-down-to version=N` | Roll back to a specific version number |
| `make migrate-reset` | Roll back all migrations to version 0 |
| `make migrate-version` | Print the current schema version |

## SQL migration format
Each file must have exactly one `-- +goose Up` annotation. `-- +goose Down` is optional but should always be included.

```sql
-- +goose Up
CREATE TABLE users (
    id         BIGSERIAL    PRIMARY KEY,
    email      TEXT         NOT NULL UNIQUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- +goose Down
DROP TABLE users;
```

Rules:
- Every statement must end with `;`
- DDL only — no application data mutations in migrations, with one exception: `UPDATE` backfills are permitted as a step between `ADD COLUMN` (nullable) and `SET NOT NULL` (see pattern below)
- For multi-statement blocks (PL/pgSQL), wrap with `-- +goose StatementBegin` / `-- +goose StatementEnd`
- Avoid `-- +goose NO TRANSACTION` unless the statement genuinely cannot run in a transaction (e.g. `CREATE INDEX CONCURRENTLY`)

## Adding a NOT NULL column to an existing table
When every existing row can take the same value, add the column with a default in one statement, as `20261019190500_add_source_provenance_and_import_batches.sql` does:

```sql
ALTER TABLE sources ADD COLUMN collection TEXT NOT NULL DEFAULT '';
ALTER TABLE items ADD COLUMN status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'retired'));
```

When existing rows need values computed per row, use three steps: add the column as nullable, backfill with `UPDATE`, then `SET NOT NULL`. No migration in the repo uses this yet; the shape is:

```sql
-- +goose Up
ALTER TABLE <table> ADD COLUMN <column> TEXT;
UPDATE <table> SET <column> = <expression> WHERE <column> IS NULL;
ALTER TABLE <table> ALTER COLUMN <column> SET NOT NULL;

-- +goose Down
ALTER TABLE <table> DROP COLUMN IF EXISTS <column>;
```

Both avoid the `ERROR: column contains null values` failure that occurs when you add a `NOT NULL` column with no default and the table is non-empty.

## Workflow for any new table
1. `make migrate-create name=add_<table>` — generates the timestamped file
2. Fill in `CREATE TABLE` (Up) and `DROP TABLE` (Down)
3. `make migrate-up` — applies to local DB
4. Build the repository layer against the new schema
5. `make itest` to verify integration tests pass

## Go migrations — not supported
Go migrations require the migration functions to be registered and compiled into the binary. `go run ./cmd/migrate` produces a fresh binary on each invocation with no registered functions. Use SQL migrations for all schema changes.

## Testcontainers and migrations
Repository integration tests run against the real schema. `TestMain` in `postgres/health_repository_test.go` starts Postgres with Testcontainers and applies every migration with `goose.Up`, so a broken migration fails the test suite. Tests never create tables themselves; they call `truncate(t, "table", …)` to empty the tables they touch when they finish.

## Goose tracking table
Goose creates `goose_db_version` in the schema set by `BLUEPRINT_DB_SCHEMA` (via `search_path` in the connection string). Never modify this table manually.

## Hard rules
- No DDL inside Go code — `CREATE TABLE` belongs in a migration file, not in a repository method
- No Go migration files — SQL only
- Never edit or delete an applied migration — add a new one to correct it
