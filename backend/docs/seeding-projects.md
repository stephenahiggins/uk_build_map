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

1. Place your JSON file in the backend directory (e.g., `projects.seed.json`).
2. Run the script:

```
npx ts-node scripts/seedProjectsFromFile.ts projects.seed.json
```

Or add to `package.json` scripts:

```
"seed:projects": "ts-node scripts/seedProjectsFromFile.ts projects.seed.json"
```

## Notes
- The script uses `upsert`, so existing projects with the same `id` will not be duplicated.
- This script can be adapted for other models by changing the Prisma call and JSON structure.
- Make sure referenced IDs (e.g., `regionId`, `localAuthorityId`, `createdById`) exist in your database.

---

## LLM Prompt: Generate UK National Projects Seed File

You can use the following prompt with an LLM (e.g. GPT-4, Claude, Gemini) to generate a JSON file of national UK government projects that fits the schema used by this seeding system.

```
I want you to search the web for all major national infrastructure projects currently undertaken or managed by the UK government. For each project you find, output a JSON object matching the following schema:

{
  "id": "string (unique project identifier, e.g. slug or UUID)",
  "title": "string (project name)",
  "description": "string (concise summary of the project)",
  "type": "NATIONAL_GOV",
  "regionId": "<region-id or leave as placeholder>",
  "localAuthorityId": "<local-authority-id or leave as placeholder>",
  "createdById": 1,
  "expectedCompletion": "YYYY-MM-DDTHH:MM:SSZ (ISO date, if known)",
  "status": "string (e.g. GREEN, AMBER, RED, or other status if available)",
  "statusRationale": "string (reason for current status, if available)",
  "latitude": number (project centroid latitude, if available),
  "longitude": number (project centroid longitude, if available)
}

- Output an array of such objects, in valid JSON format.
- Only include projects that are national in scope (e.g., HS2, national broadband rollout, nuclear power stations, etc.).
- For `regionId` and `localAuthorityId`, use placeholders (e.g., "<region-id>") if you do not have the actual IDs.
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
