# Growth Map Codex Batch 15

You are working in the backend app root. Treat `seeds/` as the correct relative directory; do not prepend an extra `backend/`.

Research under-covered local authorities using deterministic, public-source evidence only.

## Authority List

| localAuthorityId | name | code | regionName | countryCode |
|------------------|------|------|------------|-------------|
| 861eed51-03df-41c1-bf31-c834ccb4bd5f | Coventry | E08000026 | West Midlands | ENGLAND |
| 24578131-915e-4e3e-a16c-bf08b745e434 | Elmbridge | E07000207 | South East | ENGLAND |
| 0a7eec36-8501-4ac4-94fa-b6307157e0c0 | Dorset | E06000059 | South West | ENGLAND |
| e01658e6-54f1-4d6c-9948-0426515f110c | Medway | E06000035 | South East | ENGLAND |
| 5e98d753-9efc-435b-af85-566487322ae2 | Preston | E07000123 | North West | ENGLAND |
| ce54087d-802c-47e1-8a93-7a92394a5bb1 | Stafford | E07000197 | West Midlands | ENGLAND |
| d946cf16-c1dd-48f0-8ad1-b1f5605f43d8 | Hinckley and Bosworth | E07000132 | East Midlands | ENGLAND |
| c8342b98-d53e-4234-b1a5-3103487c2009 | Sheffield | E08000019 | Yorkshire and the Humber | ENGLAND |
| 991a2631-5af6-4f86-bd50-5031229ec62d | Bournemouth, Christchurch and Poole | E06000058 | South West | ENGLAND |
| fe0e49eb-12d2-47cd-872d-67ac9ee31036 | Leicester | E06000016 | East Midlands | ENGLAND |
| 39c841e8-274c-4a3d-b0ce-ff7218c2c6c3 | Wyre Forest | E07000239 | West Midlands | ENGLAND |
| 9ad351cc-4523-4686-a05c-1caf186c0083 | Gateshead | E08000037 | North East | ENGLAND |
| c0410e92-f833-49c2-8e5f-84f5d4754cd8 | Nottingham | E06000018 | East Midlands | ENGLAND |
| 90d5f587-9e3a-4439-ba00-fb44ebd20573 | Hackney | E09000012 | London | ENGLAND |
| 0192253e-0ea6-4a2b-a195-1065b63f5acb | Wakefield | E08000036 | Yorkshire and the Humber | ENGLAND |
| ae2526bd-34ae-489f-a153-bcbdeca3f463 | Barnsley | E08000016 | Yorkshire and the Humber | ENGLAND |
| f34a541e-702a-4cf2-92a9-eb6660ad8483 | Basildon | E07000066 | East of England | ENGLAND |
| aae3ef62-d578-4f92-ab26-fdf1fd4826c1 | Bristol, City of | E06000023 | South West | ENGLAND |

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
