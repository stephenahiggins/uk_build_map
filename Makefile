.PHONY: help backend-% frontend-% agents-%

help:
	@echo "Available commands:"
	@echo "  make backend-<target>    Run a backend Make target (e.g. backend-up)"
	@echo "  make frontend-<target>   Run a frontend Make target (e.g. frontend-start)"
	@echo "  make agents-<target>     Run an agents Make target (e.g. agents-build, agents-compile-national, agents-recompute-evaluations)"

backend-%:
	$(MAKE) -C backend $*

frontend-%:
	$(MAKE) -C frontend $*

agents-%:
	$(MAKE) -C agents $*
