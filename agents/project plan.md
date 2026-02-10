# Project Plan: UK Productivity Map Data Pull + RAG Status

## Summary
Build a low‑cost, repeatable pipeline that discovers UK public and private sector projects, gathers evidence, and assigns Red/Amber/Green (RAG) status with defensible rationale. The system should prioritize authoritative UK data sources, incremental updates, and caching to minimize LLM usage and API costs.

## Current Behavior (from README files)
- CLI searches for infrastructure projects in a locale, gathers evidence via Gemini, scores with RAG, and persists to SQLite (Prisma). It supports geographic mapping (regions/local authorities) and evidence date validation.
- CLI can migrate SQLite data to the backend database and supports a SQLite-to-Prisma seed converter.

## Goals
- Broaden coverage to UK public sector and private sector projects relevant to productivity.
- Improve data accuracy, evidence traceability, and RAG consistency.
- Minimize recurring costs by preferring free/open data and reducing LLM calls.
- Enable a looped “continuous refresh” workflow with strong dedupe and provenance.
- Support a UK-wide backfill mode across nations and English regions.

## Gaps
- Over‑reliance on LLM discovery (expensive, brittle).
- Limited structured ingestion from official datasets/APIs.
- RAG status logic depends heavily on model output rather than measured indicators.
- Limited change detection and incremental update strategy.

## Proposed Improvements

### 1) Source Strategy: Prioritize Official and Open Data
- Public procurement notices (structured, frequent updates) for public sector projects.
- National planning data for local authority development projects.
- Company registry data to enrich private sector projects (ownership, location, SIC codes).
- UK public sector API catalogue for additional domain datasets.
  - Start with a connector registry that can include public and private sources, with a local JSON connector for cheap backfills.

### 2) Ingestion Architecture
- Add a “connectors” layer: each source has a connector that produces a normalized Project + Evidence format.
- Implement incremental pulls: only fetch changes since last run via timestamps or IDs.
- Add strict provenance fields: source name, endpoint, retrieved_at.
- Use a deterministic dedupe pipeline before any LLM enrichment.
  - Allow connector-only runs to avoid LLM discovery costs.

### 3) Evidence and RAG Status Rules
- Evidence is required from at least 2 independent sources for GREEN or AMBER.
- RAG status derived from rules + evidence freshness + project milestones.
- Store RAG rationale explicitly (rule hits + evidence IDs).

### 4) Cost Controls
- Cache all raw API responses and LLM calls by input hash.
- Only run LLM analysis when a project is new or evidence materially changed.
- Use local embeddings (open‑source) for similarity and dedupe.
- Add a per-run LLM call budget that falls back to mock/no‑LLM mode when exhausted.

### 5) Continuous Loop
- Nightly incremental pull from structured sources.
- Weekly “LLM sweep” for ambiguous or unclassified items only.
- Monthly reconciliation run to re‑score RAG based on new evidence.
- Add a UK-wide backfill mode for first-time population, then switch to incremental updates.
- Support a “no‑LLM mode” that skips LLM calls and still updates project metadata from structured sources.

## RAG Status Framework (Rules‑First)

### GREEN
- Evidence updated within last 90 days.
- Project has active funding or delivery milestones (e.g., contract award, construction start).
- Evidence from 2+ independent sources.

### AMBER
- Evidence exists but is older than 90 days and less than 365 days, or
- Conflicting evidence (e.g., delays reported without official cancellation), or
- Funding not fully confirmed.

### RED
- Evidence indicates cancellation, indefinite pause, or funding withdrawal, or
- No credible evidence within 365 days.

### Confidence
- Assign a confidence score (0–1) based on evidence count, source authority, and recency.

## Milestones
1. Build connectors layer with at least 2 official sources and cached ingestion.
2. Implement deterministic dedupe + normalization pipeline.
3. Implement rule‑based RAG engine with evidence linkage.
4. Add LLM enrichment as a secondary step for ambiguous cases.
5. Add scheduled incremental jobs (daily/weekly/monthly).

## Risks
- Source schema changes; mitigate with monitoring and contract tests.
- Rate limits; mitigate with backoff + caching.
- Incomplete private sector coverage; mitigate with multiple sources + enrichment.

## Success Metrics
- Cost per new project < £0.01 in LLM usage.
- ≥ 90% of projects have at least 2 evidence items.
- ≤ 5% duplicate rate after dedupe.
