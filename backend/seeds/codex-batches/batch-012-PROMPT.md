# Growth Map Codex Batch 12

Research under-covered local authorities using deterministic, public-source evidence only.

## Authority List

| localAuthorityId | name | code | regionName | countryCode |
|------------------|------|------|------------|-------------|
| 3c6b3bd7-4b20-473e-9760-149830f49231 | North Devon | E07000043 | South West | ENGLAND |
| 32078f80-82c9-4156-8a0c-ea4d3379b89e | Wiltshire | E06000054 | South West | ENGLAND |
| 74b00795-04f3-4525-9481-98487a7ae43d | Merton | E09000024 | London | ENGLAND |
| 41cb4145-8c3b-4bf4-a4fb-139f173b7b80 | Milton Keynes | E06000042 | South East | ENGLAND |
| 54d099bf-5db6-4bdf-8e53-86e0594a9799 | Stratford-on-Avon | E07000221 | West Midlands | ENGLAND |
| c77a8255-6252-4556-920a-2b0d111748aa | Breckland | E07000143 | East of England | ENGLAND |
| 1a13033a-7cf6-40da-b7db-658832c3250d | Doncaster | E08000017 | Yorkshire and the Humber | ENGLAND |
| 1e7725f8-ed24-485b-8ad8-98cd209ebfd0 | Hartlepool | E06000001 | North East | ENGLAND |
| cef65a66-6ad5-444b-9f9e-64813743fbf2 | North East Lincolnshire | E06000012 | Yorkshire and the Humber | ENGLAND |
| 9183543c-f7c6-469f-a856-e0446e9d3c99 | Ribble Valley | E07000124 | North West | ENGLAND |
| 90db78e8-e501-4aac-abd9-8a5d46562cfe | Braintree | E07000067 | East of England | ENGLAND |
| 655643b4-044b-4423-b4c9-e16bb75c0244 | Gedling | E07000173 | East Midlands | ENGLAND |
| d8f1b9fc-ffe3-49ca-a9f7-f1059c0e965d | Mansfield | E07000174 | East Midlands | ENGLAND |
| 0018cde8-819c-4320-ae8c-0a1ac18dd344 | Mole Valley | E07000210 | South East | ENGLAND |
| 73dc1a7b-988d-4f1c-8ee2-7b8d01ff8bf0 | Warrington | E06000007 | North West | ENGLAND |
| 4b50870d-6c3a-4878-bc51-d13eb7b443fa | Arun | E07000224 | South East | ENGLAND |
| ee3cd39e-1937-41d8-8855-b137bfd735c0 | Richmond upon Thames | E09000027 | London | ENGLAND |
| 61ab05cf-5212-4632-b04f-fb9585633336 | Southwark | E09000028 | London | ENGLAND |

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

Save the JSON array to `backend/seeds/codex-batches/out/batch-012.json`.
