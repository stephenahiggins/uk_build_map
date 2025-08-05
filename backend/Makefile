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
	$(DOCKER_COMPOSE) exec $(SERVICE) npx prisma migrate deploy

prisma-generate:
	$(DOCKER_COMPOSE) exec $(SERVICE) npx prisma generate

update-schema:
	$(MAKE) prisma-generate
	$(MAKE) migrate

seed:
	$(DOCKER_COMPOSE) exec $(SERVICE) npx prisma db seed

# Usage: make seed-projects [SEED=seeds/projects.seed.json]
seed-projects:
	$(DOCKER_COMPOSE) exec $(SERVICE) ts-node scripts/seedProjectsFromFile.ts $(SEED)

# --- Testing ---
test:
	$(DOCKER_COMPOSE) exec $(SERVICE) npm test
