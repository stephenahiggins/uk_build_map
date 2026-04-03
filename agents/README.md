# LFG Agents

- Run initial UK-wide scrape to staging (SQLite):
  ```bash
  make run ARGS="--uk-wide --stage --since 2025-01-16 --fetch 200 --max-evidence 3 --concurrency 4"
  ```
  (Use a YYYY-MM-DD date for `--since`; e.g. 30 days ago: `$(date -v-30d +%Y-%m-%d)` on macOS.)
- Migrate staged data into production DB:
  ```bash
  make migrate-to-backend MODE=append
  ```
TypeScript CLI for discovering local government infrastructure projects, gathering evidence, and syncing to the backend. Uses Prisma (SQLite in `agents/`), supports connector-only/manual staging workflows, and uses deterministic project evaluation instead of OpenAI runtime calls.

Run everything from the `agents/` directory.

## Quick start

```bash
cd agents
npm install
npx prisma generate
npx prisma db push
```

Set `GEMINI_API_KEY` only if you want live Gemini-assisted discovery. Connector-only and deterministic workflows do not require an API key.

Optional: `VALIDATE_EVIDENCE_URLS=true` to skip evidence rows whose URLs fail an HTTP check before persisting to the agents SQLite DB.

## Key Make targets

| Command | Description |
|--------|-------------|
| `make help` | List all commands |
| `make run ARGS="..."` | Build and run the CLI (e.g. `--locale 'London' --limit 3`) |
| `make debug ARGS="..."` | Debug the CLI with same args |
| `make mock ARGS="..."` | Run with mock Gemini responses |
| `make build` | Build TypeScript |
| `make clean` | Remove `dist` and cache |
| `make test` | Test Gemini integration |

### Staging and committing

| Command | Description |
|--------|-------------|
| `make commit-staged` | Commit staged JSON to agents DB (deduped). Use `FILE=<path>` or `ALL=1` |
| `make commit-latest` | Commit the newest file in `staging/` to agents DB |

### Backend migration

| Command | Description |
|--------|-------------|
| `make migrate-to-backend MODE=append` | Migrate agents SQLite → backend DB. Optional: `BACKEND_ENV=<path>`, `BACKEND_URL=<url>` |
| `make migrate-staged-to-backend MODE=append ...` | Commit staged files then migrate. Optional: `FILE=`, `ALL=1`, `BACKEND_ENV`, `BACKEND_URL` |
| `make recompute-rag ARGS="..."` | Re-evaluate RAG status for projects in the agents DB using the deterministic scorer |

### Full pipeline

| Command | Description |
|--------|-------------|
| `make compile-national` | UK-wide: scrape → stage → commit → migrate (script: `scripts/compile-national.sh`) |
| `make recompute-evaluations` | Backend: fill missing coordinates + RAG (`--mode coords-only`) |
| `make go` | Export local authorities + generate Codex batch prompts under `../backend/seeds/` (needs backend DB) |
| `make go-codex ARGS="--yes --model gpt-5.2"` | Run Codex non-interactively against each generated batch prompt |
| `make go-claude` | Optional: run [scripts/run-claude-seed-batches.sh](scripts/run-claude-seed-batches.sh) (`claude -p` per batch). Use `ARGS="--yes"` to skip confirmation. On limits, if Claude prints `resets 6pm (Europe/London)`-style text, the script sleeps until that wall time (needs `python3` + [parse_claude_limit_reset.py](scripts/parse_claude_limit_reset.py)); otherwise Enter / `CLAUDE_LIMIT_WAIT_MODE=sleep` |
| `make go-merge` | Merge `codex-batches/out/*.json` → `merged-from-codex.json` |
| `make overnight-growth-map ARGS="--yes --import"` | Run the full overnight coverage -> Codex -> merge -> import pipeline |
| `./agents/make go` | Same as `make go` from repo root |

See [backend/docs/seeding-projects.md](../backend/docs/seeding-projects.md) for the full Codex batch + geo sync runbook.

## Overnight pipeline

To spend Codex credits overnight on under-covered authorities:

```bash
make overnight-growth-map ARGS="--yes --import --model gpt-5.2"
```

This runs:
- authority coverage snapshot
- local authority export
- Codex batch generation
- `codex exec` across each batch prompt
- merge to `backend/seeds/merged-from-codex.json`
- optional seed/import, geo sync, deterministic evaluation refresh, and final coverage snapshot

## Example runs

```bash
# Single locale, limit projects
make run ARGS="--locale 'London' --limit 5"

# UK-wide discovery
make run ARGS="--uk-wide --fetch 200 --limit 50"

# Stage only (no DB write)
make run ARGS="--uk-wide --stage"

# Commit all staged, then migrate to backend
make commit-staged ALL=1
make migrate-to-backend MODE=append BACKEND_URL="mysql://user:pass@host:3306/dbname"

# Re-evaluate RAG deterministically
make recompute-rag
```

## Useful CLI flags

- `--locale <string>` — Area or comma-separated list (default: United Kingdom)
- `--uk-wide` — Run across nations and English regions
- `--fetch <n>` — Target number of projects to fetch (default 10)
- `--limit <n>` — Max projects to process (default: all)
- `--max-evidence <n>` — Evidence items per project (default 3)
- `--concurrency <n>` — Projects to process concurrently (default 3)
- `--since <YYYY-MM-DD>` — Incremental pull: only use connector data since this date
- `--stage` — Write to `staging/` only, don’t commit to DB
- `--provider gemini` — Optional live discovery provider
- `--connectors-only` — Skip model-driven discovery and rely on connectors only

Logs go to `cli.log`; use `tail -f cli.log` while running.
