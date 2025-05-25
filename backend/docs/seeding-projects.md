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
