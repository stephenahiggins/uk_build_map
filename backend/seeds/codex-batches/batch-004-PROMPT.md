# Growth Map Codex Batch 4

Research under-covered local authorities using deterministic, public-source evidence only.

## Authority List

| localAuthorityId | name | code | regionName | countryCode |
|------------------|------|------|------------|-------------|
| d90db92e-7ad8-4e34-9b01-cc8168e432ee | West Suffolk | E07000245 | East of England | ENGLAND |
| fd54eb81-620d-4f25-88f4-44d16c1dd5d2 | East Riding of Yorkshire | E06000011 | Yorkshire and the Humber | ENGLAND |
| d951ce9f-7115-411c-965c-102e236b37d1 | North Tyneside | E08000022 | North East | ENGLAND |
| e689fd0a-47d4-496b-9d20-293836d5bae7 | Teignbridge | E07000045 | South West | ENGLAND |
| c24a9e15-f34c-4d4a-acf5-362522d5db93 | Croydon | E09000008 | London | ENGLAND |
| 11877e29-f3a9-48b6-adf0-d28cb5f5e2d6 | Dover | E07000108 | South East | ENGLAND |
| 80db8ea7-c47b-4285-90a3-80975ddb2f24 | Hyndburn | E07000120 | North West | ENGLAND |
| 27c18fd5-c335-4cda-881f-9422c60481d7 | Isles of Scilly | E06000053 | Unassigned | ENGLAND |
| 82b718ba-034c-41ff-beea-0631e38c5efe | North Hertfordshire | E07000099 | East of England | ENGLAND |
| e0439480-b49f-4636-8c37-9671272c7635 | Peterborough | E06000031 | East of England | ENGLAND |
| f1ec1447-4992-41af-aaff-a9a2e97011f5 | Redbridge | E09000026 | London | ENGLAND |
| 1ad44592-d118-4e3c-9390-c155ca91fca7 | Reigate and Banstead | E07000211 | South East | ENGLAND |
| 594ce1a6-620d-427d-902a-d84b7e921ac1 | South Gloucestershire | E06000025 | South West | ENGLAND |
| 0f33e97f-93e5-4f97-b690-b2731f378c3a | South Holland | E07000140 | East Midlands | ENGLAND |
| 68b15a6a-4fef-4c8e-af8e-42b21fab15f5 | Adur | E07000223 | Unassigned | ENGLAND |
| 41bb52e2-1c91-4c1f-ac76-96aa169068b7 | Chelmsford | E07000070 | East of England | ENGLAND |
| 5fb44e2e-f5a4-444c-86de-228564de50f6 | Chorley | E07000118 | North West | ENGLAND |
| ec7bacad-6fd4-49d8-b03b-f385edceae36 | Dartford | E07000107 | South East | ENGLAND |

## Scope

- Find verifiable infrastructure, regeneration, transport, utilities, civic estate, or flood-resilience projects.
- Prefer official local authority, combined authority, Planning Inspectorate, Contracts Finder, Find a Tender, or reputable local news sources.
- Prioritise projects with evidence from the last 24 months.
- Do not invent URLs or citations.

## Output

Return only a JSON array. Each object should include:

- `id`
- `title`
- `description`
- `type`
- `regionId`
- `localAuthorityId`
- `createdById` = `1`
- `status`
- `statusRationale`
- `latitude`, `longitude`, `locationDescription`, `locationSource`, `locationConfidence` when supported by evidence
- `evidence`: array with `type`, `title`, `source`, `url`, `datePublished`, `summary`

Save the JSON array to `backend/seeds/codex-batches/out/batch-004.json`.
