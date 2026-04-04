# Growth Map Codex Batch 3

You are working in the backend app root. Treat `seeds/` as the correct relative directory; do not prepend an extra `backend/`.

Research under-covered local authorities using deterministic, public-source evidence only.

## Authority List

| localAuthorityId | name | code | regionName | countryCode |
|------------------|------|------|------------|-------------|
| 684166e5-794a-45e7-9b24-5ce898db4715 | Hart | E07000089 | South East | ENGLAND |
| 9b977417-5e3a-4c47-bba7-ea1bfb7fc7cf | High Peak | E07000037 | East Midlands | ENGLAND |
| e4cf69d7-f5c7-48e0-b646-4c46773f5bb7 | Kingston upon Thames | E09000021 | London | ENGLAND |
| f192e426-9f23-4f03-a5be-08aa7e0a3699 | Maldon | E07000074 | Unassigned | ENGLAND |
| f741388a-f4e2-49f5-977b-dcf17a75d0a3 | Melton | E07000133 | East Midlands | ENGLAND |
| 20509f09-89e9-4ccf-a48b-f36af473e37c | Rugby | E07000220 | West Midlands | ENGLAND |
| 860739d8-e2a7-4dea-b4cd-a90584c29031 | South Oxfordshire | E07000179 | South East | ENGLAND |
| c029a725-1c3e-431f-8dd3-d37c0af1755f | Telford and Wrekin | E06000020 | West Midlands | ENGLAND |
| 2331c02a-6411-44c3-a795-128e08e9ee6d | West Lancashire | E07000127 | North West | ENGLAND |
| b905e93e-1918-4ff8-b1af-e13ccabd7b68 | Worcester | E07000237 | West Midlands | ENGLAND |
| eab1fa0f-b6fd-4f3c-8230-f74d48588035 | Bury | E08000002 | North West | ENGLAND |
| 3d764659-b3e6-4d0b-bc56-8ac1e07e3aaf | Kensington and Chelsea | E09000020 | London | ENGLAND |
| b472768f-ae31-4358-b378-ddd3b9c41051 | North Warwickshire | E07000218 | West Midlands | ENGLAND |
| 1344add6-5fe2-4e68-9a6f-8300a0238d83 | Rushmoor | E07000092 | South East | ENGLAND |
| 91fe8b17-0c86-4f0e-9518-342da911a301 | South Kesteven | E07000141 | East Midlands | ENGLAND |
| b287a159-9b3d-4d7e-a635-a0eb98650e2d | Three Rivers | E07000102 | East of England | ENGLAND |
| 6d909733-2d4c-45f4-838c-bbbd3577e8cd | Wirral | E08000015 | North West | ENGLAND |
| e40fd0f5-a7d8-43c3-8b8a-e9b26d13fca9 | Wealden | E07000065 | South East | ENGLAND |

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

Save the JSON array to `seeds/codex-batches/out/batch-003.json`.
