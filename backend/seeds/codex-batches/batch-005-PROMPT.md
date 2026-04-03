# Growth Map Codex Batch 5

Research under-covered local authorities using deterministic, public-source evidence only.

## Authority List

| localAuthorityId | name | code | regionName | countryCode |
|------------------|------|------|------------|-------------|
| ecb73cb6-20fb-4a6c-97a5-4361fe4a3e3a | Erewash | E07000036 | East Midlands | ENGLAND |
| 0f79e13f-e088-45c6-8e6a-ba611cbad87f | Gosport | E07000088 | South East | ENGLAND |
| 5fcfa4b5-237f-4277-bd7d-520622031cf0 | Lancaster | E07000121 | North West | ENGLAND |
| 54481931-acce-441c-ad13-792953123fc5 | North East Derbyshire | E07000038 | East Midlands | ENGLAND |
| 5332eea4-682a-4e56-bb3d-909f4398b15b | Pendle | E07000122 | North West | ENGLAND |
| 3a6d9613-ba44-4884-826e-4dd5a898d1ce | South Hams | E07000044 | South West | ENGLAND |
| d1f5beb1-9690-4ae5-a2b9-8426cfc18b1e | South Ribble | E07000126 | North West | ENGLAND |
| 0b1c9730-2667-40fd-ac45-92d80a367e5b | South Staffordshire | E07000196 | West Midlands | ENGLAND |
| 0f3f9f7c-fd17-4372-8fe1-d46f497fcb8f | Staffordshire Moorlands | E07000198 | West Midlands | ENGLAND |
| 0feec820-58dd-4751-bc5e-d910b4190be4 | Stevenage | E07000243 | East of England | ENGLAND |
| aa18f7ef-eb31-485f-9978-0d841adc80aa | Tunbridge Wells | E07000116 | South East | ENGLAND |
| 3988df7a-9b26-431a-a710-84f4641a4e7b | Worthing | E07000229 | South East | ENGLAND |
| 3537dd5a-0b7e-4775-b7dd-3342d54de939 | Ashford | E07000105 | South East | ENGLAND |
| c01c2169-8b2d-4633-82fa-bfc58e817882 | Bromsgrove | E07000234 | West Midlands | ENGLAND |
| 4da24c01-f0c0-4b74-aff3-0244727668a9 | Havering | E09000016 | London | ENGLAND |
| 894c5daa-df59-4b85-a87a-1b3f768ca0d3 | Islington | E09000019 | London | ENGLAND |
| f0455ea9-5b2c-44f6-84ae-17d80f0ff54d | Reading | E06000038 | South East | ENGLAND |
| 32d2c506-e6e8-499e-b27f-adb92c1f34f3 | Rossendale | E07000125 | North West | ENGLAND |

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

Save the JSON array to `backend/seeds/codex-batches/out/batch-005.json`.
