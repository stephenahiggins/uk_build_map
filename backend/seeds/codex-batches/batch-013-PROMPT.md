# Growth Map Codex Batch 13

Research under-covered local authorities using deterministic, public-source evidence only.

## Authority List

| localAuthorityId | name | code | regionName | countryCode |
|------------------|------|------|------------|-------------|
| 0871ae5f-12f0-4fdd-a225-31464ca0a2ae | Blackpool | E06000009 | North West | ENGLAND |
| c43f0394-ce3e-44bd-b757-872975fd6cd2 | Solihull | E08000029 | West Midlands | ENGLAND |
| 1f94fb79-1821-46be-b1e2-7f22bd0d7af1 | County Durham | E06000047 | North East | ENGLAND |
| 3416b16a-946a-4bed-b1ef-d0f6bb219530 | Cheshire East | E06000049 | North West | ENGLAND |
| 4c20d442-3d63-4ea2-9056-ce2042c0b583 | Huntingdonshire | E07000011 | East of England | ENGLAND |
| a000dccd-285c-4e72-a57f-4913f58c5a31 | West Lindsey | E07000142 | East Midlands | ENGLAND |
| 9f137a19-a0df-49f7-afd2-4069462499b3 | Wigan | E08000010 | North West | ENGLAND |
| 1d315c4c-7ac6-4fa3-a378-db6108e709bf | Blaby | E07000129 | East Midlands | ENGLAND |
| 56733ec9-49f1-401a-8d5b-5cc99d6485d0 | Brent | E09000005 | London | ENGLAND |
| f9e5f7df-73a6-47ad-a033-4ff9199ee374 | Salford | E08000006 | North West | ENGLAND |
| 929b6c99-e2d5-437e-ae6a-60cfb16f0060 | Darlington | E06000005 | North East | ENGLAND |
| eb713df5-5ed3-4ec7-be9a-ab8b8d0373dd | North Somerset | E06000024 | South West | ENGLAND |
| de278ff3-97fd-4e36-9d36-498aaf3de9e8 | Newark and Sherwood | E07000175 | East Midlands | ENGLAND |
| 814d26be-4a5a-4b6f-9c62-df6fbb1369c6 | Northumberland | E06000057 | North East | ENGLAND |
| 8877dc28-1f35-4641-9e18-e378ae0c1ee4 | Eastbourne | E07000061 | South East | ENGLAND |
| a8c9f880-1b45-4f30-aa1a-fa1d63f0bc01 | Waltham Forest | E09000031 | London | ENGLAND |
| 5d6ab247-42b5-4f3a-8aef-227771b99e68 | Bath and North East Somerset | E06000022 | South West | ENGLAND |
| a5680ade-8bd2-4ab7-9acf-e72fe75a27c6 | Harrow | E09000015 | London | ENGLAND |

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

Save the JSON array to `backend/seeds/codex-batches/out/batch-013.json`.
