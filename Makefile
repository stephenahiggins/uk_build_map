.PHONY: help backend-% frontend-% agents-% seed-all

help:
	@echo "Available commands:"
	@echo "  make seed-all            Import all project JSON seeds (Docker backend; see backend/Makefile)"
	@echo "  make backend-<target>    Run a backend Make target (e.g. backend-up)"
	@echo "  make frontend-<target>   Run a frontend Make target (e.g. frontend-start)"
	@echo "  make agents-<target>     Run an agents Make target (e.g. agents-build, agents-compile-national, agents-recompute-evaluations)"

backend-%:
	$(MAKE) -C backend $*

frontend-%:
	$(MAKE) -C frontend $*

agents-%:
	$(MAKE) -C agents $*

# Run backend seed-all inside Docker (see backend/Makefile).
# Example: make seed-all EXTRA=--dry-run
seed-all:
	$(MAKE) -C backend seed-all EXTRA="$(EXTRA)"
