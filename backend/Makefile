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

# --- Database & Prisma ---
migrate:
	$(DOCKER_COMPOSE) exec $(SERVICE) npx prisma migrate dev

prisma-generate:
	$(DOCKER_COMPOSE) exec $(SERVICE) npx prisma generate

seed:
	$(DOCKER_COMPOSE) exec $(SERVICE) npx prisma db seed

# --- Testing ---
test:
	$(DOCKER_COMPOSE) exec $(SERVICE) npm test
