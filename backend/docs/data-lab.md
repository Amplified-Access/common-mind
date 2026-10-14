---
topic: data-lab
last_verified: 2026-10-14
sources:
  - internal/domain/datalab.go
  - internal/usecase/datalab.go
  - internal/infrastructure/database/postgres/datalab_repository.go
  - internal/transport/handlers/datalab_handler.go
  - internal/infrastructure/database/migrations/20261014060632_add_languages.sql
---

# Data Lab

The volunteer platform for creating, annotating, and verifying civic language datasets (ADR 0010). The web UI lives at `/data-lab`; this backend serves it under `/api/v1/data-lab`.

## Layers

| Layer | File | Holds |
|---|---|---|
| Domain | `internal/domain/datalab.go` | `Language` and the Data Lab constants |
| Use case | `internal/usecase/datalab.go` | `DataLab` (the API handlers call) and `DataLabStore` (the persistence it needs) |
| Repository | `internal/infrastructure/database/postgres/datalab_repository.go` | `DataLabStore` on Postgres |
| Handlers | `internal/transport/handlers/datalab_handler.go` | HTTP handlers, registered in `routes.go` |

## Languages

`languages` is reference data seeded by its migration: the nine target languages (BCP-47 codes shared with Watchtower) and English and French as source languages. Each row carries its ISO 15924 `script` and the `extra_characters` a standard keyboard lacks, which the web editor offers as a palette. Disable a language with `enabled = false`; never delete rows other tables reference.

## Routes

| Method | Path | Auth | Handler |
|---|---|---|---|
| GET | `/api/v1/data-lab/languages` | none | `ListLanguagesHandler` — enabled languages, targets first |
