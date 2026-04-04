# Growth Map Codex Batch 6

Research under-covered local authorities using deterministic, public-source evidence only.

## Authority List

| localAuthorityId | name | code | regionName | countryCode |
|------------------|------|------|------------|-------------|
| 47f68eb2-2bd2-4740-9ff6-d5b8437f453b | Rushcliffe | E07000176 | East Midlands | ENGLAND |
| 32d9f262-14b8-40d9-be66-260afe1ec33c | Woking | E07000217 | South East | ENGLAND |
| 9d25a482-0d07-49da-b6f1-521ec3ad62c5 | Crawley | E07000226 | South East | ENGLAND |
| 1fc80db5-b0c9-48f6-b8a3-c4ab3bcf5ec1 | Thanet | E07000114 | South East | ENGLAND |
| 311939d0-af21-4e6b-adbe-14f6b57b15a8 | Ashfield | E07000170 | East Midlands | ENGLAND |
| 89ba0b58-baf3-4a7c-9ca9-d82c41059681 | Bracknell Forest | E06000036 | South East | ENGLAND |
| 4df67854-7f50-4b8d-b431-93adfdd800dc | Rochdale | E08000005 | North West | ENGLAND |
| c3069c84-6135-4764-8f30-cbbe22981484 | Test Valley | E07000093 | South East | ENGLAND |
| 9878daec-1cee-4b83-a68e-ce03d8b1d2de | Amber Valley | E07000032 | East Midlands | ENGLAND |
| ec85a970-c47d-44d0-b364-f299c48263ec | Chesterfield | E07000034 | East Midlands | ENGLAND |
| b6b03ea9-7fd5-47cc-83e5-cb923aa2bba2 | Cotswold | E07000079 | South West | ENGLAND |
| 7bd12193-1e9d-48e3-a51a-e66f29db6e47 | Cumberland | E06000063 | North West | ENGLAND |
| 3a9d3532-ce84-41e9-a5a6-4ebcf29f2988 | East Staffordshire | E07000193 | East Midlands | ENGLAND |
| 42efa97b-cf9c-4ae4-b7ce-f0ef1f5518e4 | Folkestone and Hythe | E07000112 | South East | ENGLAND |
| 45831c76-dafc-4769-8a03-85a7c1623627 | Lincoln | E07000138 | East Midlands | ENGLAND |
| 4c223c00-c1eb-43d7-9c49-0e05626166bf | Newcastle-under-Lyme | E07000195 | West Midlands | ENGLAND |
| ebc3c1e0-496e-4ae6-a066-5d6f3d65a565 | Somerset | E06000066 | South West | ENGLAND |
| 342d04fd-d711-44d1-811d-2dd7a28bc365 | Tandridge | E07000215 | South East | ENGLAND |

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

Save the JSON array to `backend/seeds/codex-batches/out/batch-006.json`.
