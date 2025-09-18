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
	\echo "  make migrate-to-backend MODE=<mode> BACKEND_ENV=<env> BACKEND_URL=<url>  Migrate to backend"

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

.PHONY: migrate-to-backend
migrate-to-backend:
	make build
	node dist/cli.js migrate-backend $(if $(MODE),--mode $(MODE),) $(if $(BACKEND_ENV),--backend-env $(BACKEND_ENV),) $(if $(BACKEND_URL),--backend-url $(BACKEND_URL),)