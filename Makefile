.PHONY: help backend-% frontend-% agents-% recompute-evaluations

help:
	@echo "Available commands:"
	@echo "  make backend-<target>    Run a backend Make target (e.g. backend-up)"
	@echo "  make frontend-<target>   Run a frontend Make target (e.g. frontend-start)"
	@echo "  make agents-<target>     Run an agents Make target (e.g. agents-build)"
	@echo "  make recompute-evaluations  Recompute project evaluations via backend helper"

backend-%:
	$(MAKE) -C backend $*

frontend-%:
	$(MAKE) -C frontend $*

agents-%:
	$(MAKE) -C agents $*

recompute-evaluations:
	$(MAKE) -C backend recompute-evaluations
