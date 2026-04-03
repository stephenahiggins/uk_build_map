# Codex Restart Checklist

Use this with:

```sh
codex --sandbox workspace-write -a never
```

## Before changing code

1. Create a branch:

   ```sh
   git checkout -b codex/growth-map-no-openai
   ```

2. Create backups:

   ```sh
   mkdir -p backups
   docker-compose -C backend exec -T db mysqldump -uroot -p123456 node_boilerplate > backups/backend-mysql-$(date +%Y%m%d-%H%M%S).sql
   cp agents/prisma/storage/data.db backups/agents-data-$(date +%Y%m%d-%H%M%S).db
   ```

3. Verify backup files exist in `backups/`.

4. Read:
   - [CODEX_RESTART_PROMPT.md](/Users/stephenhiggins/Code/lfg/CODEX_RESTART_PROMPT.md)

## Delivery order

1. Remove or disable all OpenAI runtime paths.
2. Fix UK authority seed/reference geography.
3. Add authority coverage reporting.
4. Build real connectors.
5. Add dedupe and URL validation.
6. Upgrade the Codex batch workflow.
7. Build authority heat-map support.
8. Add deterministic non-OpenAI RAG scoring.

## Mandatory constraints

- No OpenAI API calls.
- Do not revert unrelated user changes.
- Use a new branch.
- Back up databases first.
- Prefer deterministic ingestion over LLM discovery.

## End-of-run report

State:
- branch name
- backup file paths
- what was implemented
- migrations/manual steps still required
- blockers
