.PHONY: install setup dev build test lint type-check clean docker-up docker-down docker-build seed e2e

# ── First-time setup ──────────────────────────────────────────────────────────
setup:
	@echo "→ Installing dependencies..."
	pnpm install
	@echo "→ Setting up environment files..."
	@cp -n apps/api/.env.example apps/api/.env 2>/dev/null || true
	@cp -n apps/web/.env.example apps/web/.env 2>/dev/null || true
	@echo "→ Running database migrations..."
	pnpm db:generate
	pnpm db:migrate
	@echo "→ Seeding with demo data..."
	pnpm --filter @vc/db run seed
	@echo ""
	@echo "✓ Setup complete! Run 'make dev' to start."
	@echo "⚠  Don't forget to add your ANTHROPIC_API_KEY to apps/api/.env"

# ── Development ───────────────────────────────────────────────────────────────
install:
	pnpm install

dev:
	pnpm dev

# ── Quality ───────────────────────────────────────────────────────────────────
lint:
	pnpm --recursive run lint

type-check:
	cd apps/web && npx tsc --noEmit
	cd apps/api && npx tsc --noEmit

test:
	pnpm --recursive run test

test-watch:
	pnpm --filter @vc/web vitest

test-ui:
	pnpm --filter @vc/web vitest --ui

coverage:
	pnpm --filter @vc/web vitest run --coverage
	pnpm --filter @vc/api vitest run --coverage

e2e:
	pnpm exec playwright test

e2e-ui:
	pnpm exec playwright test --ui

e2e-report:
	pnpm exec playwright show-report

# ── Build ─────────────────────────────────────────────────────────────────────
build:
	pnpm --filter @vc/web build
	pnpm --filter @vc/api build

# ── Database ─────────────────────────────────────────────────────────────────
seed:
	pnpm --filter @vc/db run seed

db-studio:
	pnpm db:studio

# ── Docker ────────────────────────────────────────────────────────────────────
docker-up:
	docker compose up

docker-up-d:
	docker compose up -d

docker-down:
	docker compose down

docker-build:
	docker compose build

docker-logs:
	docker compose logs -f

docker-reset:
	docker compose down -v
	docker compose up --build

# ── Cleanup ───────────────────────────────────────────────────────────────────
clean:
	find . -name 'node_modules' -type d -maxdepth 3 -prune -exec rm -rf '{}' +
	find . -name 'dist' -type d -maxdepth 4 -prune -exec rm -rf '{}' +
	find . -name 'coverage' -type d -maxdepth 4 -prune -exec rm -rf '{}' +
	find . -name '.turbo' -type d -maxdepth 4 -prune -exec rm -rf '{}' +

# ── Help ─────────────────────────────────────────────────────────────────────
help:
	@echo "VC Sourcing Platform — Available commands:"
	@echo ""
	@echo "  make setup        First-time setup (install, migrate, seed)"
	@echo "  make dev          Start dev servers (web + api)"
	@echo "  make test         Run all unit + integration tests"
	@echo "  make e2e          Run Playwright E2E tests"
	@echo "  make coverage     Run tests with coverage report"
	@echo "  make lint         Run oxlint + ESLint"
	@echo "  make type-check   TypeScript type checking"
	@echo "  make build        Production build"
	@echo "  make docker-up    Start with Docker Compose"
	@echo "  make seed         Re-seed database with demo data"
