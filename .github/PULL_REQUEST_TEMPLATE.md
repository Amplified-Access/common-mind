## Summary

<!--
  One paragraph. What problem does this PR solve, and how?
  If it fixes an issue: "Fixes #<number>"
-->

## Type of change

<!-- Check all that apply -->

- [ ] `feat` — new feature
- [ ] `fix` — bug fix
- [ ] `refactor` — no behaviour change
- [ ] `docs` — documentation only
- [ ] `test` — tests only
- [ ] `chore` — build, tooling, or dependency update
- [ ] Breaking change (existing behaviour changes in a backward-incompatible way)

## Affected layers

- [ ] Backend (Go / Gin / PostgreSQL)
- [ ] Web (Next.js / React / TypeScript)
- [ ] Inference (Python / Runpod)
- [ ] CI / infrastructure

## Checklist

### Code quality

- [ ] `go vet ./...` passes (backend)
- [ ] `pnpm lint && pnpm build` passes (web)

### Tests

- [ ] New behaviour is covered by tests
- [ ] Integration tests use Testcontainers — no database mocks
- [ ] `make test` (backend) passes locally

### Documentation

- [ ] Relevant doc in `backend/docs/` (or `web/docs/`) is updated
- [ ] New ADR in `docs/adr/` if an architectural decision changed
- [ ] `last_verified` date updated in any touched doc files
- [ ] `CLAUDE.md` / `AGENTS.md` updated if project setup or structure changed

## Screenshots / recordings

<!--
  Required for any UI change.
  Before / After screenshots help reviewers verify the intent without running the app.
  Delete this section if not applicable.
-->

| Before | After |
|--------|-------|
|        |       |

## Additional context

<!--
  Anything else reviewers should know: migration steps, performance impact,
  follow-up issues, known limitations, etc.
-->
