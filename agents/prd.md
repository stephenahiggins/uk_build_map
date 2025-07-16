# Evidence Creation LLM Agents - Product Requirements

## Overview
These agents automate the collection of project evidence from the web and official data sources. Evidence is ingested, validated and stored alongside projects in the existing database. All logic is written in **TypeScript** and integrates with models through the PortKey AI Gateway so different providers can be swapped without code changes.

## Goals
- Scrape the web and UK government APIs for project evidence.
- Provide a mechanism to add new evidence to existing projects without overwriting.
- Support "locale" mode to target *Yorkshire and the Humber* data only.
- Limit the number of returned results when debugging.
- Integrate with the backend database via direct access or through an AI interface.
- Remain cost conscious by batching requests and reusing context.

## Features
### Web Scraping & API Integration
- Crawl public websites for project news and status updates.
- Query common UK data portals such as data.gov.uk, GOV.UK content API and local authority datasets.
- Normalise sources so new evidence can be added from additional APIs with minimal code changes.

### Evidence Handling
- Newly scraped evidence is stored in an intermediate staging queue.
- Duplicate detection prevents modification of existing project records.
- Agents associate evidence to projects via project IDs or titles.
- When a project cannot be matched, the agent proposes a new project entry that can be reviewed by a human.

### Locale Mode
- Activating locale mode restricts scraping and API queries to resources referencing **Yorkshire and the Humber**.
- Locale filters apply to both web scrapes and API calls.

### Result Limits
- A configurable `MAX_RESULTS` parameter limits the volume of evidence returned for debugging.

### PortKey LLM Gateway
- Language model calls are routed through the [PortKey AI Gateway](https://github.com/Portkey-AI/gateway).
- The gateway presents an OpenAI‑compatible API so providers like OpenAI or Google Gemini can be selected by setting a different virtual key.

### Cost Management
- Requests are batched when possible to reduce token usage.
- Cached results avoid duplicate external calls.

## Architecture
1. **Crawler Layer** – collects raw data via HTTP scraping or API requests.
2. **Processing Layer** – cleans, deduplicates and summarises evidence using models accessed through the PortKey gateway.
3. **Storage Layer** – persists evidence to the MySQL database via existing Prisma models. Alternate mode stores summaries with an AI assistant pending approval.
4. **Coordinator** – orchestrates scheduled runs and locale filtering.

## Non‑Goals
- The agents will not modify existing project metadata directly. They only append new evidence or suggest new projects for review.

## Data Sources
- [data.gov.uk](https://data.gov.uk/)
- [GOV.UK API](https://content-api.publishing.service.gov.uk/)
- [Companies House](https://developer.company-information.service.gov.uk/)
- Local authority open data portals

Additional sources can be configured via a simple JSON descriptor.

## Success Metrics
- Number of new evidence items added per week
- Accuracy of project matching
- API usage cost per run

