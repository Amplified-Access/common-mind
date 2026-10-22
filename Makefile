.PHONY: setup dev \
        dev-backend dev-web dev-datalab \
        test test-backend \
        build build-backend build-web build-datalab \
        lint lint-backend lint-web lint-datalab \
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

dev-datalab:
	cd datalab && pnpm dev

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

build-datalab:
	cd datalab && pnpm build

build: build-backend build-web build-datalab

# ── Utilities ──────────────────────────────────────────────────────────────────

itest-backend:
	cd backend && make itest

lint-backend:
	cd backend && go vet ./...

lint-web:
	cd web && pnpm lint

lint-datalab:
	cd datalab && pnpm lint

lint: lint-backend lint-web lint-datalab

tidy:
	cd backend && go mod tidy
	cd web && pnpm install
	cd datalab && pnpm install

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
