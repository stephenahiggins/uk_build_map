# Growth Map Codex Batch 12

You are working in the backend app root. Treat `seeds/` as the correct relative directory; do not prepend an extra `backend/`.

Research under-covered local authorities using deterministic, public-source evidence only.

## Authority List

| localAuthorityId | name | code | regionName | countryCode |
|------------------|------|------|------------|-------------|
| 0871ae5f-12f0-4fdd-a225-31464ca0a2ae | Blackpool | E06000009 | North West | ENGLAND |
| 54d099bf-5db6-4bdf-8e53-86e0594a9799 | Stratford-on-Avon | E07000221 | West Midlands | ENGLAND |
| 3c6b3bd7-4b20-473e-9760-149830f49231 | North Devon | E07000043 | South West | ENGLAND |
| c43f0394-ce3e-44bd-b757-872975fd6cd2 | Solihull | E08000029 | West Midlands | ENGLAND |
| 32078f80-82c9-4156-8a0c-ea4d3379b89e | Wiltshire | E06000054 | South West | ENGLAND |
| 1f94fb79-1821-46be-b1e2-7f22bd0d7af1 | County Durham | E06000047 | North East | ENGLAND |
| 1a13033a-7cf6-40da-b7db-658832c3250d | Doncaster | E08000017 | Yorkshire and the Humber | ENGLAND |
| 1e7725f8-ed24-485b-8ad8-98cd209ebfd0 | Hartlepool | E06000001 | North East | ENGLAND |
| 74b00795-04f3-4525-9481-98487a7ae43d | Merton | E09000024 | London | ENGLAND |
| 41cb4145-8c3b-4bf4-a4fb-139f173b7b80 | Milton Keynes | E06000042 | South East | ENGLAND |
| a000dccd-285c-4e72-a57f-4913f58c5a31 | West Lindsey | E07000142 | East Midlands | ENGLAND |
| 9f137a19-a0df-49f7-afd2-4069462499b3 | Wigan | E08000010 | North West | ENGLAND |
| c77a8255-6252-4556-920a-2b0d111748aa | Breckland | E07000143 | East of England | ENGLAND |
| 3416b16a-946a-4bed-b1ef-d0f6bb219530 | Cheshire East | E06000049 | North West | ENGLAND |
| 4c20d442-3d63-4ea2-9056-ce2042c0b583 | Huntingdonshire | E07000011 | East of England | ENGLAND |
| d8f1b9fc-ffe3-49ca-a9f7-f1059c0e965d | Mansfield | E07000174 | East Midlands | ENGLAND |
| cef65a66-6ad5-444b-9f9e-64813743fbf2 | North East Lincolnshire | E06000012 | Yorkshire and the Humber | ENGLAND |
| 9183543c-f7c6-469f-a856-e0446e9d3c99 | Ribble Valley | E07000124 | North West | ENGLAND |

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
