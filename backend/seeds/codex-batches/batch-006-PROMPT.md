# Growth Map Codex Batch 6

You are working in the backend app root. Treat `seeds/` as the correct relative directory; do not prepend an extra `backend/`.

Research under-covered local authorities using deterministic, public-source evidence only.

## Authority List

| localAuthorityId | name | code | regionName | countryCode |
|------------------|------|------|------------|-------------|
| 342d04fd-d711-44d1-811d-2dd7a28bc365 | Tandridge | E07000215 | South East | ENGLAND |
| 76c1ad20-5680-40ad-9485-cd47cfd4fdd3 | Watford | E07000103 | East of England | ENGLAND |
| 5debc648-a144-4627-aac6-84e5b9973a9f | Colchester | E07000071 | East of England | ENGLAND |
| 16483efb-f5b8-40b7-a5ee-92de3bb4daf4 | Mid Sussex | E07000228 | South East | ENGLAND |
| 455ee169-1b26-48ec-bb4c-e27f54121c08 | North Norfolk | E07000147 | East of England | ENGLAND |
| 47f68eb2-2bd2-4740-9ff6-d5b8437f453b | Rushcliffe | E07000176 | East Midlands | ENGLAND |
| 9db29c9f-fb30-42d5-b6a2-4de7303bc610 | St. Helens | E08000013 | North West | ENGLAND |
| b5c82f1a-f6dd-455c-b215-d179931976f7 | Stoke-on-Trent | E06000021 | West Midlands | ENGLAND |
| 79fd5cc0-d051-4fff-b14d-2b091a17ae1f | Swale | E07000113 | South East | ENGLAND |
| 32d9f262-14b8-40d9-be66-260afe1ec33c | Woking | E07000217 | South East | ENGLAND |
| c9e5ea3e-c751-4789-bb68-580befd37617 | Tamworth | E07000199 | West Midlands | ENGLAND |
| 175678cf-60cf-473c-8ddc-ddf99e6c46ae | Burnley | E07000117 | North West | ENGLAND |
| 9d25a482-0d07-49da-b6f1-521ec3ad62c5 | Crawley | E07000226 | South East | ENGLAND |
| 311939d0-af21-4e6b-adbe-14f6b57b15a8 | Ashfield | E07000170 | East Midlands | ENGLAND |
| 89ba0b58-baf3-4a7c-9ca9-d82c41059681 | Bracknell Forest | E06000036 | South East | ENGLAND |
| dfa0cab3-b5ed-4352-8df2-0a5e42065d78 | Dacorum | E07000096 | East of England | ENGLAND |
| 477bad74-9175-4081-aa92-ba38262782bf | Derbyshire Dales | E07000035 | East Midlands | ENGLAND |
| 4df67854-7f50-4b8d-b431-93adfdd800dc | Rochdale | E08000005 | North West | ENGLAND |

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

Save the JSON array to `seeds/codex-batches/out/batch-006.json`.
