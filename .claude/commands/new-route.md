Scaffold a new API route end-to-end in the Go backend.

You need from the user:
- Route path (e.g. `/api/v1/languages`)
- HTTP method (GET / POST / PUT / DELETE / PATCH)
- Brief description of what it does
- Whether it needs database access

Read `backend/docs/routing.md` and `backend/docs/database.md` first. They are kept in sync with the code.

## Steps

### 1. Entity — `backend/internal/domain/<name>.go`
Add the type if it doesn't exist. No imports beyond the standard library.

### 2. Use case — `backend/internal/usecase/<name>.go`
- Declare the repository interface here (the layer that depends on it).
- Add the use case interface and implementation.
- If the use case has rules (validation, branching, invariants), write the failing test first in `usecase/<name>_test.go` using a hand-written fake of the repository. If it only passes data through, skip the test.

### 3. Repository — `backend/internal/infrastructure/database/postgres/<name>_repository.go`
- Parameterized SQL only.
- Write the failing integration test first in `<name>_repository_test.go` (Testcontainers, following `health_repository_test.go`): the happy path plus the constraint or edge case the query handles.
- If the route needs a new table, add a migration first: `make migrate-create name=<slug>`.

### 4. Handler — `backend/internal/transport/handlers/<name>_handler.go`
- Method on `*Handler`, with swaggo annotations.
- Add the use case to the `Handler` struct and `NewHandler` in `handler.go`.
- Test the handler only if it validates input or maps errors to status codes.

### 5. Route and wiring
- Register the route in `RegisterRoutes()` in `handlers/routes.go`, under `api` if it needs auth.
- Wire repository → use case → handler in `internal/server/server.go`.

## After scaffolding
```bash
cd backend && go vet ./...
cd backend && make test
cd backend && make swagger   # commit the regenerated docs with the handler
```

Commit atomically (see `AGENTS.md` → Commits): a migration and its repository can be one commit, and the route that uses it the next.
