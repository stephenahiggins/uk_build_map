# Growth Map Codex Batch 9

Research under-covered local authorities using deterministic, public-source evidence only.

## Authority List

| localAuthorityId | name | code | regionName | countryCode |
|------------------|------|------|------------|-------------|
| 83569b61-4cbf-469e-b2ce-0f29a4eedb30 | East Lindsey | E07000137 | East Midlands | ENGLAND |
| 9c5d53b8-ee3d-4ad0-8e23-be31d153e006 | Epping Forest | E07000072 | East of England | ENGLAND |
| 65ca3a9a-2d96-465c-bb8c-355d59246c6c | Middlesbrough | E06000002 | North East | ENGLAND |
| 85268d52-2dd4-48f8-a379-aa576f28c1d9 | Redcar and Cleveland | E06000003 | North East | ENGLAND |
| 061f24d2-8db5-4afe-88c0-903d34abb795 | East Hertfordshire | E07000242 | East of England | ENGLAND |
| 15541f0a-5a34-489d-a3c5-7841be2f3ab2 | North West Leicestershire | E07000134 | East Midlands | ENGLAND |
| 5dd82acf-6049-4194-a85b-edfc88d13d5c | Nuneaton and Bedworth | E07000219 | West Midlands | ENGLAND |
| ef751ea7-5965-4415-9e1e-f84dfe31d207 | Sandwell | E08000028 | West Midlands | ENGLAND |
| 1b158d1b-185f-4751-9999-86bc44dfdf18 | South Tyneside | E08000023 | North East | ENGLAND |
| 1782fb1e-571c-4131-882c-1852f829e384 | Tameside | E08000008 | North West | ENGLAND |
| bb526d3d-dbca-4b62-8a9e-19f03a3b1a6b | Tonbridge and Malling | E07000115 | South East | ENGLAND |
| 5d888fca-fb02-4c1d-913d-9eb1a57c32fe | Cheltenham | E07000078 | South West | ENGLAND |
| 0d41e09c-c374-4867-aaee-8fb8d3dd16e8 | Guildford | E07000209 | South East | ENGLAND |
| 38d6224d-7d80-402f-8ae1-4927b7a3241f | Portsmouth | E06000044 | Unassigned | ENGLAND |
| a0087b01-90e7-45ed-8563-f065eb387081 | Sevenoaks | E07000111 | South East | ENGLAND |
| 3fc2ec4a-f23a-4ef0-b677-c009c475238f | Tewkesbury | E07000083 | South West | ENGLAND |
| 29e30f64-1b2e-4e30-9959-b90c23b7807a | Bassetlaw | E07000171 | East Midlands | ENGLAND |
| 572c1490-ae94-4374-b165-5a16dc43f668 | Southend-on-Sea | E06000033 | East of England | ENGLAND |

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

Save the JSON array to `backend/seeds/codex-batches/out/batch-009.json`.
