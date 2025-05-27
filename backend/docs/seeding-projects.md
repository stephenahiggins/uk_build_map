# Seeding Projects from JSON

This guide explains how to seed national, regional, and local projects into your database from a JSON file using Prisma.

## JSON File Format

- The file should contain an array of project objects.
- Each object must include all fields required by your Prisma `project` model.
- Example (`projects.seed.json`):

```
[
  {
    "id": "hs2-proj-id",
    "title": "HS2 High Speed Rail",
    "description": "High Speed 2 (HS2) is a high-speed railway under construction in the UK, linking London, Birmingham, Manchester and Leeds.",
    "type": "NATIONAL_GOV",
    "regionId": "<region-id>",
    "localAuthorityId": "<local-authority-id>",
    "createdById": 1,
    "expectedCompletion": "2035-12-31T00:00:00Z",
    "status": "AMBER",
    "statusRationale": "Delays due to funding and planning changes.",
    "latitude": 51.5074,
    "longitude": -0.1278
  }
]
```

> You can generate this file using an LLM. Ensure all required fields match your Prisma schema.

## Running the Seeder

1. Place your JSON file in the `seeds/` directory (recommended), e.g., `seeds/national-starter.json`.
2. Run the seeder using the Makefile, specifying the path to your JSON file with the `SEED` variable:

**Example command:**
```sh
make seed-projects SEED=seeds/national-starter.json
```

This will run the seeding script inside your Docker container, using the specified JSON file.

> You can use any valid JSON file matching the schema, and place it anywhere, but `seeds/` is the recommended location for organization.

### Advanced: Run directly with ts-node

You can also run the script directly (outside Docker):

```
npx ts-node scripts/seedProjectsFromFile.ts seeds/national-starter.json
```

Or add to `package.json` scripts:

```
"seed:projects": "ts-node scripts/seedProjectsFromFile.ts seeds/national-starter.json"
```

## Notes
- The script uses `upsert`, so existing projects with the same `id` will not be duplicated.
- This script can be adapted for other models by changing the Prisma call and JSON structure.
- Make sure referenced IDs (e.g., `regionId`, `localAuthorityId`, `createdById`) exist in your database.

---

## LLM Prompt: Generate UK National Projects Seed File

You can use the following prompt with an LLM (e.g. GPT-4, Claude, Gemini) to generate a JSON file of national UK government projects that fits the schema used by this seeding system.

### Reference: Assignable Region IDs

Use one of the following regionIds for each project:

| regionId                                 | Region Name                   |
|-------------------------------------------|-------------------------------|
| 08e79b78-35f5-437b-8093-84d87c32d68c     | North East                    |
| 0f2e7b9c-4567-4f45-8d27-9cd8ae47085c     | West Midlands                 |
| 14060d3a-d235-407d-80f2-ebdf212b3eb7     | London                        |
| 64633c9f-8cfe-4a86-8879-bb94dd016fe8     | East of England               |
| b89b48af-cea4-499e-84cf-d09df887cf1e     | South West                    |
| c6730010-e864-44a0-a5f6-61b92d159568     | North West                    |
| cdde5565-2090-4f98-9fbf-f990d7825dcc     | Yorkshire and the Humber      |
| ef368261-a5b7-415b-9b12-6edcce90ec3b     | South East                    |
| fdbd0e13-9106-4820-814b-86640a681197     | East Midlands                 |

### Reference: Assignable Local Authority IDs

Optionally, you may assign a localAuthorityId from the following list. If you do, make sure its `regionId` matches the regionId you assign to the project.

| localAuthorityId                          | Local Authority Name                | Region Name                   | regionId                                 |
|--------------------------------------------|-------------------------------------|-------------------------------|-------------------------------------------|
| 027899bb-df8f-441e-bc73-0c72a2eebd1c      | Bath and North East Somerset        | South West                    | b89b48af-cea4-499e-84cf-d09df887cf1e     |

---

## LLM Prompt: Generate EvidenceItem Seed Data

You can use the following prompt with an LLM (e.g. GPT-4, Claude, Gemini) to generate a JSON array of evidence items for UK projects. This is designed to fit the Prisma `EvidenceItem` model and your current seeding system.

### Evidence Type Enum

Each evidence item must include a `type` property. Allowed values are:

```prisma
enum EvidenceType {
  PDF
  URL
  TEXT
  DATE
}
```

Set `type` to the appropriate value for each evidence item:
- `URL`: For web articles, news, official online sources
- `PDF`: For downloadable PDF documents
- `TEXT`: For plain text, summaries, or transcriptions
- `DATE`: For date-only evidence (rare)

### LLM Prompt

You are an expert research assistant. Your task is to collect credible, up-to-date evidence from the web for a list of UK infrastructure and public works projects. For each project, find at least 3–5 high-quality evidence items (such as news articles, official press releases, government documents, or reputable reports) that provide updates, context, challenges, progress, or outcomes related to the project.

For each evidence item, output a JSON object with the following properties:
- `projectId`: The ID of the project this evidence relates to.
- `title`: Title of the evidence item (e.g., article headline).
- `type`: The type of evidence. Must be one of: `URL`, `PDF`, `TEXT`, `DATE`.
- `source`: Publisher or website name.
- `url`: The URL of the evidence item (if applicable).
- `datePublished`: Publication date (ISO string or 'YYYY-MM-DD').
- `summary`: 1–2 sentence summary of the evidence and its relevance to the project.
- `submittedById`: Always set this to `adminUser?.user_id ?? 1,` (required for seeding).

**Example JSON:**
```json
[
  {
    "projectId": "fccb723d-b3b7-495a-a005-735092cc48d4",
    "title": "Elland Rail Station project takes another step forward",
    "type": "URL",
    "source": "Calderdale Council News",
    "url": "https://news.calderdale.gov.uk/10618-2/",
    "datePublished": "2024-09-05",
    "summary": "Progress on the new Elland Rail Station has taken a major step forward after a contractor was appointed to finalize the project’s detailed design. On-site surveys are underway and a full business case will follow by mid-2025, paving the way for final approval and the start of construction.",
    "submittedById": "adminUser?.user_id ?? 1"
  },
  {
    "projectId": "fccb723d-b3b7-495a-a005-735092cc48d4",
    "title": "Elland Rail Station Moves Forward: West Yorkshire’s £25m Transport Boost on Track",
    "type": "URL",
    "source": "BDC Magazine",
    "url": "https://bdcmagazine.com/2024/01/elland-rail-station-moves-forward-west-yorkshires-25m-transport-boost-on-track/",
    "datePublished": "2024-01-03",
    "summary": "Plans for the new £25 million Elland Rail Station are making significant progress, with completion now projected for late 2026. Contractor Keltbray is aiming to finish the final design stage by summer 2024, after which the West Yorkshire Combined Authority will review the full business case to move the project into the construction phase.",
    "submittedById": "adminUser?.user_id ?? 1"
  },
  {
    "projectId": "fccb723d-b3b7-495a-a005-735092cc48d4",
    "title": "New train station moves a step closer",
    "type": "URL",
    "source": "BBC News (LDRS)",
    "url": "https://www.bbc.com/news/articles/cred40g5v2qo",
    "datePublished": "2024-09-06",
    "summary": "A contractor has been appointed to oversee the final development stages of Elland’s new railway station, which will be added to the Calder Valley Line and is now expected to open in 2026. Keltbray Infrastructure Services will complete detailed design work by next summer, after which the project can proceed to final approval and then construction, according to local officials.",
    "submittedById": "adminUser?.user_id ?? 1"
  }
]
```

---

**Note:**
- In your actual seed TypeScript file, use `datePublished: new Date('YYYY-MM-DD')` instead of a string.
- The above is for LLM or JSON generation; when pasting into your seed file, convert date strings to `new Date('YYYY-MM-DD')` as shown in the working seed.ts examples below.

### Real-World Example (TypeScript for seeding)

```typescript
{
  projectId: 'fccb723d-b3b7-495a-a005-735092cc48d4',
  title: 'Elland Rail Station project takes another step forward',
  submittedById: adminUser?.user_id ?? 1,
  type: 'URL',
  source: 'Calderdale Council News',
  datePublished: new Date('2024-09-05'),
  url: 'https://news.calderdale.gov.uk/10618-2/',
  summary:
    'Progress on the new Elland Rail Station has taken a major step forward after a contractor was appointed to finalize the project’s detailed design. On-site surveys are underway and a full business case will follow by mid-2025, paving the way for final approval and the start of construction.',
},
{
  projectId: 'fccb723d-b3b7-495a-a005-735092cc48d4',
  title: 'Elland Rail Station Moves Forward: West Yorkshire’s £25m Transport Boost on Track',
  submittedById: adminUser?.user_id ?? 1,
  type: 'URL',
  source: 'BDC Magazine',
  datePublished: new Date('2024-01-03'),
  url: 'https://bdcmagazine.com/2024/01/elland-rail-station-moves-forward-west-yorkshires-25m-transport-boost-on-track/',
  summary:
    'Plans for the new £25 million Elland Rail Station are making significant progress, with completion now projected for late 2026. Contractor Keltbray is aiming to finish the final design stage by summer 2024, after which the West Yorkshire Combined Authority will review the full business case to move the project into the construction phase.',
},
{
  projectId: 'fccb723d-b3b7-495a-a005-735092cc48d4',
  title: 'New train station moves a step closer',
  submittedById: adminUser?.user_id ?? 1,
  type: 'URL',
  source: 'BBC News (LDRS)',
  datePublished: new Date('2024-09-06'),
  url: 'https://www.bbc.com/news/articles/cred40g5v2qo',
  summary:
    'A contractor has been appointed to oversee the final development stages of Elland’s new railway station, which will be added to the Calder Valley Line and is now expected to open in 2026. Keltbray Infrastructure Services will complete detailed design work by next summer, after which the project can proceed to final approval and then construction, according to local officials.',
},
```

**Instructions:**
- Use the web to gather the evidence.
- Output a JSON array as above.
- Ensure every evidence item includes the `type` property (see enum above) and `submittedById: adminUser?.user_id ?? 1,`.
- Use the actual project IDs as shown in the project reference table above.
- Use the actual publication date if available.
- If a field is not available, leave it as `null` or omit it.

| 0279267b-a734-480e-812b-bf54d5d897cb      | East Hertfordshire                  | East of England               | 64633c9f-8cfe-4a86-8879-bb94dd016fe8     |
| 0497832d-d5ed-41ad-a3fc-63b0eb396cdc      | Mid Devon                           | South West                    | b89b48af-cea4-499e-84cf-d09df887cf1e     |
| 062a6c42-92ff-4c20-a65b-b9a845dd12f9      | Gravesham                           | South East                    | ef368261-a5b7-415b-9b12-6edcce90ec3b     |
| 07744bf0-584a-4ee2-8dea-e62b8dfba733      | Medway                              | South East                    | ef368261-a5b7-415b-9b12-6edcce90ec3b     |
| 0877876b-e0ad-4e79-ae21-58ef14848a04      | South Norfolk                       | East of England               | 64633c9f-8cfe-4a86-8879-bb94dd016fe8     |
| 090509c8-c51d-4577-acd7-c8b4327a4a60      | Exeter                              | South West                    | b89b48af-cea4-499e-84cf-d09df887cf1e     |
| 098dab24-348f-464f-b853-2e6046f32f7a      | West Devon                          | South West                    | b89b48af-cea4-499e-84cf-d09df887cf1e     |
| 0bbe01e9-e28c-4483-b6db-02e9ff9d5c4f      | Manchester City Council             | North West                    | c6730010-e864-44a0-a5f6-61b92d159568     |
| ... (see documentation for full list)      |                                     |                               |                                           |

*For the full list of assignable localAuthorityIds, see the documentation or data source.*

---


You can use the following prompt with an LLM (e.g. GPT-4, Claude, Gemini) to generate a JSON file of national UK government projects that fits the schema used by this seeding system.

```
I want you to search the web for all major national infrastructure projects currently undertaken or managed by the UK government. For each project you find, output a JSON object matching the following schema:

{
  "id": "string (unique project identifier, e.g. slug or UUID)",
  "title": "string (project name)",
  "description": "string (concise summary of the project)",
  "type": "NATIONAL_GOV",
  "regionId": "<regionId from the provided regionId table above>",
  "localAuthorityId": "<optional: localAuthorityId from the table above, matching the regionId>",
  "createdById": 1,
  "expectedCompletion": "YYYY-MM-DDTHH:MM:SSZ (ISO date, if known)",
  "status": "string (e.g. GREEN, AMBER, RED, or other status if available)",
  "statusRationale": "string (reason for current status, if available)",
  "latitude": number (project centroid latitude, if available),
  "longitude": number (project centroid longitude, if available)
}

- Output an array of such objects, in valid JSON format.
- Only include projects that are national in scope (e.g., HS2, national broadband rollout, nuclear power stations, etc.).
- For `regionId`, select a value from the provided regionId table above.
- For `localAuthorityId`, you may leave as null or select a value from the localAuthorityId table above, but only if its regionId matches the project's regionId.
- For `createdById`, always use 1.
- For `expectedCompletion`, use the best available public estimate or leave as null.
- For `status` and `statusRationale`, use any available public reporting or leave as null.
- For `latitude` and `longitude`, use the main project location or centroid if available, otherwise leave as null.

**How to generate the file:**
1. Search the web for up-to-date lists of UK national government projects (e.g., gov.uk, National Audit Office, Infrastructure and Projects Authority, news sources).
2. Extract the relevant details for each project.
3. Format the results as a JSON array matching the schema above.
4. Output only the JSON array, with no extra commentary.

**Example output:**
[
  {
    "id": "hs2-proj-id",
    "title": "HS2 High Speed Rail",
    "description": "High Speed 2 (HS2) is a high-speed railway under construction in the UK, linking London, Birmingham, Manchester and Leeds.",
    "type": "NATIONAL_GOV",
    "regionId": "<region-id>",
    "localAuthorityId": "<local-authority-id>",
    "createdById": 1,
    "expectedCompletion": "2035-12-31T00:00:00Z",
    "status": "AMBER",
    "statusRationale": "Delays due to funding and planning changes.",
    "latitude": 51.5074,
    "longitude": -0.1278
  }
]

Please return the result as a valid JSON file suitable for direct import into a database seeding script.
```
