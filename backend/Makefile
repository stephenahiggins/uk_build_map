DOCKER_COMPOSE = docker-compose
SERVICE = app

# --- Container Management ---
up:
	$(DOCKER_COMPOSE) up -d

down:
	$(DOCKER_COMPOSE) down

logs:
	$(DOCKER_COMPOSE) logs -f $(SERVICE)

shell:
	$(DOCKER_COMPOSE) exec $(SERVICE) /bin/sh

restart:
	$(DOCKER_COMPOSE) restart $(SERVICE)

# --- Database & Prisma ---
# See docs/seeding-projects.md (linked from README.md) for JSON seeding instructions.
migrate:
	$(DOCKER_COMPOSE) exec $(SERVICE) npx prisma migrate dev

generate:
	$(DOCKER_COMPOSE) exec $(SERVICE) npx prisma generate

update-schema:
	$(MAKE) generate
	$(MAKE) migrate

seed:
	$(DOCKER_COMPOSE) exec $(SERVICE) npx prisma db seed
	$(DOCKER_COMPOSE) exec $(SERVICE) npx ts-node scripts/seedProjectsFromFile.ts seeds/projects.seed.json

# Usage: make seed-projects [SEED=seeds/projects.seed.json]
# Use npx: ts-node lives in node_modules/.bin and is not on PATH for plain docker exec.
seed-projects:
	$(DOCKER_COMPOSE) exec $(SERVICE) npx ts-node scripts/seedProjectsFromFile.ts $(SEED)

recompute-evaluations:
	$(DOCKER_COMPOSE) exec $(SERVICE) npm run recompute:evaluations

recompute-evaluations-all:
	$(DOCKER_COMPOSE) exec $(SERVICE) npm run recompute:evaluations:all

seed-export-las:
	$(DOCKER_COMPOSE) exec $(SERVICE) npm run seed:export-local-authorities

coverage-authorities:
	$(DOCKER_COMPOSE) exec $(SERVICE) npm run coverage:authorities

seed-codex-batches:
	$(DOCKER_COMPOSE) exec $(SERVICE) npm run seed:generate-codex-batches -- --authorities-json seeds/local-authorities.json --out-dir seeds/codex-batches

seed-merge-codex:
	$(DOCKER_COMPOSE) exec $(SERVICE) npm run seed:merge-codex-outputs

seed-claude-batches:
	$(DOCKER_COMPOSE) exec $(SERVICE) npm run seed:generate-claude-batches -- --authorities-json seeds/local-authorities.json --out-dir seeds/claude-batches

seed-merge-claude:
	$(DOCKER_COMPOSE) exec $(SERVICE) npm run seed:merge-claude-outputs

# --- Testing ---
test:
	$(DOCKER_COMPOSE) exec $(SERVICE) npm test
