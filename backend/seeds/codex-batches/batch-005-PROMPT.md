# Growth Map Codex Batch 5

You are working in the backend app root. Treat `seeds/` as the correct relative directory; do not prepend an extra `backend/`.

Research under-covered local authorities using deterministic, public-source evidence only.

## Authority List

| localAuthorityId | name | code | regionName | countryCode |
|------------------|------|------|------------|-------------|
| c01c2169-8b2d-4633-82fa-bfc58e817882 | Bromsgrove | E07000234 | West Midlands | ENGLAND |
| 41bb52e2-1c91-4c1f-ac76-96aa169068b7 | Chelmsford | E07000070 | East of England | ENGLAND |
| 5fb44e2e-f5a4-444c-86de-228564de50f6 | Chorley | E07000118 | North West | ENGLAND |
| ec7bacad-6fd4-49d8-b03b-f385edceae36 | Dartford | E07000107 | South East | ENGLAND |
| 0f79e13f-e088-45c6-8e6a-ba611cbad87f | Gosport | E07000088 | South East | ENGLAND |
| 5fcfa4b5-237f-4277-bd7d-520622031cf0 | Lancaster | E07000121 | North West | ENGLAND |
| 54481931-acce-441c-ad13-792953123fc5 | North East Derbyshire | E07000038 | East Midlands | ENGLAND |
| 5332eea4-682a-4e56-bb3d-909f4398b15b | Pendle | E07000122 | North West | ENGLAND |
| d1f5beb1-9690-4ae5-a2b9-8426cfc18b1e | South Ribble | E07000126 | North West | ENGLAND |
| 0b1c9730-2667-40fd-ac45-92d80a367e5b | South Staffordshire | E07000196 | West Midlands | ENGLAND |
| 0f3f9f7c-fd17-4372-8fe1-d46f497fcb8f | Staffordshire Moorlands | E07000198 | West Midlands | ENGLAND |
| 0feec820-58dd-4751-bc5e-d910b4190be4 | Stevenage | E07000243 | East of England | ENGLAND |
| aa18f7ef-eb31-485f-9978-0d841adc80aa | Tunbridge Wells | E07000116 | South East | ENGLAND |
| 3988df7a-9b26-431a-a710-84f4641a4e7b | Worthing | E07000229 | South East | ENGLAND |
| 4da24c01-f0c0-4b74-aff3-0244727668a9 | Havering | E09000016 | London | ENGLAND |
| 894c5daa-df59-4b85-a87a-1b3f768ca0d3 | Islington | E09000019 | London | ENGLAND |
| f0455ea9-5b2c-44f6-84ae-17d80f0ff54d | Reading | E06000038 | South East | ENGLAND |
| 32d2c506-e6e8-499e-b27f-adb92c1f34f3 | Rossendale | E07000125 | North West | ENGLAND |

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
