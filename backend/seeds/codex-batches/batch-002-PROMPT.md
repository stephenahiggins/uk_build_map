# Growth Map Codex Batch 2

Research under-covered local authorities using deterministic, public-source evidence only.

## Authority List

| localAuthorityId | name | code | regionName | countryCode |
|------------------|------|------|------------|-------------|
| 95924b8c-df87-4994-89c9-1ec1e8cb21ef | Brentwood | E07000068 | East of England | ENGLAND |
| 00bc7835-970c-4876-8d81-e6a5c9595f5c | Wandsworth | E09000032 | London | ENGLAND |
| 587654ed-f27c-43bf-8a88-1e5a0e3f1760 | Warwick | E07000222 | West Midlands | ENGLAND |
| 6148e973-871b-48b6-bf49-96d74a448450 | Waverley | E07000216 | South East | ENGLAND |
| 09fa2982-ea4f-4206-a9c3-0577830ce00c | Broxbourne | E07000095 | East of England | ENGLAND |
| 625db3b5-baeb-42c9-9fc7-03427e0cae2d | City of London | E09000001 | London | ENGLAND |
| b06217cc-29da-4991-90d2-7c1c2ae08ee9 | Hertsmere | E07000098 | East of England | ENGLAND |
| 5308ed4d-331a-49ef-b207-e0dbd90130d1 | Runnymede | E07000212 | South East | ENGLAND |
| d62b55cf-3543-4cf8-a982-aaac041ea7c7 | Surrey Heath | E07000214 | South East | ENGLAND |
| 04db7ce9-76cf-4ad6-ac66-c762d67cb0ee | Torridge | E07000046 | South West | ENGLAND |
| 2bc5e6ac-fa4e-476d-a18e-dc61b02c48ea | Wychavon | E07000238 | West Midlands | ENGLAND |
| 30428149-cba0-4d0f-925a-84428a8245d0 | Canterbury | E07000106 | South East | ENGLAND |
| 04b84554-6687-4755-852d-df78aadcdc31 | Stockport | E08000007 | North West | ENGLAND |
| 78d875a9-73b6-4a30-b7b7-36b77a2bd359 | West Oxfordshire | E07000181 | South East | ENGLAND |
| 3295781f-4494-4519-9479-002e6017a2cd | Bexley | E09000004 | London | ENGLAND |
| 53ac3a0e-fa9e-4874-8801-2209272aab5f | Broadland | E07000144 | East of England | ENGLAND |
| 3061db65-662a-42ce-98d4-662b8829abe2 | Eastleigh | E07000086 | South East | ENGLAND |
| 99ed5a23-a490-40e5-bfc9-369398a40844 | Fylde | E07000119 | North West | ENGLAND |

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

Save the JSON array to `backend/seeds/codex-batches/out/batch-002.json`.
