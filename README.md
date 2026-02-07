# UK Growth Map

![UK Growth Map logo](frontend/public/logo192.png)

A map of UK growth projects. This project use an agentic LLM to harvest data and an express backend and custom frontend. 

## Project Structure

- `backend/` — Node.js/Express API, Prisma ORM, Dockerized, MySQL database
- `frontend/` — React-based frontend (TypeScript)
- `agents/` — Long-running or scheduled workers (AI / automation) for evidence processing, enrichment, notifications

Recent updates include a profile management screen, evidence submission, and a moderation workflow for approving or rejecting evidence items.

## Getting Started

### Prerequisites
- [Docker](https://www.docker.com/)
- [Node.js](https://nodejs.org/) (for local development outside Docker)

### Environment Variables
Copy `.env.example` to `.env` and fill in required values for both backend and frontend as needed.

### Backend Development

1. **Start Services**
   ```sh
   cd backend
   make up
   ```
2. **Apply Prisma Migrations**
   ```sh
   make migrate
   ```
3. **Open a Shell in the Container**
   ```sh
   make shell
   ```
4. **View Logs**
   ```sh
   make logs
   ```
5. **Seed the Database**
   ```sh
   make seed
   ```
6. **Run Tests**
   ```sh
   make test
   ```

### Recomputing Project RAG Status & Location

The shared Gemini-powered evaluator can be run against existing MySQL data to refresh
stored RAG statuses, rationales, and latitude/longitude coordinates.

1. Ensure the backend dependencies are installed and the database is accessible (e.g. via `make up`).
2. Set the required environment variables (at minimum `GEMINI_API_KEY`, plus optionally `GEMINI_MODEL` or `MOCK_PROJECT_EVALUATION=true` for dry runs).
3. From the `backend/` directory run:
   ```sh
   npm run recompute:evaluations
   ```
   This executes `scripts/recomputeProjectEvaluations.ts`, iterating over all projects and
   persisting the refreshed evaluation results.

You can execute the command either on your host machine (with access to the database) or inside the backend Docker container via `make shell`. For Docker-based workflows there's also a convenience wrapper:

```sh
cd backend
make recompute-evaluations
```

### Frontend Development

1. Install dependencies and run the dev server:
   ```sh
   cd frontend
   npm install
   npm start
   ```

## Database
- Uses MySQL, managed via Docker Compose
- Prisma ORM for schema and migrations

## Useful Makefile Commands (in backend/)
| Command          | Description                            |
|------------------|----------------------------------------|
| make up          | Start backend & db containers          |
| make down        | Stop and remove containers             |
| make logs        | Tail backend service logs              |
| make shell       | Shell into backend container           |
| make migrate     | Run Prisma migrations                  |
| make prisma-generate | Generate Prisma client             |
| make seed        | Run Prisma seed script                 |
| make test        | Run backend tests                      |
 |make seed-projects SEED=seeds/national-starter.json | Seed files |
## API Documentation
- Swagger UI available at `/api-docs/:version` (when not in production)

### Evidence Moderation Endpoints

- `GET /api/v1/evidence` – list evidence items awaiting approval
- `POST /api/v1/evidence/:id/approve` – mark an evidence item as approved
- `POST /api/v1/evidence/:id/reject` – reject an evidence item

## Agents

The agents subsystem provides background automation to augment the core platform.

### Current Responsibilities
- Evidence enrichment: extract summaries, tag categories, suggest related initiatives
- Moderation assistance: draft rationale suggestions for approve/reject
- Notification dispatch: batched digest emailing or queue publication
- Data hygiene: periodic reconciliation (stale evidence, orphaned relations)

### Architecture
- Each agent is an isolated module with:
   - A registrar (exports name, schedule/trigger, handler)
   - Dependency injection of Prisma client and logging
   - Optional model/provider abstraction for LLM calls
- Execution modes:
   - Scheduled (cron-like, e.g. every 10m)
   - Queue / event triggered (e.g. new evidence created)
   - Manual (invoked via CLI)

### Directory Layout (agents/)
- `/agents/index.ts` registry & loader
- `/agents/workers/*` individual agent implementations
- `/agents/lib/*` shared helpers (LLM client, retry, metrics)

### Environment Variables
Add to `.env` as needed:
- AGENTS_ENABLED=true|false (master switch)
- AGENT_CONCURRENCY=4
- OPENAI_API_KEY=... (or other provider key)
- AGENT_MODEL=gpt-4o-mini (override per agent if needed)
- AGENT_LOG_LEVEL=info|debug
- AGENT_RUN_EVIDENCE_ENRICH=true|false (feature flag examples)

### Running Locally
1. Ensure backend containers are up: `make up`
2. In backend container shell: `node scripts/run-agent.js --once evidence-enrichment`
3. Or run all scheduled agents loop: `node scripts/agents-runner.js`

### Adding a New Agent
1. Create `agents/workers/my-new-agent.ts`
2. Export:
    ```ts
    export const agent: RegisteredAgent = {
       name: 'my-new-agent',
       schedule: 'cron(0 * * * *)', // or null
       run: async (ctx) => { /* logic */ }
    }
    ```
3. Register automatically (index scans directory) or import in `agents/index.ts`
4. Add feature flag + docs
5. Test: `npm run agent -- --once my-new-agent --dry-run`

### Observability
- Logs: standard backend log stream filtered by `[agent:<name>]`
- Metrics (optional): emitted to StatsD / Prometheus if configured
- Failure policy: exponential backoff with max attempts (default 5)
- Dead-letter: failed payloads persisted in `agent_failures` table (run cleanup agent)

### CLI Helpers
Examples (inside backend container):
- List agents: `node scripts/agents-cli.js list`
- Dry run one: `node scripts/agents-cli.js run evidence-enrichment --dry-run`
- Replay failures: `node scripts/agents-cli.js replay --agent evidence-enrichment`

### Safety / Guardrails
- Token + cost limiting per interval
- PII scrubbing prior to LLM calls
- Deterministic hashing to avoid duplicate enrichment
- Circuit breaker trips after consecutive failures

### Adding Dependencies
If an agent needs an external API:
- Add client in `agents/lib/`
- Use env var prefix `EXT_<SERVICE>_*`
- Update README and `.env.example`

(Adjust naming if your actual file structure differs.)

## Contributing
Pull requests and issues are welcome! Please lint and test your code before submitting.

---

For more details, see the documentation in each subdirectory.