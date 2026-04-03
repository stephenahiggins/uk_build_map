# Growth Map Codex Batch 16

Research under-covered local authorities using deterministic, public-source evidence only.

## Authority List

| localAuthorityId | name | code | regionName | countryCode |
|------------------|------|------|------------|-------------|
| 5ac3471e-3804-4aa6-93ae-e20f0806ce27 | Barnet | E09000003 | London | ENGLAND |
| 3ef6ec68-3e98-4bee-8136-31abee8d9ce3 | Newham | E09000025 | London | ENGLAND |
| 0a32fab9-c39d-45f7-b09d-9bc0ef49919e | Manchester | E08000003 | North West | ENGLAND |
| 368988bf-37ca-48cc-9fb7-24d510bed8fb | Hastings | E07000062 | South East | ENGLAND |
| 8025f679-fb6f-49fb-8b1e-0f9a9396b8cf | Calderdale | E08000033 | Yorkshire and the Humber | ENGLAND |
| 678a997b-6a4e-4a74-a304-af6ba65bae29 | Exeter | E07000041 | South West | ENGLAND |
| 6f235cd3-f603-4c15-b42c-d567c200a3b8 | Tower Hamlets | E09000030 | London | ENGLAND |
| 84546d10-3514-4002-b391-93ee787d4c5f | Wolverhampton | E08000031 | West Midlands | ENGLAND |
| f39f2f94-072a-40a0-babb-af97997f1a5f | Haringey | E09000014 | London | ENGLAND |
| bf43c2c4-faec-4bba-b278-42c7b3d7f27d | Horsham | E07000227 | South East | ENGLAND |
| 2a6eb4bc-cd1f-4c14-ae0d-647ae499dfdc | Trafford | E08000009 | North West | ENGLAND |
| 14085765-b2f6-4bde-9ea5-6f7ae0dbba30 | Slough | E06000039 | South East | ENGLAND |
| a775e6b5-e0c0-4259-8c92-d9a3b9510068 | Gloucester | E07000081 | South West | ENGLAND |
| 54812331-ef56-4ee0-8aa2-308a16a39c82 | Great Yarmouth | E07000145 | East of England | ENGLAND |
| ceffd80f-96a7-44d5-9f47-e50f18a41da1 | Harlow | E07000073 | East of England | ENGLAND |
| 81c87fa4-2637-4f67-88fd-1bdda7237ae7 | Camden | E09000007 | London | ENGLAND |
| 4e9417bf-f787-4de4-b133-63cc43f724a1 | Norwich | E07000148 | East of England | ENGLAND |
| 89197ab7-89a3-4a38-86fb-f72f21f3e521 | Enfield | E09000010 | London | ENGLAND |

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

Save the JSON array to `backend/seeds/codex-batches/out/batch-016.json`.
