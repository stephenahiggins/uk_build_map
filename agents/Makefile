# Makefile for lfg_agents_2 project

# Default target
.PHONY: help
help:
	@echo "Available commands:"
	@echo "  make run ARGS=\"--locale 'London' --limit 3\"                    Run the CLI with arguments"
	@echo "  make debug ARGS=\"--locale 'London' --limit 3\"                  Debug the CLI with arguments"
	@echo "  make mock ARGS=\"--locale 'London' --limit 3\"                   Run with mock Gemini responses"
	@echo "  make test                                                         Test Gemini integration"
	@echo "  make build                                                        Build the TypeScript project"
	@echo "  make clean                                                        Clean build artifacts"
	@echo "  make help                                                         Show this help message"
	@echo "  make commit-staged FILE=<path> ALL=1                               Commit staged files to agents DB (deduped)"
	@echo "  make commit-latest                                                Commit newest staged file to agents DB (deduped)"
	@echo "  make migrate-staged-to-backend MODE=<mode> BACKEND_ENV=<env> BACKEND_URL=<url> FILE=<path> ALL=1  Commit staged JSONs then migrate to backend DB"
	@echo "  make migrate-to-backend MODE=<mode> BACKEND_ENV=<env> BACKEND_URL=<url>  Migrate to backend"
	@echo "  make compile-national                                         Continuous UK-wide scrape -> stage -> commit -> migrate"
	@echo "  make recompute-evaluations                                    Fill missing coords + RAG via backend (coords-only mode)"
	@echo "  make recompute-rag                                            Re-evaluate project RAG status in agents DB"
	@echo "  make go                                                         Export LAs + generate Codex batch prompts (see README)"
	@echo "  make go-codex ARGS=\"--yes --model gpt-5.2\"                      Run Codex CLI on each batch-*-PROMPT.md"
	@echo "  make go-merge                                                   Merge Codex batch JSON outputs into seeds/merged-from-codex.json"
	@echo "  make overnight-growth-map ARGS=\"--yes --import\"                Run full overnight coverage -> Codex -> merge -> import pipeline"
	@echo "  ./agents/make go                                                Same as \"make go\" from repo root"

# Build the TypeScript project
.PHONY: build
build:
	rm -rf dist
	npm run build

# Run the CLI with arguments (builds first)
.PHONY: run
run: build
	node dist/cli.js $(ARGS)

# Debug the CLI with arguments
.PHONY: debug
debug: 
	npm run debug -- $(ARGS)

# Run with mock Gemini responses
.PHONY: mock
mock: build
	MOCK_EVIDENCE_ANALYSIS=true MOCK_PROJECT_STATUS=true MOCK_INFRASTRUCTURE_SEARCH=true node dist/cli.js $(ARGS)

# Test Gemini integration
.PHONY: test
test:
	node test_gemini.js

# Clean build artifacts
.PHONY: clean
clean:
	rm -rf dist
	rm -rf node_modules/.cache

.PHONY: commit-staged
commit-staged: build
	node dist/cli.js commit-staged $(if $(FILE),--file $(FILE),) $(if $(ALL),--all,)

.PHONY: commit-latest
commit-latest: build
	@LATEST_FILE=$$(ls -t staging/*.json 2>/dev/null | head -n1); \
	if [ -z "$$LATEST_FILE" ]; then \
		echo "No staged files found in staging/"; \
		exit 1; \
	fi; \
	node dist/cli.js commit-staged --file "$$LATEST_FILE"

.PHONY: migrate-to-backend
migrate-to-backend:
	make build
	node dist/cli.js migrate-backend $(if $(MODE),--mode $(MODE),) $(if $(BACKEND_ENV),--backend-env $(BACKEND_ENV),) $(if $(BACKEND_URL),--backend-url $(BACKEND_URL),)

.PHONY: migrate-staged-to-backend
migrate-staged-to-backend:
	BACKEND_URL=$(BACKEND_URL) ./scripts/migrate-staged-to-backend.sh $(if $(MODE),--mode $(MODE),) $(if $(BACKEND_ENV),--backend-env $(BACKEND_ENV),) $(if $(FILE),--file $(FILE),) $(if $(ALL),--all,)

.PHONY: compile-national
compile-national:
	./scripts/compile-national.sh

.PHONY: recompute-evaluations
recompute-evaluations:
	$(MAKE) -C ../backend recompute-evaluations

.PHONY: recompute-rag
recompute-rag: build
	node dist/ragAgent.js $(ARGS)

# Capped-cost seed prep: export authorities from DB, emit Codex prompt batches (requires backend DATABASE_URL / npm from host)
.PHONY: go
go:
	cd ../backend && npm run coverage:authorities && npm run seed:export-local-authorities && npm run seed:generate-codex-batches -- --authorities-json seeds/local-authorities.json --out-dir seeds/codex-batches
	@echo ""
	@echo "Next: make go-codex (runs codex exec per batch), or open batch-*-PROMPT.md manually."
	@echo "Then: make go-merge (or ./agents/make go-merge)"

.PHONY: go-codex
go-codex:
	./scripts/run-codex-seed-batches.sh $(ARGS)

.PHONY: go-merge
go-merge:
	cd ../backend && npm run seed:merge-codex-outputs
	@echo ""
	@echo "Seed merged file (from repo root): make -C backend seed-projects SEED=seeds/merged-from-codex.json"
	@echo "(Uses docker-compose per backend/Makefile if that is how you run the API.)"

.PHONY: overnight-growth-map
overnight-growth-map:
	./scripts/overnight-growth-map.sh $(ARGS)
