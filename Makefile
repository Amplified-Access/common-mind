.PHONY: setup dev \
        dev-backend dev-web \
        test test-backend \
        build build-backend build-web \
        lint lint-backend lint-web \
        tidy itest-backend deploy-prod

# ── Setup ──────────────────────────────────────────────────────────────────────

setup:
ifeq ($(OS),Windows_NT)
	powershell -ExecutionPolicy Bypass -File scripts/setup.ps1
else
	bash scripts/setup.sh
endif

# ── Development ────────────────────────────────────────────────────────────────

dev:
ifeq ($(OS),Windows_NT)
	powershell -ExecutionPolicy Bypass -File scripts/dev.ps1
else
	bash scripts/dev.sh
endif

dev-backend:
	cd backend && make watch

dev-web:
	cd web && pnpm dev

# ── Testing ────────────────────────────────────────────────────────────────────

test-backend:
	cd backend && go test ./...

# web/ has no test suite yet — add test-web here once Vitest is set up.
test: test-backend

# ── Build ──────────────────────────────────────────────────────────────────────

build-backend:
	cd backend && make build

build-web:
	cd web && pnpm build

build: build-backend build-web

# ── Utilities ──────────────────────────────────────────────────────────────────

itest-backend:
	cd backend && make itest

lint-backend:
	cd backend && go vet ./...

lint-web:
	cd web && pnpm lint

lint: lint-backend lint-web

tidy:
	cd backend && go mod tidy
	cd web && pnpm install

# ── Deploy ─────────────────────────────────────────────────────────────────────

# Rebases `production` onto `main` and force-pushes (with lease) to trigger a
# deploy. Aborts if the working tree is dirty or the rebase conflicts; prompts
# for confirmation before pushing unless CONFIRM=yes is set.
deploy-prod:
ifeq ($(OS),Windows_NT)
	pwsh -ExecutionPolicy Bypass -File scripts/deploy-prod.ps1
else
	bash scripts/deploy-prod.sh
endif
