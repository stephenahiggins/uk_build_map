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

# Usage: make seed-projects-update SEED=seeds/merged-from-codex.json
seed-projects-update:
	$(DOCKER_COMPOSE) exec $(SERVICE) npx ts-node scripts/seedProjectsFromFile.ts $(SEED) --update-existing

# Discovers project-array JSON under seeds/ (skips coverage snapshots, *-authorities.json, archive/).
# Existing projects are not updated; new evidence rows are skipped when the same URL already exists for the project.
# Usage: make seed-all  |  EXTRA=--dry-run make seed-all
seed-all:
	$(DOCKER_COMPOSE) exec $(SERVICE) npx ts-node scripts/seedAllFromJson.ts $(EXTRA)

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

seed-backfill-codex-coords:
	npm run seed:backfill-codex-coords -- $(ARGS)

db-backup:
	npm run db:backup

# Usage: make db-restore BACKUP=backups/mysql-YYYYMMDD-HHMMSS.sql.gz
db-restore:
	npm run db:restore -- $(BACKUP)

seed-claude-batches:
	$(DOCKER_COMPOSE) exec $(SERVICE) npm run seed:generate-claude-batches -- --authorities-json seeds/local-authorities.json --out-dir seeds/claude-batches

seed-merge-claude:
	$(DOCKER_COMPOSE) exec $(SERVICE) npm run seed:merge-claude-outputs

# --- Testing ---
test:
	$(DOCKER_COMPOSE) exec $(SERVICE) npm test
