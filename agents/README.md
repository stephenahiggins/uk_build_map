# LFG Agents

TypeScript CLI for discovering local government infrastructure projects, gathering evidence, and syncing to the backend. Uses Prisma (SQLite in `agents/`), optional OpenAI or Gemini, and supports staging then committing data.

Run everything from the `agents/` directory.

## Quick start

```bash
cd agents
npm install
npx prisma generate
npx prisma db push
```

Set `OPENAI_API_KEY` or `GEMINI_API_KEY` (and optionally `PROVIDER=openai` or `PROVIDER=gemini`) in `agents/.env`.

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

### Full pipeline

| Command | Description |
|--------|-------------|
| `make compile-national` | UK-wide: scrape → stage → commit → migrate (script: `scripts/compile-national.sh`) |
| `make recompute-evaluations` | Recompute project evaluations (runs backend Make target) |

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
```

## Useful CLI flags

- `--locale <string>` — Area or comma-separated list (default: West Yorkshire)
- `--uk-wide` — Run across nations and English regions
- `--fetch <n>` — Target number of projects to fetch (default 100)
- `--limit <n>` — Max projects to process (default: all)
- `--max-evidence <n>` — Evidence items per project (default 10)
- `--stage` — Write to `staging/` only, don’t commit to DB
- `--provider openai|gemini` — LLM provider

Logs go to `cli.log`; use `tail -f cli.log` while running.
