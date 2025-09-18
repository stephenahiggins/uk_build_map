.PHONY: migrate-to-backend

migrate-to-backend:
	npm --prefix agents run migrate-backend -- $(if $(MODE),--mode $(MODE),) $(if $(BACKEND_ENV),--backend-env $(BACKEND_ENV),) $(if $(BACKEND_URL),--backend-url $(BACKEND_URL),)
