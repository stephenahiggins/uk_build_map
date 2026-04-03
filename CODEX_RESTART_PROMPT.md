# Growth Map Implementation Prompt

You are working in the `lfg` repository.

Run this work on a **new branch** and assume the session was started with:

```sh
codex --sandbox workspace-write -a never
```

## First actions

1. Create a new branch before changing anything.
   Suggested name:

   ```sh
   git checkout -b codex/growth-map-no-openai
   ```

2. Back up the existing databases before any schema, seed, or migration work.

   Back up the backend MySQL database:

   ```sh
   mkdir -p backups
   docker-compose -C backend exec -T db mysqldump -uroot -p123456 node_boilerplate > backups/backend-mysql-$(date +%Y%m%d-%H%M%S).sql
   ```

   Back up the agents SQLite database:

   ```sh
   cp agents/prisma/storage/data.db backups/agents-data-$(date +%Y%m%d-%H%M%S).db
   ```

3. Confirm the backup files exist before proceeding.

4. Do not use the OpenAI API. Remove or disable any runtime path that can trigger OpenAI calls.

## Context

The current Growth Map implementation is not meeting the product brief yet.

Known issues:
- Discovery is too dependent on LLM web search and has been expensive.
- The map is still mostly a project marker map, not a local-authority heat map.
- UK authority coverage is incomplete and skewed.
- The backend reference geography is incomplete: only English local authorities are seeded, and they are largely mapped to `Unassigned`.
- The connector framework exists but only supports `local-json`.
- OpenAI search paths still exist and must be removed or disabled.

The goal is to move Growth Map to a **Codex-driven, no-OpenAI** workflow built around:
- structured public-source connectors
- deterministic ingestion
- authority-level coverage reporting
- authority heat-map UX
- optional heuristic RAG scoring instead of paid API inference

## Objectives

Implement the following in order.

### 1. Remove OpenAI runtime usage

Files likely involved:
- `agents/src/openaiRuntime.ts`
- `agents/src/llmRuntime.ts`
- `agents/src/envValues.ts`
- `agents/src/cli.ts`
- `README.md`
- `agents/README.md`

Requirements:
- No code path should call OpenAI web search or OpenAI models.
- Discovery should support:
  - `connectors-only`
  - manual batch / seed workflows
- Update docs to reflect the new no-OpenAI workflow.

### 2. Fix UK geography and authority reference data

Files likely involved:
- `backend/prisma/schema.prisma`
- `backend/prisma/seed.ts`
- `backend/scripts/syncGeoBoundaries.ts`
- `backend/src/lib/geoLookup.ts`
- `backend/seeds/local-authorities.json`

Requirements:
- Seed full UK local authority coverage:
  - England
  - Scotland
  - Wales
  - Northern Ireland
- Stop defaulting authorities to `Unassigned`.
- Add proper mapping between authorities and their region/nation.
- Ensure boundary sync can populate polygons for all supported authorities.
- Re-run or enable project geo-assignment based on those boundaries.

### 3. Add authority coverage reporting

Add schema and scripts for authority-level coverage and freshness reporting.

Suggested additions:
- metadata for evidence URL verification
- metadata for discovery source and source confidence
- authority coverage snapshot table or equivalent persisted aggregate

Add:
- a script to compute authority coverage
- backend endpoints to expose authority coverage

The coverage view should make it easy to see:
- which authorities have no projects
- which have stale evidence
- which have poor mapping quality
- which should be prioritised for Codex batch research

### 4. Build real connectors

Files likely involved:
- `agents/src/connectors/index.ts`
- `agents/src/connectors/types.ts`
- new files in `agents/src/connectors/`

Implement connector scaffolds in priority order:
1. Planning Inspectorate / NSIP
2. GMPP / IPA-style major projects import
3. Contracts Finder
4. Find a Tender
5. Local authority news / RSS
6. Combined authority / regional transport authority news

Requirements:
- normalize all connector output into a common project shape
- include evidence/source metadata
- support staging and dedupe before import

### 5. Add dedupe and URL validation

Requirements:
- dedupe by normalized title + authority + location where possible
- validate source URLs before import
- allow failed URL checks only in explicit staging workflows, not normal import

### 6. Upgrade the manual batch workflow for Codex

Existing files:
- `backend/scripts/exportLocalAuthoritiesJson.ts`
- `backend/scripts/generateClaudeSeedBatches.ts`
- `backend/scripts/mergeClaudeSeedOutputs.ts`

Requirements:
- adapt this workflow for Codex
- rename scripts if appropriate
- generate batches based on under-covered authorities, not arbitrary chunks
- prioritize Scotland, Wales, Northern Ireland, then sparse English authorities
- keep URL validation in the merge step

### 7. Build authority heat-map support

Files likely involved:
- `backend/src/v1/controllers/project.controller.ts`
- new coverage / authority endpoints
- `frontend/src/components/atoms/ListProjectsMap.tsx`
- `frontend/src/components/pages/ListProjects/ListProjects.tsx`

Requirements:
- move from project-marker-first to authority-first map UX
- render authority-level heat/choropleth state
- click authority to inspect projects and supporting evidence
- keep project markers only as a secondary drill-down mode

### 8. Add non-OpenAI RAG scoring

Requirements:
- implement a baseline heuristic RAG scorer
- use evidence text and source patterns to classify:
  - `RED`
  - `AMBER`
  - `GREEN`
- keep the logic deterministic and inspectable
- do not introduce paid API dependencies

## Working style

- Prefer minimal, high-leverage changes first.
- Do not revert unrelated existing changes in the worktree.
- Use `apply_patch` for file edits.
- Prefer `rg` for search.
- Verify with scripts/tests where feasible.

## Deliverables

At the end of the run:

1. Summarize what was implemented.
2. List any migrations or manual follow-up steps required.
3. State whether DB backups were created and where they were written.
4. State whether a new branch was created and its name.
5. Report any blockers that prevented completion.
