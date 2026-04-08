# Backend Runbook

Backend API and MySQL store for the Growth Map project dataset.

## Setup

Prereqs:
- Docker
- Docker Compose
- Node.js for host-side helper scripts

Create `.env`. The important database detail is:
- container-side app uses `DATABASE_URL=mysql://...@db:3306/...`
- host-side scripts automatically rewrite that to `127.0.0.1:3307` when needed

Start services:

```bash
docker-compose up --build -d
```

Open the API at `http://localhost:5002`.

Stop services:

```bash
docker-compose down
```

## Main Workflows

There are three practical ways to get project data into the backend.

### 1. Codex Batch Workflow

Best for large-scale authority coverage growth using Codex credits.

From `agents/`:

```bash
make overnight-growth-map ARGS="--yes --import --model gpt-5.2"
```

That runs:
1. authority coverage snapshot
2. local authority export
3. Codex batch prompt generation
4. Codex batch execution
5. coordinate backfill for batch outputs
6. merge of batch JSON files
7. import to backend, geo sync, and evaluation refresh

Step-by-step version:

```bash
cd ../agents
make go
make go-codex ARGS="--yes --model gpt-5.2"
cd ../backend
npm run seed:merge-codex-outputs
make db-backup
make seed-projects-update SEED=seeds/merged-from-codex.json
npm run sync:geo
npm run recompute:evaluations:all
```

### 2. Claude Batch Workflow

Same idea as Codex, but uses Claude for batch research.

From `agents/`:

```bash
make go
make go-claude ARGS="--yes"
cd ../backend
npm run seed:merge-claude-outputs
make db-backup
make seed-projects-update SEED=seeds/merged-from-claude.json
npm run sync:geo
npm run recompute:evaluations:all
```

### 3. Traditional / Manual Workflow

Use this for curated JSON imports, manual seed files, or non-batch updates.

Seed a JSON file without changing existing rows:

```bash
make seed-projects SEED=seeds/national-starter.json
```

Seed a JSON file and update existing rows:

```bash
make db-backup
make seed-projects-update SEED=seeds/codex-batches/out/batch-010.json
```

Host-side equivalent:

```bash
npx ts-node scripts/seedProjectsFromFile.ts seeds/codex-batches/out/batch-010.json --update-existing
```

## Database Safety

Create a compressed MySQL backup:

```bash
make db-backup
```

Or:

```bash
npm run db:backup
```

Restore from backup:

```bash
make db-restore BACKUP=backups/mysql-YYYYMMDD-HHMMSS.sql.gz
```

Or:

```bash
npm run db:restore -- backups/mysql-YYYYMMDD-HHMMSS.sql.gz
```

Helper scripts:
- [scripts/backupDatabase.sh](scripts/backupDatabase.sh)
- [scripts/restoreDatabase.sh](scripts/restoreDatabase.sh)

## Import Helpers

Core importer:
- [scripts/seedProjectsFromFile.ts](scripts/seedProjectsFromFile.ts)

Behavior:
- default mode inserts new projects and new evidence URLs only
- `--update-existing` updates existing project fields as well
- stale region UUIDs in incoming seed data are resolved from the matched local authority when possible

Useful commands:

```bash
make seed-projects SEED=seeds/projects.seed.json
make seed-projects-update SEED=seeds/merged-from-codex.json
make seed-all
```

## Batch / Seed Helpers

Generate and process Codex seed files:

```bash
npm run seed:export-local-authorities
npm run coverage:authorities
npm run seed:generate-codex-batches -- --authorities-json seeds/local-authorities.json
npm run seed:backfill-codex-coords -- --model gpt-5.2
npm run seed:merge-codex-outputs
```

Generate and process Claude seed files:

```bash
npm run seed:generate-claude-batches -- --authorities-json seeds/local-authorities.json
npm run seed:merge-claude-outputs
```

Files:
- `seeds/codex-batches/out/*.json`
- `seeds/claude-batches/out/*.json`
- `seeds/merged-from-codex.json`
- `seeds/merged-from-claude.json`

## Post-Import Processing

Assign region and local authority from stored coordinates:

```bash
npm run sync:geo
```

Recompute deterministic evaluations:

```bash
npm run recompute:evaluations
npm run recompute:evaluations:all
```

Notes:
- `recompute:evaluations` mainly fills missing coordinates and geo metadata
- `recompute:evaluations:all` recalculates all project RAG values using the deterministic scorer in `src/lib/projectEvaluation.ts`

## Make Helpers

Common backend helpers:

```bash
make up
make down
make logs
make shell
make migrate
make generate
make seed
make seed-projects SEED=...
make seed-projects-update SEED=...
make seed-all
make db-backup
make db-restore BACKUP=...
make recompute-evaluations
make recompute-evaluations-all
make seed-export-las
make coverage-authorities
make seed-codex-batches
make seed-merge-codex
make seed-backfill-codex-coords ARGS="--model gpt-5.2"
make seed-claude-batches
make seed-merge-claude
```

## API Notes

Projects support:
- `title`
- `description`
- `type`
- `regionId`
- `localAuthorityId`
- `expectedCompletion`
- `status`
- `statusRationale`
- `latitude`
- `longitude`
- `locationDescription`
- `locationSource`
- `locationConfidence`

Main routes:
- `GET /api/v1/projects`
- `GET /api/v1/projects/:id`
- `POST /api/v1/projects`
- `POST /api/v1/projects/:id`

## Related Docs

- [docs/seeding-projects.md](/Users/stephenhiggins/Code/lfg/backend/docs/seeding-projects.md)
- [../agents/README.md](../agents/README.md)
