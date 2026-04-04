# Growth Map Codex Batch 1

Research under-covered local authorities using deterministic, public-source evidence only.

## Authority List

| localAuthorityId | name | code | regionName | countryCode |
|------------------|------|------|------------|-------------|
| 56afd3c8-b958-4620-9d00-42a26319154f | Isle of Wight | E06000046 | South East | ENGLAND |
| 04ccc3be-b55d-4bff-8812-6f0788807d2f | Redditch | E07000236 | West Midlands | ENGLAND |
| 12849c58-4a1e-41db-b3cf-b2696170e4cd | Castle Point | E07000069 | East of England | ENGLAND |
| b33ec5d9-8112-4793-b540-961ba09d1fc5 | Mid Devon | E07000042 | South West | ENGLAND |
| 8a75c1ed-7176-4dba-803c-e03aaeea310e | Rother | E07000064 | South East | ENGLAND |
| b6363a2d-dd76-4bc4-b220-a333fe3cce0e | Sefton | E08000014 | North West | ENGLAND |
| d9a99eef-a4b8-4753-a1fa-465f430a0b36 | Welwyn Hatfield | E07000241 | East of England | ENGLAND |
| 1a375801-aa11-4183-b770-50ddf8da615b | Broxtowe | E07000172 | East Midlands | ENGLAND |
| fa731498-63b7-42ae-99a1-113526fb7b4b | Central Bedfordshire | E06000056 | East of England | ENGLAND |
| eb069eae-ca05-473e-bbde-02c3f3e2a85a | Epsom and Ewell | E07000208 | South East | ENGLAND |
| c40c4dac-6ca9-43e3-a0c5-e7ed00589331 | Halton | E06000006 | Unassigned | ENGLAND |
| 26181f9a-8e89-4fef-8923-1e0ff3fecc12 | North Yorkshire | E06000065 | Yorkshire and the Humber | ENGLAND |
| 1a8a9bca-852d-4a65-8574-54cf638079b5 | Shropshire | E06000051 | West Midlands | ENGLAND |
| c66ff654-a1e1-4f34-8882-d96060c07e73 | Southampton | E06000045 | South East | ENGLAND |
| 08526dcf-19b7-4fd7-9d57-7122623c3a64 | Sunderland | E08000024 | North East | ENGLAND |
| 6f34243b-9c71-47a7-bafd-3b077c0e8730 | Wyre | E07000128 | North West | ENGLAND |
| 7cacddfe-642c-423a-82f6-bca2c378799a | Bolsover | E07000033 | East Midlands | ENGLAND |
| 3696dbbc-1ac8-4b07-b1fc-0dbf1b09801f | Boston | E07000136 | East Midlands | ENGLAND |

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

Save the JSON array to `backend/seeds/codex-batches/out/batch-001.json`.
