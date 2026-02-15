# LFG Agents Project

A TypeScript/Node.js project for managing local government projects with AI-powered evidence analysis. The project uses Prisma for database operations, defaults to OpenAI (GPT-5 mini) for analysis, and includes web scraping and RAG (Retrieval-Augmented Generation) capabilities. Gemini is also supported.

## CLI Usage (Infrastructure Discovery & Evidence Gathering)

The project ships with a CLI (`src/cli.ts`) that can search for infrastructure projects in a locale, gather evidence, RAG score them, and persist results to the database.

### Basic Run (from `agents/` only)
```bash
cd agents
npm run build
node dist/cli.js --locale "West Yorkshire"
```

UK-wide:
```bash
cd agents
npm run build
node dist/cli.js --uk-wide
```
The UK-wide mode now includes all local authorities in addition to nations and English regions.

### Staged Run (no DB writes)
```bash
cd agents
npm run build
node dist/cli.js --uk-wide --stage
```

### Commit Staged Data
```bash
cd agents
npm run build
node dist/cli.js commit-staged --all
```

### Key Flags
| Flag | Description | Default |
|------|-------------|---------|
| `--locale <string>` | Geographic area / region / list of authorities | `West Yorkshire` |
| `--uk-wide` | Run a UK-wide search across nations and English regions | off |
| `--fetch <number>` | Minimum number of projects to retrieve from the model (prompt target) | `100` |
| `--limit <number>` | Maximum number of projects to process (omit = process all fetched) | all fetched |
| `--max-evidence <number>` | Evidence items to gather per project | `10` |
| `--concurrency <number>` | Parallel project workers (1–10) | `3` |
| `--no-llm` | Disable LLM calls and use mock outputs where possible | off |
| `--llm-budget <number>` | Max LLM calls before falling back to mock outputs | unlimited |
| `--connectors <list>` | Comma-separated connector list (e.g. `local-json`) | from `CONNECTORS` |
| `--connectors-only` | Skip LLM discovery and rely on connectors only | off |
| `--since <date>` | Incremental pull from connectors since `YYYY-MM-DD` | off |
| `--stage` | Write results to staging instead of committing to the database | off |
| `--provider <provider>` | LLM provider override (`openai` or `gemini`) | from `PROVIDER` |

> **Tip:** Pass a comma-separated list to `--locale` (e.g. `"Bradford, Calderdale, Kirklees"`) and the CLI will treat each area as its own search pass (plus the combined region), rotating through themed prompts until it accumulates at least the requested `--fetch` unique projects while deduplicating titles between passes.

### Example: Fetch 120, Process First 40, 8 Evidence Each
```bash
make run ARGS="--locale 'Bradford, Calderdale, Kirklees, Leeds and Wakefield, West Yorkshire Combined Authority' \
  --fetch 120 --limit 40 --max-evidence 8 --concurrency 5"
```

### Switch Provider (Gemini)
```bash
make run ARGS="--provider gemini --locale 'West Yorkshire' --fetch 50"
```

### UK-wide Discovery Run
```bash
make run ARGS="--uk-wide --fetch 200 --limit 50 --max-evidence 5 --concurrency 5"
```

### UK-wide Discovery Run (OpenAI via Make)
```bash
make run ARGS="--uk-wide --provider openai"
```

### Connectors-only Run
```bash
make run ARGS="--connectors local-json --connectors-only --since 2025-01-01 --limit 50"
```

### Backfill + Incremental Loop
```bash
npm run build
node dist/cli.js loop --uk-wide --backfill-fetch 200 --incremental-fetch 50 --interval-hours 24 --connectors local-json
```

### Compile National (Stage -> Commit -> Migrate)
```bash
make compile-national
```
Defaults can be overridden with env vars:
```bash
ITERATIONS=0 SLEEP_SECONDS=3600 FETCH=200 MAX_EVIDENCE=5 CONCURRENCY=4 PROVIDER=openai SINCE_DAYS=30 \
DATABASE_USER=root DATABASE_PASSWORD=123456 DATABASE_HOST=db DATABASE_PORT=3306 DATABASE_NAME=node_boilerplate \
make compile-national
```

### Commit Staged Runs
```bash
npm run build
node dist/cli.js commit-staged --all
```

### How to Pickup Where You Left Off
1. Commit any staged files (deduped by project title):
```bash
make agents-commit-staged
```
2. Migrate into the backend database:
```bash
make agents-migrate-to-backend MODE=append
```
3. Restart the national run:
```bash
make compile-national
```

### Process All Returned Projects
```bash
make run ARGS="--locale 'Greater Manchester' --fetch 150"
```

### Faster Dry Exploration (Few Projects, Low Evidence)
```bash
make run ARGS="--locale 'North East England' --fetch 30 --limit 10 --max-evidence 3 --concurrency 4"
```

### Log Output
The CLI truncates/rewrites `cli.log` each run and streams progress + evidence summaries. Inspect it for debugging:
```bash
tail -f cli.log
```

### Cost / Performance Notes
- Increasing `--fetch` raises LLM token usage (bigger response prompt/result).
- `--concurrency` > 5 may hit rate limits depending on your API quota.
- High `--max-evidence` multiplies total model calls (one per project).
- Start small, then scale.
- Use `--llm-budget` to cap LLM usage for a run and `--no-llm` for mock-only runs.
  - Note: mock-only runs do not pull real web evidence.
- If an OpenAI or Gemini rate limit/quota error occurs, the CLI will prompt you to enter a new API key or pause and retry.
- Staged commits deduplicate by normalized project title before writing to the database.

### Persistence
Projects + evidence are upserted via Prisma. Duplicate detection is heuristic (title / summary / URL). Re‑running with same locale won’t spam identical evidence.

## Migrating Scraped Data to the Backend Service

The CLI exposes a `migrate-backend` command that copies the SQLite data stored in `agents/prisma/storage/data.db` into the backend service database. The migration understands the backend Prisma schema (including decimal latitude/longitude fields) and can either replace or merge with existing backend projects.

```bash
make migrate-to-backend MODE=append BACKEND_URL="mysql://root:123456@localhost:3307/node_boilerplate"
```

### Migration Options

| Option | Description |
|--------|-------------|
| `--mode <append|override>` | `append` adds new projects/evidence without duplicating existing records (matched by project ID/title and evidence URL/source/title/summary). `override` clears backend projects and evidence before importing. |
| `--backend-env <path>` | Optional path to a backend `.env` file to resolve the backend `DATABASE_URL`. Defaults to `../backend/.env` relative to the repo root. |
| `--backend-url <url>` | Explicit backend database connection string. Takes precedence over environment files. |

If neither `--backend-url` nor `--backend-env` are provided, the command falls back to the `BACKEND_URL` environment variable. The agents database connection is always taken from `agents/.env`.

### Makefile Helper

From the repository root you can run the migration via Make:

```bash
make migrate-to-backend MODE=append
```

Additional parameters are passed through the `MODE`, `BACKEND_ENV`, and `BACKEND_URL` variables, for example:

```bash
make migrate-to-backend MODE=override BACKEND_ENV=backend/.env
make migrate-to-backend BACKEND_URL="mysql://user:pass@localhost:3306/node_boilerplate"
```

The migration ensures an admin user exists in the backend (creating one if needed) and logs its progress to `cli.log` alongside the scraping commands.

### Troubleshooting
| Symptom | Cause | Fix |
|---------|-------|-----|
| Fewer projects than requested | Model truncated / sparse domain | CLI now retries with different themes per locale, but you can still bump `--fetch` or broaden locale wording |
| JSON parse failure in search | Model added prose | Re-run; prompt enforces RAW JSON now |
| Very slow run | Too many projects * evidence | Lower `--limit` or `--max-evidence`, raise `--concurrency` moderately |
| Duplicate phases | Upstream overlapping descriptions | Manually curate or post‑filter by normalized title |

---

## Enhanced Evidence Gathering System

The project now includes comprehensive geographic and administrative data support for evidence gathering. This allows for precise location tracking and administrative boundary mapping of infrastructure projects.

### Key Features

#### Geographic Data Support
- **Latitude/Longitude Coordinates (Project-level)**: Projects can be tagged with precise geographic coordinates. Individual evidence items now inherit location context from their parent project.
- **Local Authority Mapping**: Automatic mapping of projects to their responsible local authorities
- **Regional Classification**: Projects are classified according to English regions (North East, North West, Yorkshire and the Humber, etc.)

#### Administrative Data
- **Local Authority Tracking**: Links projects to specific local authorities (e.g., "Leeds City Council", "Bradford Council")
- **Region Classification**: Maps to the nine English regions as defined in the Prisma schema
- **Geographic Validation**: Helper functions to validate and normalize region names and coordinates

### Database Schema

The enhanced schema includes:

```prisma
model Project {
  // ... existing fields
  latitude  Decimal? @db.Decimal(10, 7)
  longitude Decimal? @db.Decimal(10, 7)
  regionId           String?
  region             Region?         @relation(fields: [regionId], references: [id])
  localAuthorityId   String?
  localAuthority     LocalAuthority? @relation(fields: [localAuthorityId], references: [id])
}

model EvidenceItem {
  // ... existing fields
  // Latitude/Longitude removed – evidence inherits project location
}

model LocalAuthority {
  id          String      @id @default(uuid())
  name        String
  code        String      @unique
  website     String?
  countryCode CountryCode
  regionId    String
  projects    Project[]
}

model Region {
  id              String    @id @default(uuid())
  name            String    @unique
  boundingPolygon Json?
  projects        Project[]
}
```

### Evidence Gathering Parameters

The `gatherEvidenceWithGemini` function accepts the following parameters:

- `projectTitle` (string): The name of the infrastructure project
- `projectDescription` (string): A description of the project
- `locale` (string): The geographic area to search in
- `maxEvidencePieces` (number, optional): Maximum number of evidence pieces to gather (default: 10)

### DateTime Validation

The system includes comprehensive dateTime validation for evidence items:

- **Automatic Date Extraction**: Extracts dates from evidence text using multiple patterns
- **Date Validation**: Ensures dates are in valid YYYY-MM-DD format
- **Future Date Detection**: Prevents future dates from being used
- **Fallback Handling**: Uses current date if no valid date is found

### Usage Examples

#### 1. Search for Infrastructure Projects with Geographic Data

```typescript
import { searchInfrastructureProjects } from './src/geminiService';

const results = await searchInfrastructureProjects('West Yorkshire', 10);
console.log(`Found ${results.projects.length} projects:`);

results.projects.forEach(project => {
  console.log(`Project: ${project.title}`);
  console.log(`Location: ${project.latitude}, ${project.longitude}`);
  console.log(`Authority: ${project.localAuthority}`);
  console.log(`Region: ${project.region}`);
});
```

#### 2. Gather Evidence with Location Data

```typescript
import { gatherEvidenceWithGemini } from './src/geminiService';

// Gather evidence with default minimum (10 pieces)
const evidence = await gatherEvidenceWithGemini(
  'Transpennine Route Upgrade (TRU)',
  'Railway upgrade between Manchester, Leeds, and York',
  'West Yorkshire'
);

// Gather evidence with custom maximum (15 pieces)
const extensiveEvidence = await gatherEvidenceWithGemini(
  'Bradford City Centre Regeneration',
  'Multi-faceted regeneration effort including Bradford Live music venue',
  'West Yorkshire',
  15 // Specify maximum number of evidence pieces
);

console.log(`Gathered ${evidence.evidence.length} evidence items:`);
evidence.evidence.forEach(item => {
  console.log(`- ${item.title}`);
  console.log(`  Authority: ${item.localAuthority}, Region: ${item.region}`);
});
```

#### 3. Database Integration

```typescript
import { processEvidenceWithLocation } from './src/geminiService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Process evidence and store with geographic data
const processedEvidence = await processEvidenceWithLocation(
  prisma,
  evidence.evidence,
  'project-id-here',
  1 // submittedById
);
```

### Helper Functions

#### Geographic Utilities

```typescript
import { ENGLISH_REGIONS, normalizeRegion } from './src/geminiService';

// Validate & normalize region names
const region = normalizeRegion('Yorkshire and the Humber'); // => 'Yorkshire and the Humber' or null if invalid

// NOTE: Coordinate + authority-region resolution now happens implicitly when
// creating or enriching projects (see createProjectWithLocation / processEvidenceWithLocation).
// If you need explicit lookup helpers, add them to geminiService.ts.
```

#### Database Utilities

```typescript
import { 
  findOrCreateRegion,
  findOrCreateLocalAuthority 
} from './src/geminiService';

// Create or find region in database
const region = await findOrCreateRegion(prisma, 'Yorkshire and the Humber');

// Create or find local authority in database
const authority = await findOrCreateLocalAuthority(
  prisma, 
  'Leeds City Council', 
  region.id
);
```

#### DateTime Validation Utilities

```typescript
import { 
  validateEvidenceDate,
  extractEvidenceDate,
  processEvidenceWithDateTimeValidation 
} from './src/geminiService';

// Validate a single date
const validDate = validateEvidenceDate('2024-01-15'); // Returns '2024-01-15' or null

// Extract date from text
const extractedDate = extractEvidenceDate('Published on March 20, 2024'); // Returns '2024-03-20'

// Process evidence with dateTime validation
const validatedEvidence = processEvidenceWithDateTimeValidation(evidenceArray);
```

### Supported English Regions

The system supports all nine English regions:

1. North East
2. North West
3. Yorkshire and the Humber
4. East Midlands
5. West Midlands
6. East of England
7. London
8. South East
9. South West

### Local Authority Mapping

The system includes pre-mapped coordinates and region assignments for common local authorities:

- Leeds City Council → Yorkshire and the Humber
- Bradford Council → Yorkshire and the Humber
- Kirklees Council → Yorkshire and the Humber
- Calderdale Council → Yorkshire and the Humber
- Manchester City Council → North West
- Birmingham City Council → West Midlands
- And many more...

### Mock Data Support

For testing purposes, the system includes comprehensive mock data with realistic geographic coordinates and administrative mappings for West Yorkshire projects.

### Environment Variables

Make sure to set the following environment variables:

```bash
PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key
MODEL=gpt-5-mini
OPENAI_MODEL=gpt-4o-mini
GEMINI_MODEL=gemini-2.5-flash
DATABASE_URL=your_database_url
MOCK_INFRASTRUCTURE_SEARCH=false
MOCK_EVIDENCE_GATHERING=false
MOCK_EVIDENCE_ANALYSIS=false
MOCK_PROJECT_STATUS=false
NO_LLM=false
LLM_BUDGET=0
CONNECTORS=local-json
LOCAL_PROJECTS_JSON=./data/local-projects.json
```

`LLM_BUDGET` is optional. Set it to a positive integer to cap total LLM calls in a run. If unset, the budget is unlimited. `NO_LLM=true` skips API key validation and forces mock outputs where possible.

## Installation and Setup

1. Install dependencies:
```bash
npm install
```

2. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

3. (Optional) Seed or perform custom initial runs. There is currently no `npm run example` script—use the CLI instead (see above).

4. Run the complete workflow:
```bash
npm run example
```

## Complete System Features

The system now provides comprehensive support for:

### Project Management
- **Project Creation**: Create projects with geographic and administrative data
- **Project Updates**: Update project status, location, and metadata
- **Project Retrieval**: Get projects with all related evidence and objectives
- **Project Filtering**: Filter projects by region, status, type, and local authority

### Evidence Management
- **Evidence Gathering**: Automated evidence collection (location inherited from project)
- **Evidence Validation**: DateTime validation and duplicate detection
- **Evidence Moderation**: Moderation state management for evidence items
- **Evidence Processing**: Complete evidence processing with all schema fields

### User Management
- **System User**: Automatic system user creation for automated operations
- **User Creation**: Create users with proper roles and permissions
- **User Authentication**: User management for evidence submission

### Geographic Data
- **Region Management**: Automatic region creation and validation
- **Local Authority Mapping**: Local authority creation and region association
- **Coordinate Validation**: Geographic coordinate validation at the project level

### Database Operations
- **Complete CRUD**: Full Create, Read, Update, Delete operations
- **Relationship Management**: Proper handling of all Prisma relationships
- **Statistics**: Project and evidence statistics
- **Data Integrity**: Proper foreign key relationships and constraints

## Project Structure

```
src/
├── geminiService.ts    # Enhanced AI service with geographic support
├── dbOperations.ts     # Complete database operations
├── db.ts              # Legacy database utilities
├── types/
│   └── projectEvidence.ts
└── ...

prisma/
├── schema.prisma      # Updated schema with geographic fields
└── migrations/
```

## Contributing

When adding new features:

1. Follow the existing TypeScript patterns
2. Include proper error handling
3. Add geographic data where relevant
4. Update the mock data with realistic coordinates
5. Test with the example functions

## License

[Your License Here]
