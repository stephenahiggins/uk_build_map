# Growth Map Codex Batch 7

You are working in the backend app root. Treat `seeds/` as the correct relative directory; do not prepend an extra `backend/`.

Research under-covered local authorities using deterministic, public-source evidence only.

## Authority List

| localAuthorityId | name | code | regionName | countryCode |
|------------------|------|------|------------|-------------|
| 5d1ac344-2735-4c65-8dab-54b3e922fcb7 | West Berkshire | E06000037 | South East | ENGLAND |
| 89ba0b58-baf3-4a7c-9ca9-d82c41059681 | Bracknell Forest | E06000036 | South East | ENGLAND |
| ec85a970-c47d-44d0-b364-f299c48263ec | Chesterfield | E07000034 | East Midlands | ENGLAND |
| b6b03ea9-7fd5-47cc-83e5-cb923aa2bba2 | Cotswold | E07000079 | South West | ENGLAND |
| 7bd12193-1e9d-48e3-a51a-e66f29db6e47 | Cumberland | E06000063 | North West | ENGLAND |
| 42efa97b-cf9c-4ae4-b7ce-f0ef1f5518e4 | Folkestone and Hythe | E07000112 | South East | ENGLAND |
| 45831c76-dafc-4769-8a03-85a7c1623627 | Lincoln | E07000138 | East Midlands | ENGLAND |
| 4c223c00-c1eb-43d7-9c49-0e05626166bf | Newcastle-under-Lyme | E07000195 | West Midlands | ENGLAND |
| 4df67854-7f50-4b8d-b431-93adfdd800dc | Rochdale | E08000005 | North West | ENGLAND |
| ebc3c1e0-496e-4ae6-a066-5d6f3d65a565 | Somerset | E06000066 | South West | ENGLAND |
| c3069c84-6135-4764-8f30-cbbe22981484 | Test Valley | E07000093 | South East | ENGLAND |
| bc9d43a6-2bc0-4037-8bfe-2ff5e657c160 | Cheshire West and Chester | E06000050 | North West | ENGLAND |
| 6b3bdaf4-2dc0-4491-b5ec-ef9426d998fc | Gravesham | E07000109 | South East | ENGLAND |
| f5a751c5-f5ae-432d-a898-4cff1275795a | Hammersmith and Fulham | E09000013 | London | ENGLAND |
| fdc9a069-655c-42a5-8f80-818a34506c18 | Hillingdon | E09000017 | London | ENGLAND |
| 87427552-d71f-47f8-9329-5edf90d6af12 | North Kesteven | E07000139 | East Midlands | ENGLAND |
| 31455f7b-45c1-43a5-98ef-9c65fd7472ca | South Derbyshire | E07000039 | East Midlands | ENGLAND |
| 4913c47e-4926-4305-ba51-1f01707f1d0b | Sutton | E09000029 | London | ENGLAND |

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
