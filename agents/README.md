# Agents — Project Discovery & Data Pipeline

TypeScript CLI that discovers UK infrastructure projects, gathers evidence, and pushes data into the backend MySQL database for the Growth Map.

> **Run everything from the `agents/` directory.**

---

## Which workflow should I use?

There are **three ways** to get project data into the backend. Pick **one**:

| # | Workflow | What it does | Cost | When to use |
|---|----------|-------------|------|-------------|
| **A** | [Codex/Claude batch seeding](#workflow-a--codexclaude-batch-seeding-recommended) | Generates prompts for under-covered local authorities, runs Codex/Claude to research projects, merges results, seeds backend | Codex/Claude credits | **Recommended for growing UK coverage.** Best for filling gaps across all ~360 local authorities overnight |
| **B** | [Live Gemini discovery](#workflow-b--live-gemini-discovery) | CLI calls Gemini with web search to find projects for a locale, stages them, migrates to backend | Gemini API calls (~12 per project) | One-off deep dives into a specific area. Expensive at scale |
| **C** | [Connectors only (free)](#workflow-c--connectors-only-free) | Pulls from structured government data sources — no LLM needed | Free | Structured data from Contracts Finder, GMPP, Planning Inspectorate, RSS. No API key required |

---

### Workflow A — Codex/Claude batch seeding (recommended)

**One command does everything overnight:**

```bash
make overnight-growth-map ARGS="--yes --import --model gpt-5.2"
```

This runs: authority coverage → export → batch generation → Codex research → coordinate backfill → merge → seed → geo sync → evaluation refresh.

**Or step by step:**

```bash
# 1. Generate batch prompts from under-covered authorities
make go

# 2. Run Codex on each prompt (or: make go-claude)
make go-codex ARGS="--yes --model gpt-5.2"

# 3. Merge outputs into a single seed file
make go-merge

# 4. Import into the backend
cd ../backend && make seed-projects SEED=seeds/merged-from-codex.json
```

See [backend/docs/seeding-projects.md](../backend/docs/seeding-projects.md) for the full runbook.

Recommended safer import for refreshed batches:

```bash
cd ../backend
make db-backup
make seed-projects-update SEED=seeds/merged-from-codex.json
npm run sync:geo
npm run recompute:evaluations:all
```

---

### Workflow B — Live Gemini discovery

Requires `GEMINI_API_KEY` in `.env`.

```bash
# Discover projects for a single area
make run ARGS="--locale 'London' --limit 5"

# UK-wide discovery (expensive — hundreds of API calls)
make run ARGS="--uk-wide --stage --since 2025-01-16 --fetch 200 --max-evidence 3 --concurrency 4"

# Then push staged data to the backend
make commit-staged ALL=1
make migrate-to-backend MODE=append
```

**Data flow:** Gemini → `staging/*.json` → agents SQLite DB → backend MySQL.

---

### Workflow C — Connectors only (free)

No API key required. Set connector URLs in `.env`.

```bash
make run ARGS="--connectors-only --connectors contracts-finder,gmpp-ipa,planning-inspectorate"
```

**Data flow:** Government API → `staging/*.json` → agents SQLite DB → backend MySQL.

---

## Quick start

```bash
cd agents
npm install
npx prisma generate
npx prisma db push
```

Create `.env` from `.env.example`. The only key you might need is `GEMINI_API_KEY` (for Workflow B only).

---

## Data pipeline overview

```
                    ┌─────────────────────┐
                    │   Data sources       │
                    │                      │
     Workflow A:    │  Codex/Claude        │
     Workflow B:    │  Gemini + web search │
     Workflow C:    │  Gov API connectors  │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │ (Workflows B & C)               │ (Workflow A)
              ▼                                 ▼
     staging/*.json                   backend/seeds/codex-batches/out/*.json
              │                                 │
              ▼                                 │  make go-merge
     agents SQLite DB                           ▼
              │                        backend/seeds/merged-from-codex.json
              │  make migrate-to-backend        │
              │                                 │  make seed-projects
              └──────────────┬──────────────────┘
                             ▼
                      backend MySQL DB
                             │
                             ▼
                    npm run sync:geo
               (assign region + local authority)
                             │
                             ▼
                npm run recompute:evaluations
              (deterministic RAG scoring + coords)
```

---

## Make targets

### Core

| Command | Description |
|---------|-------------|
| `make help` | List all commands |
| `make build` | Compile TypeScript |
| `make run ARGS="..."` | Build and run CLI |
| `make mock ARGS="..."` | Run with mock Gemini responses |
| `make clean` | Remove `dist/` and cache |

### Staging → agents DB → backend DB (Workflows B & C)

| Command | Description |
|---------|-------------|
| `make commit-staged ALL=1` | Commit all staged JSON to agents SQLite DB (deduped by title) |
| `make commit-staged FILE=staging/file.json` | Commit a specific staged file |
| `make commit-latest` | Commit only the newest staged file |
| `make migrate-to-backend MODE=append` | Push agents SQLite → backend MySQL |
| `make migrate-staged-to-backend MODE=append ALL=1` | Commit + migrate in one step |

### Codex/Claude batch pipeline (Workflow A)

| Command | Description |
|---------|-------------|
| `make go` | Export local authorities → generate batch prompts |
| `make go-codex ARGS="--yes --model gpt-5.2"` | Run Codex on each prompt |
| `make go-claude` | Run Claude on each prompt (alternative to Codex) |
| `make go-merge` | Merge batch outputs → `backend/seeds/merged-from-codex.json` |
| `make overnight-growth-map ARGS="--yes --import"` | Full overnight pipeline: coverage → batch → codex → merge → import → geo sync |

### Backend helper commands you will commonly use after agent runs

Run these from `backend/`:

| Command | Description |
|---------|-------------|
| `make db-backup` | Create a compressed MySQL backup before imports |
| `make db-restore BACKUP=backups/mysql-YYYYMMDD-HHMMSS.sql.gz` | Restore a backup into MySQL |
| `make seed-projects SEED=...` | Insert projects from a JSON file without overwriting existing rows |
| `make seed-projects-update SEED=...` | Insert projects and update existing rows from a JSON file |
| `npm run sync:geo` | Reassign region/local authority from project coordinates |
| `npm run recompute:evaluations:all` | Recompute deterministic project evaluations across all projects |
| `npm run seed:backfill-codex-coords -- --model gpt-5.2` | Backfill coordinates in Codex batch output files before merge |

### Post-import evaluation

| Command | Description |
|---------|-------------|
| `make recompute-evaluations` | Backfill coordinates + RAG status via backend |
| `make recompute-rag` | Re-run deterministic RAG scorer on agents SQLite DB |
| `make compile-national` | Continuous loop: Gemini scrape → stage → commit → migrate (long-running, Workflow B) |

---

## CLI flags

| Flag | Description | Default |
|------|-------------|---------|
| `--locale <area>` | Target area (e.g. `'London'`, `'Yorkshire and the Humber'`) | `United Kingdom` |
| `--uk-wide` | Iterate over all UK nations and English regions | off |
| `--fetch <n>` | Target number of projects to discover | 10 |
| `--limit <n>` | Max projects to process | all |
| `--max-evidence <n>` | Evidence items per project | 3 |
| `--concurrency <n>` | Parallel workers | 3 |
| `--since <YYYY-MM-DD>` | Only pull data newer than this date | — |
| `--stage` | Write to `staging/` only; don't commit to agents DB | off |
| `--provider gemini` | Use Gemini for live discovery | `gemini` |
| `--connectors-only` | Skip LLM discovery; use connectors only | off |
| `--connectors <list>` | Comma-separated connector names to activate | env `CONNECTORS` |

---

## Connectors

Structured, free data sources (no LLM required):

| Name | Source | Env var |
|------|--------|---------|
| `local-json` | Local JSON file on disk | `LOCAL_PROJECTS_JSON` (file path) |
| `contracts-finder` | [Contracts Finder](https://www.contractsfinder.service.gov.uk/) | `CONTRACTS_FINDER_URL` |
| `gmpp-ipa` | Gov Major Projects Portfolio / IPA | `GMPP_URL` |
| `planning-inspectorate` | National Infrastructure Planning | `PLANNING_INSPECTORATE_URL` |
| `find-a-tender` | Find a Tender Service | `FIND_A_TENDER_URL` |
| `local-authority-news` | Local authority RSS feeds | `LOCAL_AUTHORITY_NEWS_FEEDS` (comma-separated) |
| `regional-transport-news` | Regional transport RSS feeds | `REGIONAL_TRANSPORT_NEWS_FEEDS` (comma-separated) |

---

## Environment variables

| Variable | Required? | Description |
|----------|-----------|-------------|
| `GEMINI_API_KEY` | Workflow B only | Google Gemini API key |
| `DATABASE_URL` | Auto | Agents SQLite path (Prisma manages this) |
| `BACKEND_DATABASE_URL` | For migration | MySQL connection string for backend |
| `VALIDATE_EVIDENCE_URLS` | Optional | `true` to HTTP-check evidence URLs before saving |
| `CONNECTORS` | Optional | Default connector list (comma-separated) |
| `LOCALE` | Optional | Default locale (default: `United Kingdom`) |
| `MODEL` | Optional | LLM model override (default: `gemini-2.5-flash`) |
| `NO_LLM` | Optional | `true` to disable all LLM calls |

Logs: `tail -f cli.log`
