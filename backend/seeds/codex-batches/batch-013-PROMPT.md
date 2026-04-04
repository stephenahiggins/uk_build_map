# Growth Map Codex Batch 13

You are working in the backend app root. Treat `seeds/` as the correct relative directory; do not prepend an extra `backend/`.

Research under-covered local authorities using deterministic, public-source evidence only.

## Authority List

| localAuthorityId | name | code | regionName | countryCode |
|------------------|------|------|------------|-------------|
| 0871ae5f-12f0-4fdd-a225-31464ca0a2ae | Blackpool | E06000009 | North West | ENGLAND |
| c43f0394-ce3e-44bd-b757-872975fd6cd2 | Solihull | E08000029 | West Midlands | ENGLAND |
| 1f94fb79-1821-46be-b1e2-7f22bd0d7af1 | County Durham | E06000047 | North East | ENGLAND |
| a000dccd-285c-4e72-a57f-4913f58c5a31 | West Lindsey | E07000142 | East Midlands | ENGLAND |
| 9f137a19-a0df-49f7-afd2-4069462499b3 | Wigan | E08000010 | North West | ENGLAND |
| 3416b16a-946a-4bed-b1ef-d0f6bb219530 | Cheshire East | E06000049 | North West | ENGLAND |
| 4c20d442-3d63-4ea2-9056-ce2042c0b583 | Huntingdonshire | E07000011 | East of England | ENGLAND |
| 1d315c4c-7ac6-4fa3-a378-db6108e709bf | Blaby | E07000129 | East Midlands | ENGLAND |
| 56733ec9-49f1-401a-8d5b-5cc99d6485d0 | Brent | E09000005 | London | ENGLAND |
| f9e5f7df-73a6-47ad-a033-4ff9199ee374 | Salford | E08000006 | North West | ENGLAND |
| 929b6c99-e2d5-437e-ae6a-60cfb16f0060 | Darlington | E06000005 | North East | ENGLAND |
| eb713df5-5ed3-4ec7-be9a-ab8b8d0373dd | North Somerset | E06000024 | South West | ENGLAND |
| de278ff3-97fd-4e36-9d36-498aaf3de9e8 | Newark and Sherwood | E07000175 | East Midlands | ENGLAND |
| 814d26be-4a5a-4b6f-9c62-df6fbb1369c6 | Northumberland | E06000057 | North East | ENGLAND |
| 5d6ab247-42b5-4f3a-8aef-227771b99e68 | Bath and North East Somerset | E06000022 | South West | ENGLAND |
| 8877dc28-1f35-4641-9e18-e378ae0c1ee4 | Eastbourne | E07000061 | South East | ENGLAND |
| a8c9f880-1b45-4f30-aa1a-fa1d63f0bc01 | Waltham Forest | E09000031 | London | ENGLAND |
| a5680ade-8bd2-4ab7-9acf-e72fe75a27c6 | Harrow | E09000015 | London | ENGLAND |

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

Save the JSON array to `seeds/codex-batches/out/batch-013.json`.
