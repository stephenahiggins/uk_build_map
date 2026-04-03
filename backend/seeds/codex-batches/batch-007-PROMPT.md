# Growth Map Codex Batch 7

Research under-covered local authorities using deterministic, public-source evidence only.

## Authority List

| localAuthorityId | name | code | regionName | countryCode |
|------------------|------|------|------------|-------------|
| 5debc648-a144-4627-aac6-84e5b9973a9f | Colchester | E07000071 | East of England | ENGLAND |
| 16483efb-f5b8-40b7-a5ee-92de3bb4daf4 | Mid Sussex | E07000228 | South East | ENGLAND |
| 455ee169-1b26-48ec-bb4c-e27f54121c08 | North Norfolk | E07000147 | East of England | ENGLAND |
| 9db29c9f-fb30-42d5-b6a2-4de7303bc610 | St. Helens | E08000013 | North West | ENGLAND |
| b5c82f1a-f6dd-455c-b215-d179931976f7 | Stoke-on-Trent | E06000021 | West Midlands | ENGLAND |
| 79fd5cc0-d051-4fff-b14d-2b091a17ae1f | Swale | E07000113 | South East | ENGLAND |
| 342d04fd-d711-44d1-811d-2dd7a28bc365 | Tandridge | E07000215 | South East | ENGLAND |
| 76c1ad20-5680-40ad-9485-cd47cfd4fdd3 | Watford | E07000103 | East of England | ENGLAND |
| c9e5ea3e-c751-4789-bb68-580befd37617 | Tamworth | E07000199 | West Midlands | ENGLAND |
| 175678cf-60cf-473c-8ddc-ddf99e6c46ae | Burnley | E07000117 | North West | ENGLAND |
| 477bad74-9175-4081-aa92-ba38262782bf | Derbyshire Dales | E07000035 | East Midlands | ENGLAND |
| 57fdb475-af3a-4bef-96c8-447b65bd627e | Vale of White Horse | E07000180 | South East | ENGLAND |
| dfa0cab3-b5ed-4352-8df2-0a5e42065d78 | Dacorum | E07000096 | East of England | ENGLAND |
| f5a751c5-f5ae-432d-a898-4cff1275795a | Hammersmith and Fulham | E09000013 | London | ENGLAND |
| fdc9a069-655c-42a5-8f80-818a34506c18 | Hillingdon | E09000017 | London | ENGLAND |
| 31455f7b-45c1-43a5-98ef-9c65fd7472ca | South Derbyshire | E07000039 | East Midlands | ENGLAND |
| 4913c47e-4926-4305-ba51-1f01707f1d0b | Sutton | E09000029 | London | ENGLAND |
| 5d1ac344-2735-4c65-8dab-54b3e922fcb7 | West Berkshire | E06000037 | South East | ENGLAND |

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

Save the JSON array to `backend/seeds/codex-batches/out/batch-007.json`.
