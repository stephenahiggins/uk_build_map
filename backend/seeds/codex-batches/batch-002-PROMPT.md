# Growth Map Codex Batch 2

You are working in the backend app root. Treat `seeds/` as the correct relative directory; do not prepend an extra `backend/`.

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
- Also look for obvious named sites and destination-led schemes inside each authority: heritage assets, landmarks, visitor attractions, waterfronts, stations, ports, town-centre gateways, major roads, hospitals, campuses, and world-heritage or nationally significant sites.
- Include projects led by councils, combined authorities, arm's-length bodies, National Highways, Network Rail, the Planning Inspectorate/DCO process, or central government where the project is physically located in the listed authority.
- Do not stop at generic council search terms. For each authority, explicitly try site-led searches such as "<authority> tunnel", "<authority> station redevelopment", "<authority> bypass", "<authority> town deal", "<authority> levelling up", "<authority> heritage restoration", "<authority> castle", "<authority> waterfront", "<authority> museum", "<authority> market hall", "<authority> world heritage", and "<authority> planning inspectorate".
- Prioritise projects that would be obvious to a local resident or reporter, including controversial or delayed schemes, not just live procurements.
- Prefer official local authority, combined authority, Planning Inspectorate, Contracts Finder, Find a Tender, or reputable local news sources.
- Prioritise projects with evidence from the last 24 months.
- Do not invent URLs or citations.

## Search Heuristics

- Start broad, then narrow to named sites. If an authority has a famous place, search the place name directly rather than relying only on the authority name.
- Prefer the most specific project title you can evidence, for example a named road scheme, station redevelopment, harbour programme, castle restoration, or tunnel proposal.
- Capture nationally significant projects that sit within a local authority boundary even if the sponsoring body is national rather than local.
- If multiple sources discuss the same obvious site, consolidate them into one project with stronger evidence instead of emitting several near-duplicates.
- Where a project is high-profile but stalled, litigated, or awaiting consent, keep it and set status/statusRationale accordingly.

## Output

Return only a JSON array in your final message. Do not write files. Each object should include:

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
