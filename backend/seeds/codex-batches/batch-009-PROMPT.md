# Growth Map Codex Batch 9

You are working in the backend app root. Treat `seeds/` as the correct relative directory; do not prepend an extra `backend/`.

Research under-covered local authorities using deterministic, public-source evidence only.

## Authority List

| localAuthorityId | name | code | regionName | countryCode |
|------------------|------|------|------------|-------------|
| 061f24d2-8db5-4afe-88c0-903d34abb795 | East Hertfordshire | E07000242 | East of England | ENGLAND |
| 83569b61-4cbf-469e-b2ce-0f29a4eedb30 | East Lindsey | E07000137 | East Midlands | ENGLAND |
| 9c5d53b8-ee3d-4ad0-8e23-be31d153e006 | Epping Forest | E07000072 | East of England | ENGLAND |
| 65ca3a9a-2d96-465c-bb8c-355d59246c6c | Middlesbrough | E06000002 | North East | ENGLAND |
| 15541f0a-5a34-489d-a3c5-7841be2f3ab2 | North West Leicestershire | E07000134 | East Midlands | ENGLAND |
| 5dd82acf-6049-4194-a85b-edfc88d13d5c | Nuneaton and Bedworth | E07000219 | West Midlands | ENGLAND |
| 85268d52-2dd4-48f8-a379-aa576f28c1d9 | Redcar and Cleveland | E06000003 | North East | ENGLAND |
| ef751ea7-5965-4415-9e1e-f84dfe31d207 | Sandwell | E08000028 | West Midlands | ENGLAND |
| a0087b01-90e7-45ed-8563-f065eb387081 | Sevenoaks | E07000111 | South East | ENGLAND |
| 1b158d1b-185f-4751-9999-86bc44dfdf18 | South Tyneside | E08000023 | North East | ENGLAND |
| 1782fb1e-571c-4131-882c-1852f829e384 | Tameside | E08000008 | North West | ENGLAND |
| 3fc2ec4a-f23a-4ef0-b677-c009c475238f | Tewkesbury | E07000083 | South West | ENGLAND |
| bb526d3d-dbca-4b62-8a9e-19f03a3b1a6b | Tonbridge and Malling | E07000115 | South East | ENGLAND |
| 5d888fca-fb02-4c1d-913d-9eb1a57c32fe | Cheltenham | E07000078 | South West | ENGLAND |
| 0d41e09c-c374-4867-aaee-8fb8d3dd16e8 | Guildford | E07000209 | South East | ENGLAND |
| 38d6224d-7d80-402f-8ae1-4927b7a3241f | Portsmouth | E06000044 | Unassigned | ENGLAND |
| 29e30f64-1b2e-4e30-9959-b90c23b7807a | Bassetlaw | E07000171 | East Midlands | ENGLAND |
| 572c1490-ae94-4374-b165-5a16dc43f668 | Southend-on-Sea | E06000033 | East of England | ENGLAND |

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
