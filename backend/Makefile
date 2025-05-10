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
migrate:
	$(DOCKER_COMPOSE) exec $(SERVICE) npx prisma migrate dev

prisma-generate:
	$(DOCKER_COMPOSE) exec $(SERVICE) npx prisma generate

update-schema:
	$(MAKE) prisma-generate
	$(MAKE) migrate

seed:
	$(DOCKER_COMPOSE) exec $(SERVICE) npx prisma db seed

# --- Testing ---
test:
	$(DOCKER_COMPOSE) exec $(SERVICE) npm test
