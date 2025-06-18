# TODO

- [ ] Update/add any new source files in `/src`.
- [x] Build config (`tsup.config.ts`) now points to `src/cli.ts`.
- [x] `tsconfig.json` includes all files in `src/**/*.ts`.
- [x] Imports and scripts updated for `/src` structure.

# UK Government Project Agents

A scalable multi-agent system for monitoring, extracting, and scoring evidence on UK government projects.

## Quick Start Guide

1. **Install dependencies**
   ```sh
   pnpm install
   ```

2. **Copy and edit environment variables**
   ```sh
   cp .env.example .env
   # Edit .env to provide your DB, Redis, and OpenAI keys
   ```

3. **Build the agents**
   ```sh
   pnpm build
   ```

4. **Run the CLI (manual re-index test)**
   ```sh
   pnpm start -- reindex
   ```

5. **Import n8n workflow**
   - Open n8n, import `n8n-daily-sweep.json`.
   - Connect code nodes to `/src` modules as needed.

6. **Containerisation**
   ```sh
   docker build -t gov-agents .
   # Run with your .env and DB/Redis available
   ```

## Tools (now in `/src`)
- `fetcher.ts`: Fetch HTTP, CKAN, RSS
- `parser.ts`: Parse HTML/PDF
- `embedder.ts`: OpenAI embeddings
- `timelineMerger.ts`: Deduplicate/sort evidence
- `ragScorer.ts`: RAG logic
- `store.ts`: Typed DB layer
- `cli.ts`: One-off re-index
- `discoveryAgent.ts`, `evidenceAgent.ts`, `reportAggregator.ts`: Orchestration logic
- `types.ts`: Shared types

## Containerisation
See `Dockerfile` for build/run steps. Deploy via Kubernetes or Fargate for scaling.

---
