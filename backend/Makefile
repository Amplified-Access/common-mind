# Simple Makefile for a Go project

# Build the application
all: build test

build:
	@echo "Building..."
	@go build -o main.exe cmd/api/main.go

# Run the application
run:
	@go run cmd/api/main.go

# Create DB container
docker-run:
	@docker compose up --build

# Shutdown DB container
docker-down:
	@docker compose down

# Test the application
test:
	@echo "Testing..."
	@go test ./... -v

# Integration tests (requires Docker)
itest:
	@echo "Running integration tests..."
	@go test ./internal/infrastructure/... -v

# Clean the binary
clean:
	@echo "Cleaning..."
	@rm -f main

# Generate Swagger docs (requires annotations to be up to date)
swagger:
	@echo "Generating Swagger docs..."
	@go run github.com/swaggo/swag/cmd/swag@v1.16.6 init -g cmd/api/main.go -o docs/swagger

# Lint the application
lint:
	@echo "Linting..."
	@golangci-lint run ./...

# Live Reload
watch:
	@if command -v air > /dev/null 2>&1; then \
		air; \
	else \
		echo "Installing air..."; \
		go install github.com/air-verse/air@latest; \
		AIR_BIN="$$(go env GOBIN)"; \
		if [ -z "$$AIR_BIN" ]; then AIR_BIN="$$(go env GOPATH)/bin"; fi; \
		"$$AIR_BIN/air"; \
	fi

# ---- Migrations (goose) ----

migrate-up:
	@go run ./cmd/migrate up

migrate-up-one:
	@go run ./cmd/migrate up-by-one

migrate-down:
	@go run ./cmd/migrate down

migrate-down-to:
	@go run ./cmd/migrate down-to $(version)

migrate-reset:
	@go run ./cmd/migrate down-to 0

migrate-status:
	@go run ./cmd/migrate status

migrate-version:
	@go run ./cmd/migrate version

migrate-create:
	@go run ./cmd/migrate create $(name)

# ---- Data Lab admin ----

# Import sources and items from a JSONL file: make datalab-import file=items.jsonl
datalab-import:
	@go run ./cmd/datalab import $(file)

# Import the development sample (dev/data-lab/sample-items.jsonl)
datalab-sample:
	@go run ./cmd/datalab import dev/data-lab/sample-items.jsonl

# Set a volunteer's level: make datalab-promote email=a@b.c language=sw level=reviewer
datalab-promote:
	@go run ./cmd/datalab promote $(email) $(language) $(level)

.PHONY: all build run test clean watch lint docker-run docker-down itest swagger \
        migrate-up migrate-up-one migrate-down migrate-down-to migrate-reset \
        migrate-status migrate-version migrate-create \
        datalab-import datalab-sample datalab-promote
