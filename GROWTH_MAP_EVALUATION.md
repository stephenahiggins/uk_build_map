# Growth MAP: Full Codebase Evaluation & Strategic Recommendations

**Date:** March 2026  
**Scope:** End-to-end analysis of the Growth MAP codebase — agents, backend, frontend, and data  
**Purpose:** Assess current approach, identify data gaps, diagnose cost overruns, and chart a sustainable path forward

---

## Executive Summary

Growth MAP's architecture is technically coherent but operationally broken in three specific ways:

1. **Severe geographic skew.** 3,232 projects exist in the agent database, but the data is overwhelmingly concentrated in West Yorkshire and London. Scotland has 2 projects. Wales has 2. Northern Ireland has 0.
2. **Crippling unit economics.** Each project costs roughly 12+ LLM API calls to produce. At scale across ~360 UK local authorities, this has burned through hundreds of pounds and is not repeatable.
3. **Incomplete geo-linkage.** Zero of the 3,232 projects in the agent SQLite database have a `localAuthorityId` or `regionId` assigned, making the heatmap functionality entirely dependent on lat/lng coordinates — which are missing for 30% of projects.

The good news: the underlying architecture is sound. The pipeline (discover → evidence → evaluate → migrate → map) is the right shape. The fixes are specific and tractable.

---

## Part 1: Architecture Assessment

### How Growth MAP Works Today

```
LLM (OpenAI/Gemini + web search)
        ↓
  CLI (agents/src/cli.ts)
        ↓
  SQLite DB (agents/prisma)
        ↓
  migrate-backend → MySQL (backend/prisma)
        ↓
  REST API (backend/src)
        ↓
  React Frontend (frontend/src)
```

**Discovery:** The CLI calls an LLM with a web search tool, asking it to return a JSON list of UK infrastructure projects for a given locale (e.g. "Leeds", "West Yorkshire", "United Kingdom"). This is the primary data collection mechanism. There is no traditional web scraping despite `cheerio` being listed as a dependency.

**Evidence gathering:** For each project, up to 10 additional LLM+web-search calls are made to collect evidence items — news articles, press releases, official sources.

**Evaluation:** A RAG (Red/Amber/Green) status is assigned to each project via a separate LLM call using a structured JSON schema. This uses `projectEvaluation.ts` shared between agents and the backend.

**Migration:** Projects flow from SQLite (agents) to MySQL (backend) via `migrateBackend.ts`, with deduplication on project title.

**Geo resolution:** Coordinates are assigned by the LLM during evaluation. Post-migration, `syncGeoBoundaries.ts` resolves projects to region/local authority using UK ArcGIS boundary polygons and Turf.js point-in-polygon.

### Is This the Right Approach?

**LLM-as-discoverer: partially.** Using LLMs with web search for discovery is a pragmatic shortcut, but it has fundamental reliability problems:
- LLMs hallucinate URLs. Evidence URLs cannot be verified as real during the pipeline — there is no HTTP validation step.
- LLMs have strong recency bias toward high-profile, frequently-covered projects. Local authorities in rural areas are systematically underrepresented.
- The model is being asked to both *discover* and *judge* simultaneously, which compresses a nuanced editorial process into a single prompt.

**LLM-as-evaluator: appropriate.** Using an LLM to synthesise evidence into a RAG status is a good use of the technology, especially when real evidence URLs are confirmed first.

**The pipeline structure: correct.** SQLite staging → MySQL production → REST API → map is a clean separation. The `syncGeoBoundaries.ts` approach using official UK ArcGIS boundary data is robust and free.

---

## Part 2: Data Distribution Analysis

### Current State (agents SQLite DB — 3,232 projects)

| Metric | Count | Notes |
|--------|-------|-------|
| Total projects | 3,232 | |
| With `localAuthorityId` | **0** | Geo-linkage never happened in agents DB |
| With `regionId` | **0** | Geo-linkage never happened in agents DB |
| With lat/lng coordinates | 2,258 (70%) | 974 have no location at all |
| GREEN status | 1,366 (42%) | |
| AMBER status | 1,816 (56%) | |
| RED status | 50 (1.5%) | Suspiciously low — LLM is optimistic |
| Total evidence items | 10,875 | Average ~3.4 per project |
| Distinct location descriptions | 2,747 | Inconsistent text, hard to aggregate |

### Geographic Distribution (by lat/lng bands)

| Band | Projects | % of Total | Notes |
|------|----------|------------|-------|
| Scotland (>56°N) | **2** | **0.1%** | Catastrophically underrepresented |
| Northern England (53–56°N) | 715 | 22% | Heavy Leeds/Bradford bias |
| Midlands/Central (51.5–53°N) | 951 | 29% | Reasonably covered |
| South England (50–51.5°N) | 520 | 16% | London skews this up |
| No coordinates | **974** | **30%** | Completely unlocated |
| Wales | ~2 | ~0.1% | Not covered |
| Northern Ireland | ~0 | ~0% | Not covered |

### Top Areas by Project Count (text matching)

| Area | Projects |
|------|----------|
| West Yorkshire (various labels) | ~780 |
| London | ~289 |
| Norfolk | 68 |
| York | 64 |
| Manchester | 60 |
| Leicester | 59 |
| Kent | 59 |
| Nottingham | 53 |
| Staffordshire | 49 |
| Devon | 48 |
| **Scotland total** | **~4** |
| **Wales total** | **~4** |
| **Northern Ireland total** | **~0** |

### Root Cause of the Skew

**The `LOCALE` default in `envValues.ts` is `"West Yorkshire"`.**

```typescript
LOCALE: process.env.LOCALE || "West Yorkshire",
```

Every run that didn't explicitly pass `--uk-wide` or `--locale` has been adding West Yorkshire projects. The UK-wide runs that did happen used `UK_WIDE_LOCALES` but the LLM's training data and web search results naturally skew toward areas with more online coverage — i.e. major English cities.

The `UK_WIDE_LOCALES` array (defined in `cli.ts`) correctly includes all ~300 UK local authorities, but a single UK-wide run takes far too long and too much money to complete comprehensively.

### Project Type Problem

**Every single project in the agent DB has `type = LOCAL_GOV`.** The backend schema supports `NATIONAL_GOV`, `REGIONAL`, `LOCAL_GOV`, and `PRIVATE`. The agents search prompt is hardcoded to only discover local government projects, which misses:
- National infrastructure (HS2, nuclear, broadband rollout)
- Combined authority projects (West Yorkshire Combined Authority, TfL)
- Private development with public funding

---

## Part 3: Cost Analysis

### The Cost of the Current Pipeline

For each project, the pipeline makes the following LLM API calls:

| Step | Calls | Model (current default) |
|------|-------|------------------------|
| Discovery (search) | 1 per locale × up to 4 retries | OpenAI `gpt-5-mini` + `web_search_preview` |
| Evidence gathering | Up to 10 per project | OpenAI `gpt-5-mini` + `web_search_preview` |
| RAG evaluation | 1 per project | OpenAI `gpt-4-turbo` (backend) or `gpt-5-mini` (agents) |
| **Total per project** | **~12 calls** | |

### Why It's Expensive

1. **Web search tool usage.** OpenAI's `web_search_preview` tool is charged per-use in addition to token costs. A single search-grounded response uses this tool.
2. **Evidence gathering at scale.** 10 evidence calls per project × 3,232 projects = 32,320 cloud calls just for evidence.
3. **Ollama mode still uses cloud for web search.** When `OPENAI_COMPAT_MODE=ollama`, `fetchWebSearchResults` still calls OpenAI cloud with `gpt-4o-mini` for the search step before handing to the local model. You pay for cloud search every time.
4. **Rate limit handling.** When rate-limited in non-TTY mode, the code sleeps for 60 seconds and retries — this doesn't stop billing, it just stalls progress.
5. **No URL validation.** Evidence URLs generated by the LLM may not exist. Paying for an LLM to generate a fake URL is pure waste.

### Current Configuration (from `agents/.env`)

```
OPENAI_WEB_SEARCH_MODEL=gpt-4o-mini        # cloud, charged per use
OPENAI_MODEL=gpt-oss:20b                   # local Ollama model  
OPENAI_BASE_URL=http://localhost:11434/v1   # Ollama
OPENAI_COMPAT_MODE=ollama                  # hybrid: cloud search + local analysis
PROVIDER=openai
```

This is the hybrid Ollama setup — local analysis is free but every web search still hits OpenAI's cloud API. With 10 evidence calls per project × 3,232 projects, that's 32,320+ cloud API calls for evidence alone.

---

## Part 4: Bugs and Broken Functionality

### Critical Bugs

**1. `migrateBackend.ts` — override mode broken**
The `clearBackendProjects` function references `prisma.lLMSummary` and `prisma.discoveredProject`, which do not exist in the backend Prisma schema. The `--mode override` flag will crash at runtime.

**2. Geo-linkage never runs on the agents DB**
The `syncGeoBoundaries.ts` script targets the backend MySQL database. The agents SQLite DB has no `Region` or `LocalAuthority` tables populated (0 records each). This means:
- `localAuthorityId` is always null
- `regionId` is always null
- The heatmap cannot aggregate by local authority from the agents DB

**3. Prisma version mismatch**
Agents uses Prisma 6.x; the backend uses Prisma 5.x. The agents CLI imports directly from `../../backend/src/lib/projectEvaluation.ts`, which uses the backend's `node_modules`. Version skew can cause silent runtime issues.

### Significant Issues

**4. `recomputeProjectEvaluations.ts` only processes projects with missing coordinates**
The script filters `where: { OR: [{ latitude: null }, { longitude: null }] }`. Despite the name, it is a coordinate-filling script, not a full RAG recompute.

**5. RAG status skew (too optimistic)**
Only 1.5% of projects are RED. Local government projects frequently face serious delays, funding shortfalls, and cancellations. The LLM evaluator is being too charitable, likely because:
- The prompt does not strongly define what constitutes RED vs AMBER
- LLMs tend to hedge toward AMBER when uncertain
- Evidence is gathered from the same LLM that might not surface negative coverage

**6. Evidence URL reliability**
Evidence URLs are generated by an LLM with web search, not validated by fetching. The pipeline should include an HTTP HEAD check before storing any URL as evidence.

**7. `getProjectSummary` reports a global local authority count**
The `/projects/summary` endpoint counts all local authorities in the database, not filtered by the same query parameters as the project list. This misleads the UI about coverage.

**8. Frontend requests up to 1,000 projects for map view**
`ListProjects.tsx` fetches `limit=1000` for map data, with each response including full evidence arrays. This is a very heavy payload.

**9. `constants.ts` enum mismatch**
`agents/src/constants.ts` defines `OTHER` and `IMAGE` evidence types that don't exist in the backend Prisma `EvidenceType` enum (`PDF`, `URL`, `TEXT`, `DATE`). Migration may silently fail for these records.

---

## Part 5: Recommended Next Steps

### Priority 1 — Fix the Geographic Coverage Without Spending Money

#### Option A: Batch generation using Claude Code or Claude.ai ($20/month cap)

Claude's Pro subscription ($20/month) includes Claude Code and access to Claude.ai with web search. This gives you a cost-capped way to generate seed data.

**Process:**
1. Divide the UK's ~360 local authorities into batches of 20–30.
2. For each batch, run a Claude Code session that:
   - Web-searches each authority for major infrastructure projects (last 2 years)
   - Generates a JSON array matching the seed schema in `backend/docs/seeding-projects.md`
   - Includes evidence URLs (which can then be validated before import)
3. Validate URLs with a simple `curl -I` or Node HTTP check script before seeding
4. Import using `make seed-projects SEED=seeds/batch-X.json`

**Cost:** ~$20/month, capped. One session per authority cluster.

**Effort:** Medium. Requires prompting discipline but no code changes.

#### Option B: Use free structured data sources as connectors

The `connectors/` framework in agents already supports `localJsonConnector`. Add connectors for free, structured government data:

| Source | What it provides | Cost |
|--------|-----------------|------|
| [data.gov.uk](https://www.data.gov.uk/) | Planning, transport, infrastructure datasets | Free |
| [Infrastructure and Projects Authority (IPA)](https://www.gov.uk/government/collections/major-projects-data) | Government Major Projects Portfolio (GMPP) — annual report on 200+ major projects with RAG status already assigned | Free |
| [Planning Inspectorate](https://infrastructure.planninginspectorate.gov.uk/) | All nationally significant infrastructure applications with status | Free |
| [Find a Tender (FTS)](https://www.find-tender.service.gov.uk/) | Government procurement notices — proxy for project starts | Free |
| [Contracts Finder](https://www.contractsfinder.service.gov.uk/) | Public contracts >£10k — very granular local authority activity | Free |
| UK Parliament PINS data | Planning applications for NSIPs | Free |

The IPA GMPP data is particularly valuable: it includes ~200 major government projects **with existing RAG status**, which aligns exactly with Growth MAP's purpose and can be imported directly.

#### Option C: RSS feed monitoring for incremental updates

Many UK local councils publish RSS feeds on their planning portal or news sections. A lightweight scraper using `cheerio` (already a dependency) and `rss-parser` could poll these feeds to identify new projects without LLM costs.

```
council.gov.uk/news/rss → parse titles → filter by keywords → create stub projects → queue for LLM evaluation
```

This reduces discovery cost to near-zero; LLM is only invoked for evaluation (one call per project) rather than discovery + evidence + evaluation.

### Priority 2 — Make Existing Data Cost-Effective

#### Switch to Gemini 2.0 Flash for all discovery

Gemini 2.0 Flash with Google Search grounding is significantly cheaper than OpenAI web search for the discovery step:
- **Gemini 2.0 Flash**: ~$0.10/1M input tokens, free Google Search grounding calls (at low volume)
- **OpenAI gpt-4o-mini + web_search_preview**: higher cost per search-grounded response

Update `PROVIDER=gemini` and `GEMINI_MODEL=gemini-2.0-flash` in `agents/.env`.

#### Cap evidence gathering

`maxEvidence` defaults to 10. The current average is 3.4 evidence items per project. Consider:
- Set `--max-evidence 3` for discovery runs
- Only increase to 5–10 for projects that get flagged RED or are high-value

#### Use Ollama fully for evaluation

The RAG evaluation (`ragAgent.ts`) does **not** require web search — it just analyses existing evidence text. Run this entirely locally with a capable model (Llama 3.1 8B or Qwen2.5 14B):

```bash
make recompute-rag ARGS="--local --openai-model llama3.1:8b"
```

This means cloud API costs only apply to discovery (web search), not evaluation.

#### Validate URLs before paying for evidence gathering

Add an HTTP check before the evidence-gathering LLM call:

```typescript
const isLive = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) })
  .then(r => r.ok).catch(() => false);
if (!isLive) skip;
```

This prevents paying for evidence analysis on hallucinated URLs.

### Priority 3 — Fix the Geo-Linkage Problem

All 3,232 projects in the agent DB have null `localAuthorityId` and `regionId`. The backend's `syncGeoBoundaries.ts` script can fix this, but **it targets MySQL, not SQLite**.

**Recommended fix:**

After migrating projects to the backend MySQL with `make migrate-to-backend MODE=append`, immediately run:

```bash
cd backend && npx ts-node scripts/syncGeoBoundaries.ts --projects-only
```

This will use the ArcGIS boundary data (free, official) to assign all 2,258 projects with coordinates to the correct local authority and region. No LLM cost.

For the 974 projects without coordinates, options are:
1. Run `recomputeProjectEvaluations.ts` (which does an LLM call to infer coordinates from the project title/description)
2. Manually review and assign the most important ones
3. Accept that ~30% will be unlocated on the heatmap

### Priority 4 — Cover Scotland, Wales, and Northern Ireland

These nations are almost entirely missing. Their projects tend to be less covered in English-language news, which is why the LLM-as-discoverer approach fails here.

**Recommended approach:**

For Scotland:
- [Scottish Government Infrastructure Investment Plan](https://www.gov.scot/publications/infrastructure-investment-plan-2021-22-2025-26/) — publicly available, structured list of projects
- [Transport Scotland](https://www.transport.gov.scot/projects/) — searchable project database

For Wales:
- [Welsh Government Capital Investment Programme](https://www.gov.wales/capital-investment-programme)
- [Infrastructure (Wales) Act 2024 project register](https://www.gov.wales/infrastructure-wales-act-2024)

For Northern Ireland:
- [Department for Infrastructure NI](https://www.infrastructure-ni.gov.uk/)
- [InvestNI project pipeline](https://www.investni.com/)

These sources should be created as `connector` implementations that pull structured data directly, bypassing LLM discovery entirely.

### Priority 5 — Fix Critical Bugs

In priority order:

**1. Fix `migrateBackend.ts` — remove or comment out the `clearBackendProjects` function** until the referenced models (`lLMSummary`, `discoveredProject`) are added to the backend schema or the function is rewritten.

**2. Add URL validation before evidence storage.** A simple HTTP HEAD check before storing any URL evidence item would immediately improve data quality.

**3. Strengthen the RAG evaluation prompt.** Add explicit criteria:
- RED = project cancelled, funding withdrawn, >2 year delay announced, government inquiry underway
- AMBER = significant delay reported, budget increase >20%, planning objection upheld, contractor changes
- GREEN = on schedule, within budget, milestones met, recent positive progress report

**4. Standardise `locationDescription` format.** Currently 2,747 distinct values for what should be a structured field. Consider normalising to `{town}, {county}, {country}` format during migration.

**5. Fix `getProjectSummary` local authority count** to filter by the same `where` clause as the project list.

---

## Part 6: Revised Architecture Proposal

```
┌─────────────────────────────────────────────────────────────────────┐
│  DATA SOURCES (free, no LLM cost)                                   │
│  • IPA GMPP annual report (JSON export) → pre-RAG'd projects        │
│  • Planning Inspectorate API → NSIP pipeline                        │
│  • Contracts Finder / Find a Tender → project signals               │
│  • Scottish/Welsh/NI government structured data                     │
│  • Council RSS feeds → news monitoring                              │
└──────────────────────────┬──────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────────┐
│  CONNECTORS (agents/src/connectors/)                                │
│  • localJsonConnector (existing)                                    │
│  • ipaConnector (new) — parse IPA GMPP spreadsheet                 │
│  • rssConnector (new) — poll council RSS feeds                      │
│  • planningInspectorateConnector (new) — API                        │
└──────────────────────────┬──────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────────┐
│  LLM (minimal, targeted use only)                                   │
│  Provider: Gemini 2.0 Flash (cheap) for web search                 │
│  Provider: Ollama / Llama 3.1 8B for evaluation (free, local)      │
│  Only used for: filling gaps + RAG evaluation                       │
│  NOT used for: discovery of projects already in structured sources  │
└──────────────────────────┬──────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────────┐
│  SQLite staging → MySQL backend (existing pipeline)                 │
│  + ArcGIS boundary sync for LA/region assignment (free, existing)  │
└──────────────────────────┬──────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────────┐
│  Frontend heatmap                                                   │
│  By local authority (360 LAs), colour = RAG status aggregate        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Part 7: Quick Wins (This Week)

| Action | Effort | Cost | Impact |
|--------|--------|------|--------|
| Run `syncGeoBoundaries.ts --projects-only` after next backend migration | 5 min | Free | Assigns LA/region to 2,258 existing projects |
| Change `LOCALE` default from "West Yorkshire" to "United Kingdom" | 1 line | Free | Stops future skew |
| Download and import IPA GMPP 2024 report as seed JSON | 2–4 hrs | Free | Adds ~200 pre-evaluated major projects across all of UK |
| Set `--max-evidence 3` as new default | 1 line | -70% cost | Immediate cost reduction |
| Switch `PROVIDER=gemini`, `GEMINI_MODEL=gemini-2.0-flash` | 2 lines | -60% cost | Cheaper discovery |
| Add HTTP URL validation in evidence store step | ~20 lines | Free | Stop storing dead URLs |
| Use Claude Code sessions for Scotland/Wales/NI seed data | 2–3 sessions | $20/month cap | Fills biggest gaps |

---

## Part 8: Coverage Targets

To achieve a meaningful UK-wide heatmap, the following minimum thresholds per local authority are suggested:

| Coverage tier | Projects per LA | Target LAs | Notes |
|---------------|-----------------|------------|-------|
| Good | 5–15 | All 360 UK LAs | Sufficient for heatmap colouring |
| Strong | 15–40 | Major urban areas (~50 LAs) | Enough for drill-down exploration |
| Comprehensive | 40+ | Top 20 cities | Press/research grade |

Current state:
- LAs with ≥5 projects: ~30 (8% of 360)
- LAs with 0 projects: ~310 (86% of 360)
- **Coverage gap: ~330 local authorities have effectively no data**

---

## Appendix: Key File Locations

| File | Purpose |
|------|---------|
| `agents/src/cli.ts` | Main discovery pipeline |
| `agents/src/geminiService.ts` | Search + evidence prompts |
| `agents/src/llmRuntime.ts` | OpenAI/Gemini routing |
| `agents/src/envValues.ts` | All env config + defaults |
| `agents/src/data/ukLocalAuthorities.ts` | List of ~280 UK LAs for UK-wide runs |
| `agents/src/migrateBackend.ts` | SQLite → MySQL migration (has bugs) |
| `backend/src/lib/projectEvaluation.ts` | Shared RAG evaluation logic |
| `backend/src/lib/geoLookup.ts` | Turf-based LA resolution |
| `backend/scripts/syncGeoBoundaries.ts` | ArcGIS boundary sync (run this!) |
| `backend/scripts/recomputeProjectEvaluations.ts` | Coordinate filling (not full recompute) |
| `backend/docs/seeding-projects.md` | Seed schema + LLM prompts |
| `backend/seeds/staging.seed.json` | National project seed (some data quality issues) |

---

*Report generated via full codebase analysis — agents, backend, frontend, SQLite DB query, and environment configuration review.*
