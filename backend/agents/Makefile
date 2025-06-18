# Makefile for UK Gov Agents

.PHONY: help install build start reindex status evidence lint format docker-up docker-down redis-up redis-down clean

help:
	@echo "Available targets:"
	@echo "  install    Install all dependencies (pnpm)"
	@echo "  build      Build the agents (tsup)"
	@echo "  start      Run the CLI (default: reindex)"
	@echo "  reindex    Run a full sweep of all projects"
	@echo "  status     Show all project statuses"
	@echo "  evidence   Show evidence for a project (usage: make evidence PROJECT=project-id)"
	@echo "  lint       Run TypeScript and code linter"
	@echo "  format     Format code with prettier"
	@echo "  up         Start all services via docker-compose (Redis, etc)"
	@echo "  docker-up  Start local Redis (Docker, legacy)"
	@echo "  docker-down Stop local Redis (Docker, legacy)"
	@echo "  redis-up   Alias for docker-up"
	@echo "  redis-down Alias for docker-down"
	@echo "  clean      Remove dist and dashboards"

install:
	pnpm install

build:
	pnpm build

start:
	pnpm start -- reindex

reindex:
	pnpm start -- reindex

status:
	pnpm start -- status

evidence:
	pnpm start -- evidence $(PROJECT)

lint:
	npx tsc --noEmit

format:
	npx prettier --write ./src

docker-up redis-up:
	docker run --name gov-agents-redis -p 6379:6379 -d redis:7 || true

docker-down redis-down:
	docker stop gov-agents-redis && docker rm gov-agents-redis || true

up:
	docker stop gov-agents-redis gov-agents-app || true
	docker rm gov-agents-redis gov-agents-app || true
	docker-compose up -d

down:
	docker-compose down

clean:
	rm -rf dist dashboard-*.html

install:
	pnpm install
