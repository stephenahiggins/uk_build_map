# Growth Map Codex Batch 2

Research under-covered local authorities using deterministic, public-source evidence only.

## Authority List

| localAuthorityId | name | code | regionName | countryCode |
|------------------|------|------|------------|-------------|
| 00bc7835-970c-4876-8d81-e6a5c9595f5c | Wandsworth | E09000032 | London | ENGLAND |
| 6f34243b-9c71-47a7-bafd-3b077c0e8730 | Wyre | E07000128 | North West | ENGLAND |
| 09fa2982-ea4f-4206-a9c3-0577830ce00c | Broxbourne | E07000095 | East of England | ENGLAND |
| 625db3b5-baeb-42c9-9fc7-03427e0cae2d | City of London | E09000001 | London | ENGLAND |
| b06217cc-29da-4991-90d2-7c1c2ae08ee9 | Hertsmere | E07000098 | East of England | ENGLAND |
| 5308ed4d-331a-49ef-b207-e0dbd90130d1 | Runnymede | E07000212 | South East | ENGLAND |
| d62b55cf-3543-4cf8-a982-aaac041ea7c7 | Surrey Heath | E07000214 | South East | ENGLAND |
| 04db7ce9-76cf-4ad6-ac66-c762d67cb0ee | Torridge | E07000046 | South West | ENGLAND |
| 587654ed-f27c-43bf-8a88-1e5a0e3f1760 | Warwick | E07000222 | West Midlands | ENGLAND |
| 6148e973-871b-48b6-bf49-96d74a448450 | Waverley | E07000216 | South East | ENGLAND |
| 2bc5e6ac-fa4e-476d-a18e-dc61b02c48ea | Wychavon | E07000238 | West Midlands | ENGLAND |
| 53ac3a0e-fa9e-4874-8801-2209272aab5f | Broadland | E07000144 | East of England | ENGLAND |
| 30428149-cba0-4d0f-925a-84428a8245d0 | Canterbury | E07000106 | South East | ENGLAND |
| 3061db65-662a-42ce-98d4-662b8829abe2 | Eastleigh | E07000086 | South East | ENGLAND |
| 9b977417-5e3a-4c47-bba7-ea1bfb7fc7cf | High Peak | E07000037 | East Midlands | ENGLAND |
| e4cf69d7-f5c7-48e0-b646-4c46773f5bb7 | Kingston upon Thames | E09000021 | London | ENGLAND |
| f741388a-f4e2-49f5-977b-dcf17a75d0a3 | Melton | E07000133 | East Midlands | ENGLAND |
| 20509f09-89e9-4ccf-a48b-f36af473e37c | Rugby | E07000220 | West Midlands | ENGLAND |

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
